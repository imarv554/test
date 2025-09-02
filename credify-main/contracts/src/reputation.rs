/*!
CREDIFY Reputation Token Smart Contract

This contract implements a non-transferable reputation token system using CIS-2 standard.
Reputation tokens are earned through successful transactions and good behavior on the platform.

Features:
- Non-transferable reputation tokens
- Weighted scoring system
- Automated reputation updates
- Integration with escrow and dispute systems
- Reputation decay over time for inactive accounts
*/

use concordium_cis2::*;
use concordium_std::*;

// Contract state
#[derive(Serial, DeserialWithState)]
#[concordium(state_parameter = "S")]
pub struct ReputationState<S: HasStateApi> {
    /// Map from token ID to reputation data
    pub tokens: StateMap<TokenIdU32, ReputationData, S>,
    /// Map from account to their reputation score
    pub reputation_scores: StateMap<AccountAddress, u64, S>,
    /// Map from account to their reputation token ID
    pub account_tokens: StateMap<AccountAddress, TokenIdU32, S>,
    /// Next token ID to assign
    pub next_token_id: TokenIdU32,
    /// Admin account
    pub admin: AccountAddress,
    /// Escrow contract address (authorized to update reputation)
    pub escrow_contract: Option<ContractAddress>,
    /// Base reputation score for new accounts
    pub base_reputation: u64,
}

// Reputation data for each token
#[derive(Serialize, SchemaType, Clone)]
pub struct ReputationData {
    /// Account that owns this reputation token
    pub owner: AccountAddress,
    /// Current reputation score
    pub score: u64,
    /// Number of successful transactions as buyer
    pub buyer_transactions: u64,
    /// Number of successful transactions as seller
    pub seller_transactions: u64,
    /// Number of disputes lost
    pub disputes_lost: u64,
    /// Number of disputes won
    pub disputes_won: u64,
    /// Timestamp of last activity
    pub last_activity: Timestamp,
    /// Total value of transactions (in microCCD)
    pub total_transaction_value: u64,
    /// Account verification level
    pub verification_level: VerificationLevel,
}

// Account verification levels
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq, Debug)]
pub enum VerificationLevel {
    /// Unverified account
    None,
    /// Basic identity verification
    Basic,
    /// Full identity verification with KYC
    Full,
    /// Professional/Business verification
    Professional,
}

// Contract initialization parameters
#[derive(Serialize, SchemaType)]
pub struct InitParams {
    pub admin: AccountAddress,
    pub base_reputation: u64,
}

// Custom update parameters (beyond CIS-2)
#[derive(Serialize, SchemaType)]
pub enum ReputationUpdateParams {
    /// Update reputation after successful transaction
    UpdateFromTransaction {
        account: AccountAddress,
        transaction_value: Amount,
        is_buyer: bool,
    },
    /// Update reputation after dispute resolution
    UpdateFromDispute {
        winner: AccountAddress,
        loser: AccountAddress,
        dispute_value: Amount,
    },
    /// Set account verification level
    SetVerificationLevel {
        account: AccountAddress,
        level: VerificationLevel,
    },
    /// Set escrow contract address (admin only)
    SetEscrowContract {
        contract_address: ContractAddress,
    },
    /// Decay reputation for inactive accounts
    DecayInactiveReputation,
}

// Contract errors
#[derive(Debug, PartialEq, Eq, Reject, Serialize, SchemaType)]
pub enum ReputationError {
    /// Standard CIS-2 error
    Cis2Error(Cis2Error<TokenIdU32>),
    /// Only admin can perform this action
    Unauthorized,
    /// Token not found
    TokenNotFound,
    /// Account not found
    AccountNotFound,
    /// Reputation tokens cannot be transferred
    TransferProhibited,
    /// Parse error
    ParseError,
    /// Invalid verification level
    InvalidVerificationLevel,
}

impl From<Cis2Error<TokenIdU32>> for ReputationError {
    fn from(e: Cis2Error<TokenIdU32>) -> Self {
        ReputationError::Cis2Error(e)
    }
}

// Contract events
#[derive(Debug, Serialize, SchemaType)]
pub enum ReputationEvent {
    /// Reputation token created
    TokenCreated {
        token_id: TokenIdU32,
        owner: AccountAddress,
        initial_score: u64,
    },
    /// Reputation updated
    ReputationUpdated {
        account: AccountAddress,
        old_score: u64,
        new_score: u64,
        reason: UpdateReason,
    },
    /// Verification level changed
    VerificationChanged {
        account: AccountAddress,
        old_level: VerificationLevel,
        new_level: VerificationLevel,
    },
}

#[derive(Debug, Serialize, SchemaType)]
pub enum UpdateReason {
    Transaction,
    DisputeWon,
    DisputeLost,
    Verification,
    Decay,
}

/// Contract token ID type
pub type TokenIdU32 = TokenIdU32 as u32;

type ContractResult<T> = Result<T, ReputationError>;
type ContractTokenId = TokenIdU32;
type ContractTokenAmount = TokenAmountU64;

/// Initialize the reputation contract
#[init(
    contract = "credify_reputation", 
    parameter = "InitParams",
    event = "ReputationEvent"
)]
fn init<S: HasStateApi>(
    ctx: &InitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<ReputationState<S>> {
    let params: InitParams = ctx.parameter_cursor().get()?;
    
    let state = ReputationState {
        tokens: state_builder.new_map(),
        reputation_scores: state_builder.new_map(),
        account_tokens: state_builder.new_map(),
        next_token_id: 0,
        admin: params.admin,
        escrow_contract: None,
        base_reputation: params.base_reputation,
    };
    
    Ok(state)
}

/// Implement CIS-2 balance_of
#[receive(
    contract = "credify_reputation",
    name = "balanceOf",
    parameter = "BalanceOfQueryParams<ContractTokenId>",
    return_value = "BalanceOfQueryResponse<ContractTokenAmount>",
    error = "ReputationError"
)]
fn balance_of<S: HasStateApi>(
    ctx: &ReceiveContext,
    host: &Host<ReputationState<S>>,
) -> ContractResult<BalanceOfQueryResponse<ContractTokenAmount>> {
    let params: BalanceOfQueryParams<ContractTokenId> = ctx.parameter_cursor().get().map_err(|_| ReputationError::ParseError)?;
    let state = host.state();
    
    let mut response = Vec::with_capacity(params.queries.len());
    for query in params.queries {
        let amount = if let Some(token_data) = state.tokens.get(&query.token_id) {
            if token_data.owner == query.address {
                1u64.into() // Each account has exactly one reputation token
            } else {
                0u64.into()
            }
        } else {
            0u64.into()
        };
        response.push(amount);
    }
    
    Ok(BalanceOfQueryResponse::from(response))
}

/// Implement CIS-2 supports - this contract does not support transfers
#[receive(
    contract = "credify_reputation",
    name = "supports",
    parameter = "SupportsQueryParams",
    return_value = "SupportsQueryResponse"
)]
fn supports<S: HasStateApi>(
    ctx: &ReceiveContext,
    _host: &Host<ReputationState<S>>,
) -> ReceiveResult<SupportsQueryResponse> {
    let params: SupportsQueryParams = ctx.parameter_cursor().get()?;
    let mut response = Vec::with_capacity(params.queries.len());
    
    for query in params.queries {
        let support = match query {
            StandardIdentifierOwned::new_unchecked("CIS-2".to_string()) => SupportResult::Support,
            _ => SupportResult::NoSupport,
        };
        response.push(support);
    }
    
    Ok(SupportsQueryResponse::from(response))
}

/// Transfer is prohibited for reputation tokens
#[receive(
    contract = "credify_reputation",
    name = "transfer",
    parameter = "TransferParams<ContractTokenId, ContractTokenAmount>",
    error = "ReputationError",
    mutable
)]
fn transfer<S: HasStateApi>(
    _ctx: &ReceiveContext,
    _host: &mut Host<ReputationState<S>>,
) -> ContractResult<()> {
    // Reputation tokens are non-transferable
    Err(ReputationError::TransferProhibited)
}

/// Handle reputation-specific updates
#[receive(
    contract = "credify_reputation",
    name = "update",
    parameter = "ReputationUpdateParams",
    error = "ReputationError",
    enable_logger,
    mutable
)]
fn update<S: HasStateApi>(
    ctx: &ReceiveContext,
    host: &mut Host<ReputationState<S>>,
    logger: &mut Logger,
) -> ContractResult<()> {
    let params: ReputationUpdateParams = ctx.parameter_cursor().get().map_err(|_| ReputationError::ParseError)?;
    let state = host.state_mut();
    
    match params {
        ReputationUpdateParams::UpdateFromTransaction {
            account,
            transaction_value,
            is_buyer,
        } => {
            // Only escrow contract or admin can update reputation
            if let Some(escrow_contract) = state.escrow_contract {
                if ctx.sender() != AccountAddress::Contract(escrow_contract) && ctx.sender() != state.admin {
                    return Err(ReputationError::Unauthorized);
                }
            } else if ctx.sender() != state.admin {
                return Err(ReputationError::Unauthorized);
            }
            
            let token_id = get_or_create_reputation_token(account, state, logger)?;
            let mut token_data = state.tokens.get(&token_id).ok_or(ReputationError::TokenNotFound)?.clone();
            
            let old_score = token_data.score;
            
            // Update transaction counts
            if is_buyer {
                token_data.buyer_transactions += 1;
            } else {
                token_data.seller_transactions += 1;
            }
            
            // Add transaction value
            token_data.total_transaction_value += transaction_value.micro_ccd();
            token_data.last_activity = ctx.metadata().slot_time();
            
            // Calculate reputation increase
            let base_increase = if is_buyer { 10 } else { 15 }; // Sellers get slightly more reputation
            let value_bonus = (transaction_value.micro_ccd() / 1_000_000).min(50); // Max 50 bonus points
            let verification_multiplier = match token_data.verification_level {
                VerificationLevel::None => 1,
                VerificationLevel::Basic => 2,
                VerificationLevel::Full => 3,
                VerificationLevel::Professional => 4,
            };
            
            let reputation_increase = (base_increase + value_bonus) * verification_multiplier;
            token_data.score += reputation_increase;
            
            // Update state
            state.tokens.insert(token_id, token_data);
            state.reputation_scores.insert(account, token_data.score);
            
            logger.log(&ReputationEvent::ReputationUpdated {
                account,
                old_score,
                new_score: token_data.score,
                reason: UpdateReason::Transaction,
            })?;
            
            Ok(())
        }
        
        ReputationUpdateParams::UpdateFromDispute {
            winner,
            loser,
            dispute_value,
        } => {
            // Only escrow contract or admin can update reputation
            if let Some(escrow_contract) = state.escrow_contract {
                if ctx.sender() != AccountAddress::Contract(escrow_contract) && ctx.sender() != state.admin {
                    return Err(ReputationError::Unauthorized);
                }
            } else if ctx.sender() != state.admin {
                return Err(ReputationError::Unauthorized);
            }
            
            // Update winner's reputation
            let winner_token_id = get_or_create_reputation_token(winner, state, logger)?;
            if let Some(mut winner_data) = state.tokens.get(&winner_token_id).map(|d| d.clone()) {
                let old_score = winner_data.score;
                winner_data.disputes_won += 1;
                winner_data.last_activity = ctx.metadata().slot_time();
                
                // Reputation increase for winning dispute
                let reputation_increase = 20 + (dispute_value.micro_ccd() / 1_000_000).min(30);
                winner_data.score += reputation_increase;
                
                state.tokens.insert(winner_token_id, winner_data.clone());
                state.reputation_scores.insert(winner, winner_data.score);
                
                logger.log(&ReputationEvent::ReputationUpdated {
                    account: winner,
                    old_score,
                    new_score: winner_data.score,
                    reason: UpdateReason::DisputeWon,
                })?;
            }
            
            // Update loser's reputation
            let loser_token_id = get_or_create_reputation_token(loser, state, logger)?;
            if let Some(mut loser_data) = state.tokens.get(&loser_token_id).map(|d| d.clone()) {
                let old_score = loser_data.score;
                loser_data.disputes_lost += 1;
                loser_data.last_activity = ctx.metadata().slot_time();
                
                // Reputation decrease for losing dispute
                let reputation_decrease = 30 + (dispute_value.micro_ccd() / 1_000_000).min(50);
                loser_data.score = loser_data.score.saturating_sub(reputation_decrease);
                
                state.tokens.insert(loser_token_id, loser_data.clone());
                state.reputation_scores.insert(loser, loser_data.score);
                
                logger.log(&ReputationEvent::ReputationUpdated {
                    account: loser,
                    old_score,
                    new_score: loser_data.score,
                    reason: UpdateReason::DisputeLost,
                })?;
            }
            
            Ok(())
        }
        
        ReputationUpdateParams::SetVerificationLevel { account, level } => {
            // Only admin can set verification levels
            if ctx.sender() != state.admin {
                return Err(ReputationError::Unauthorized);
            }
            
            let token_id = get_or_create_reputation_token(account, state, logger)?;
            let mut token_data = state.tokens.get(&token_id).ok_or(ReputationError::TokenNotFound)?.clone();
            
            let old_level = token_data.verification_level.clone();
            let old_score = token_data.score;
            token_data.verification_level = level.clone();
            
            // Bonus reputation for verification
            let verification_bonus = match level {
                VerificationLevel::None => 0,
                VerificationLevel::Basic => 50,
                VerificationLevel::Full => 150,
                VerificationLevel::Professional => 300,
            };
            
            if verification_bonus > 0 {
                token_data.score += verification_bonus;
            }
            
            state.tokens.insert(token_id, token_data.clone());
            state.reputation_scores.insert(account, token_data.score);
            
            logger.log(&ReputationEvent::VerificationChanged {
                account,
                old_level,
                new_level: level,
            })?;
            
            if verification_bonus > 0 {
                logger.log(&ReputationEvent::ReputationUpdated {
                    account,
                    old_score,
                    new_score: token_data.score,
                    reason: UpdateReason::Verification,
                })?;
            }
            
            Ok(())
        }
        
        ReputationUpdateParams::SetEscrowContract { contract_address } => {
            if ctx.sender() != state.admin {
                return Err(ReputationError::Unauthorized);
            }
            
            state.escrow_contract = Some(contract_address);
            Ok(())
        }
        
        ReputationUpdateParams::DecayInactiveReputation => {
            // Anyone can trigger reputation decay (gas paid by caller)
            let current_time = ctx.metadata().slot_time();
            let decay_threshold = Duration::from_days(90); // 90 days of inactivity
            
            // This is simplified - in a real implementation, you'd want to iterate more efficiently
            // and possibly limit the number of accounts processed per call
            
            for (token_id, token_data) in state.tokens.iter_mut() {
                if current_time.duration_since(token_data.last_activity) > decay_threshold {
                    let old_score = token_data.score;
                    // Decay 5% of current reputation
                    let decay_amount = token_data.score / 20;
                    token_data.score = token_data.score.saturating_sub(decay_amount);
                    
                    // Update reputation score mapping
                    state.reputation_scores.insert(token_data.owner, token_data.score);
                    
                    if decay_amount > 0 {
                        logger.log(&ReputationEvent::ReputationUpdated {
                            account: token_data.owner,
                            old_score,
                            new_score: token_data.score,
                            reason: UpdateReason::Decay,
                        })?;
                    }
                }
            }
            
            Ok(())
        }
    }
}

/// Get reputation data for an account
#[receive(
    contract = "credify_reputation",
    name = "get_reputation",
    parameter = "AccountAddress",
    return_value = "Option<ReputationData>",
    error = "ReputationError"
)]
fn get_reputation<S: HasStateApi>(
    ctx: &ReceiveContext,
    host: &Host<ReputationState<S>>,
) -> ContractResult<Option<ReputationData>> {
    let account: AccountAddress = ctx.parameter_cursor().get().map_err(|_| ReputationError::ParseError)?;
    let state = host.state();
    
    if let Some(token_id) = state.account_tokens.get(&account) {
        Ok(state.tokens.get(&token_id).cloned())
    } else {
        Ok(None)
    }
}

/// Get reputation score for an account
#[receive(
    contract = "credify_reputation",
    name = "get_score",
    parameter = "AccountAddress",
    return_value = "u64"
)]
fn get_score<S: HasStateApi>(
    ctx: &ReceiveContext,
    host: &Host<ReputationState<S>>,
) -> ReceiveResult<u64> {
    let account: AccountAddress = ctx.parameter_cursor().get()?;
    let state = host.state();
    
    Ok(state.reputation_scores.get(&account).copied().unwrap_or(0))
}

// Helper function to get or create reputation token
fn get_or_create_reputation_token<S: HasStateApi>(
    account: AccountAddress,
    state: &mut ReputationState<S>,
    logger: &mut Logger,
) -> ContractResult<TokenIdU32> {
    if let Some(token_id) = state.account_tokens.get(&account) {
        Ok(token_id)
    } else {
        // Create new reputation token
        let token_id = state.next_token_id;
        state.next_token_id += 1;
        
        let reputation_data = ReputationData {
            owner: account,
            score: state.base_reputation,
            buyer_transactions: 0,
            seller_transactions: 0,
            disputes_lost: 0,
            disputes_won: 0,
            last_activity: Timestamp::from_timestamp_millis(0), // Will be set when first used
            total_transaction_value: 0,
            verification_level: VerificationLevel::None,
        };
        
        state.tokens.insert(token_id, reputation_data);
        state.reputation_scores.insert(account, state.base_reputation);
        state.account_tokens.insert(account, token_id);
        
        logger.log(&ReputationEvent::TokenCreated {
            token_id,
            owner: account,
            initial_score: state.base_reputation,
        })?;
        
        Ok(token_id)
    }
}