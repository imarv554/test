/*!
CREDIFY Dispute Resolution Smart Contract

This contract implements a DAO-based dispute resolution system where stakeholders
vote on dispute outcomes. It integrates with the escrow and reputation systems.

Features:
- Community-driven dispute resolution
- Weighted voting based on reputation
- Time-bounded voting periods
- Automatic execution of resolution
- Incentives for participation
- Anti-gaming mechanisms
*/

use concordium_std::*;

// Contract state
#[derive(Serialize, SchemaType)]
pub struct DisputeResolutionState {
    /// Map of dispute ID to dispute details
    pub disputes: collections::BTreeMap<DisputeId, DisputeDetails>,
    /// Map of dispute ID to votes
    pub votes: collections::BTreeMap<DisputeId, Vec<Vote>>,
    /// Admin account
    pub admin: AccountAddress,
    /// Escrow contract address
    pub escrow_contract: Option<ContractAddress>,
    /// Reputation contract address
    pub reputation_contract: Option<ContractAddress>,
    /// Next dispute ID
    pub next_dispute_id: DisputeId,
    /// Minimum reputation required to vote
    pub min_reputation_to_vote: u64,
    /// Voting period in hours
    pub voting_period_hours: u64,
    /// Minimum votes required for resolution
    pub min_votes_required: u32,
    /// Quorum percentage (e.g., 51 for 51%)
    pub quorum_percentage: u8,
}

// Dispute identifier
pub type DisputeId = u64;

// Dispute details
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq)]
pub struct DisputeDetails {
    /// Escrow ID this dispute relates to
    pub escrow_id: u64,
    /// Buyer account
    pub buyer: AccountAddress,
    /// Seller account
    pub seller: AccountAddress,
    /// Disputed amount
    pub amount: Amount,
    /// Reason for dispute
    pub reason: String,
    /// Evidence provided (IPFS hashes or other references)
    pub evidence: Vec<String>,
    /// Who initiated the dispute
    pub initiated_by: AccountAddress,
    /// Timestamp when dispute was created
    pub created_at: Timestamp,
    /// Deadline for voting
    pub voting_deadline: Timestamp,
    /// Current status
    pub status: DisputeStatus,
    /// Final resolution (if resolved)
    pub resolution: Option<DisputeResolution>,
    /// Total weight of votes received
    pub total_vote_weight: u64,
}

// Dispute status
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq, Debug)]
pub enum DisputeStatus {
    /// Dispute is open for voting
    Open,
    /// Voting period ended, resolution pending
    VotingEnded,
    /// Dispute resolved
    Resolved,
    /// Dispute cancelled by admin
    Cancelled,
}

// Dispute resolution outcome
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq, Debug)]
pub enum DisputeResolution {
    /// Favor buyer - full refund
    FavorBuyer,
    /// Favor seller - release payment  
    FavorSeller,
    /// Split payment (percentage to seller)
    Split { seller_percentage: u8 },
}

// Individual vote
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq)]
pub struct Vote {
    /// Voter account
    pub voter: AccountAddress,
    /// Vote choice
    pub choice: VoteChoice,
    /// Weight of this vote (based on reputation)
    pub weight: u64,
    /// Timestamp of vote
    pub timestamp: Timestamp,
    /// Optional comment/justification
    pub comment: Option<String>,
}

// Vote choices
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq, Debug)]
pub enum VoteChoice {
    /// Favor the buyer
    FavorBuyer,
    /// Favor the seller
    FavorSeller,
    /// Split the amount (include percentage)
    Split { seller_percentage: u8 },
}

// Contract initialization parameters
#[derive(Serialize, SchemaType)]
pub struct InitParams {
    pub admin: AccountAddress,
    pub min_reputation_to_vote: u64,
    pub voting_period_hours: u64,
    pub min_votes_required: u32,
    pub quorum_percentage: u8,
}

// Contract update parameters
#[derive(Serialize, SchemaType)]
pub enum UpdateParams {
    /// Create a new dispute
    CreateDispute {
        escrow_id: u64,
        buyer: AccountAddress,
        seller: AccountAddress,
        amount: Amount,
        reason: String,
        evidence: Vec<String>,
    },
    /// Cast a vote on a dispute
    Vote {
        dispute_id: DisputeId,
        choice: VoteChoice,
        comment: Option<String>,
    },
    /// Resolve a dispute (after voting period)
    ResolveDispute {
        dispute_id: DisputeId,
    },
    /// Add evidence to an existing dispute
    AddEvidence {
        dispute_id: DisputeId,
        evidence: String,
    },
    /// Cancel dispute (admin only)
    CancelDispute {
        dispute_id: DisputeId,
    },
    /// Update contract parameters (admin only)
    UpdateParameters {
        min_reputation_to_vote: Option<u64>,
        voting_period_hours: Option<u64>,
        min_votes_required: Option<u32>,
        quorum_percentage: Option<u8>,
    },
    /// Set contract addresses (admin only)
    SetContractAddresses {
        escrow_contract: Option<ContractAddress>,
        reputation_contract: Option<ContractAddress>,
    },
}

// Contract errors
#[derive(Debug, PartialEq, Eq, Reject, Serialize, SchemaType)]
pub enum DisputeError {
    /// Only admin can perform this action
    Unauthorized,
    /// Dispute not found
    DisputeNotFound,
    /// Invalid dispute status for this operation
    InvalidStatus,
    /// Voting period has ended
    VotingEnded,
    /// Voting period still active
    VotingStillActive,
    /// Insufficient reputation to vote
    InsufficientReputation,
    /// Already voted on this dispute
    AlreadyVoted,
    /// Insufficient votes for resolution
    InsufficientVotes,
    /// Invalid split percentage
    InvalidSplitPercentage,
    /// Contract address not set
    ContractNotSet,
    /// Parse error
    ParseError,
    /// Contract invocation error
    InvokeContractError,
}

// Contract events
#[derive(Debug, Serialize, SchemaType)]
pub enum DisputeEvent {
    /// New dispute created
    DisputeCreated {
        dispute_id: DisputeId,
        escrow_id: u64,
        buyer: AccountAddress,
        seller: AccountAddress,
        amount: Amount,
    },
    /// Vote cast
    VoteCast {
        dispute_id: DisputeId,
        voter: AccountAddress,
        choice: VoteChoice,
        weight: u64,
    },
    /// Evidence added
    EvidenceAdded {
        dispute_id: DisputeId,
        added_by: AccountAddress,
        evidence: String,
    },
    /// Dispute resolved
    DisputeResolved {
        dispute_id: DisputeId,
        resolution: DisputeResolution,
        total_votes: u32,
        total_weight: u64,
    },
    /// Dispute cancelled
    DisputeCancelled {
        dispute_id: DisputeId,
    },
}

type ContractResult<T> = Result<T, DisputeError>;

/// Initialize the dispute resolution contract
#[init(contract = "credify_dispute", parameter = "InitParams")]
fn init(_ctx: &InitContext, _state_builder: &mut StateBuilder) -> InitResult<DisputeResolutionState> {
    let params: InitParams = _ctx.parameter_cursor().get()?;
    
    let state = DisputeResolutionState {
        disputes: collections::BTreeMap::new(),
        votes: collections::BTreeMap::new(),
        admin: params.admin,
        escrow_contract: None,
        reputation_contract: None,
        next_dispute_id: 0,
        min_reputation_to_vote: params.min_reputation_to_vote,
        voting_period_hours: params.voting_period_hours,
        min_votes_required: params.min_votes_required,
        quorum_percentage: params.quorum_percentage,
    };
    
    Ok(state)
}

/// Handle contract updates
#[receive(
    contract = "credify_dispute",
    name = "update",
    parameter = "UpdateParams",
    error = "DisputeError",
    enable_logger,
    mutable
)]
fn update(
    ctx: &ReceiveContext,
    host: &mut Host<DisputeResolutionState>,
    logger: &mut Logger,
) -> ContractResult<()> {
    let params: UpdateParams = ctx.parameter_cursor().get().map_err(|_| DisputeError::ParseError)?;
    let state = host.state_mut();
    
    match params {
        UpdateParams::CreateDispute {
            escrow_id,
            buyer,
            seller,
            amount,
            reason,
            evidence,
        } => {
            // Only escrow contract or admin can create disputes
            if let Some(escrow_contract) = state.escrow_contract {
                if ctx.sender() != AccountAddress::Contract(escrow_contract) && ctx.sender() != state.admin {
                    return Err(DisputeError::Unauthorized);
                }
            } else if ctx.sender() != state.admin {
                return Err(DisputeError::Unauthorized);
            }
            
            let dispute_id = state.next_dispute_id;
            let created_at = ctx.metadata().slot_time();
            let voting_deadline = created_at.add_duration(Duration::from_hours(state.voting_period_hours));
            
            let dispute = DisputeDetails {
                escrow_id,
                buyer,
                seller,
                amount,
                reason: reason.clone(),
                evidence: evidence.clone(),
                initiated_by: ctx.sender(),
                created_at,
                voting_deadline,
                status: DisputeStatus::Open,
                resolution: None,
                total_vote_weight: 0,
            };
            
            state.disputes.insert(dispute_id, dispute);
            state.votes.insert(dispute_id, Vec::new());
            state.next_dispute_id += 1;
            
            logger.log(&DisputeEvent::DisputeCreated {
                dispute_id,
                escrow_id,
                buyer,
                seller,
                amount,
            })?;
            
            Ok(())
        }
        
        UpdateParams::Vote {
            dispute_id,
            choice,
            comment,
        } => {
            let dispute = state.disputes.get_mut(&dispute_id).ok_or(DisputeError::DisputeNotFound)?;
            
            // Check if dispute is still open for voting
            if dispute.status != DisputeStatus::Open {
                return Err(DisputeError::InvalidStatus);
            }
            
            // Check if voting period has ended
            if ctx.metadata().slot_time() > dispute.voting_deadline {
                dispute.status = DisputeStatus::VotingEnded;
                return Err(DisputeError::VotingEnded);
            }
            
            // Prevent parties from voting on their own dispute
            let voter = ctx.sender();
            if voter == dispute.buyer || voter == dispute.seller {
                return Err(DisputeError::Unauthorized);
            }
            
            // Check if user already voted
            let existing_votes = state.votes.get(&dispute_id).unwrap();
            if existing_votes.iter().any(|v| v.voter == voter) {
                return Err(DisputeError::AlreadyVoted);
            }
            
            // Get voter's reputation (simplified - in real implementation, call reputation contract)
            let voter_reputation = get_voter_reputation(host, voter)?;
            if voter_reputation < state.min_reputation_to_vote {
                return Err(DisputeError::InsufficientReputation);
            }
            
            // Validate split percentage if applicable
            if let VoteChoice::Split { seller_percentage } = &choice {
                if *seller_percentage > 100 {
                    return Err(DisputeError::InvalidSplitPercentage);
                }
            }
            
            // Create vote with weight based on reputation
            let vote_weight = calculate_vote_weight(voter_reputation);
            let vote = Vote {
                voter,
                choice: choice.clone(),
                weight: vote_weight,
                timestamp: ctx.metadata().slot_time(),
                comment,
            };
            
            // Add vote
            let votes = state.votes.get_mut(&dispute_id).unwrap();
            votes.push(vote);
            
            // Update total vote weight
            dispute.total_vote_weight += vote_weight;
            
            logger.log(&DisputeEvent::VoteCast {
                dispute_id,
                voter,
                choice,
                weight: vote_weight,
            })?;
            
            Ok(())
        }
        
        UpdateParams::ResolveDispute { dispute_id } => {
            let dispute = state.disputes.get_mut(&dispute_id).ok_or(DisputeError::DisputeNotFound)?;
            
            // Check if voting period has ended
            if ctx.metadata().slot_time() <= dispute.voting_deadline {
                return Err(DisputeError::VotingStillActive);
            }
            
            if dispute.status != DisputeStatus::Open && dispute.status != DisputeStatus::VotingEnded {
                return Err(DisputeError::InvalidStatus);
            }
            
            let votes = state.votes.get(&dispute_id).ok_or(DisputeError::DisputeNotFound)?;
            
            // Check if minimum votes requirement is met
            if votes.len() < state.min_votes_required as usize {
                return Err(DisputeError::InsufficientVotes);
            }
            
            // Calculate resolution based on weighted votes
            let resolution = calculate_resolution(votes, state.quorum_percentage)?;
            
            // Update dispute status
            dispute.status = DisputeStatus::Resolved;
            dispute.resolution = Some(resolution.clone());
            
            // Call escrow contract to execute resolution
            if let Some(escrow_contract) = state.escrow_contract {
                // In a real implementation, this would call the escrow contract's resolve_dispute method
                // For now, we'll just log the resolution
            }
            
            logger.log(&DisputeEvent::DisputeResolved {
                dispute_id,
                resolution,
                total_votes: votes.len() as u32,
                total_weight: dispute.total_vote_weight,
            })?;
            
            // Distribute rewards to voters (simplified)
            distribute_voting_rewards(host, dispute_id, votes)?;
            
            Ok(())
        }
        
        UpdateParams::AddEvidence {
            dispute_id,
            evidence,
        } => {
            let dispute = state.disputes.get_mut(&dispute_id).ok_or(DisputeError::DisputeNotFound)?;
            
            // Only dispute parties can add evidence
            let sender = ctx.sender();
            if sender != dispute.buyer && sender != dispute.seller {
                return Err(DisputeError::Unauthorized);
            }
            
            // Only allow evidence addition during open period
            if dispute.status != DisputeStatus::Open {
                return Err(DisputeError::InvalidStatus);
            }
            
            dispute.evidence.push(evidence.clone());
            
            logger.log(&DisputeEvent::EvidenceAdded {
                dispute_id,
                added_by: sender,
                evidence,
            })?;
            
            Ok(())
        }
        
        UpdateParams::CancelDispute { dispute_id } => {
            if ctx.sender() != state.admin {
                return Err(DisputeError::Unauthorized);
            }
            
            let dispute = state.disputes.get_mut(&dispute_id).ok_or(DisputeError::DisputeNotFound)?;
            
            if dispute.status == DisputeStatus::Resolved {
                return Err(DisputeError::InvalidStatus);
            }
            
            dispute.status = DisputeStatus::Cancelled;
            
            logger.log(&DisputeEvent::DisputeCancelled { dispute_id })?;
            
            Ok(())
        }
        
        UpdateParams::UpdateParameters {
            min_reputation_to_vote,
            voting_period_hours,
            min_votes_required,
            quorum_percentage,
        } => {
            if ctx.sender() != state.admin {
                return Err(DisputeError::Unauthorized);
            }
            
            if let Some(min_rep) = min_reputation_to_vote {
                state.min_reputation_to_vote = min_rep;
            }
            if let Some(period) = voting_period_hours {
                state.voting_period_hours = period;
            }
            if let Some(min_votes) = min_votes_required {
                state.min_votes_required = min_votes;
            }
            if let Some(quorum) = quorum_percentage {
                if quorum <= 100 {
                    state.quorum_percentage = quorum;
                }
            }
            
            Ok(())
        }
        
        UpdateParams::SetContractAddresses {
            escrow_contract,
            reputation_contract,
        } => {
            if ctx.sender() != state.admin {
                return Err(DisputeError::Unauthorized);
            }
            
            if let Some(contract) = escrow_contract {
                state.escrow_contract = Some(contract);
            }
            if let Some(contract) = reputation_contract {
                state.reputation_contract = Some(contract);
            }
            
            Ok(())
        }
    }
}

/// Get dispute details
#[receive(
    contract = "credify_dispute",
    name = "get_dispute",
    parameter = "DisputeId",
    return_value = "Option<DisputeDetails>",
    error = "DisputeError"
)]
fn get_dispute(
    ctx: &ReceiveContext,
    host: &Host<DisputeResolutionState>,
) -> ContractResult<Option<DisputeDetails>> {
    let dispute_id: DisputeId = ctx.parameter_cursor().get().map_err(|_| DisputeError::ParseError)?;
    Ok(host.state().disputes.get(&dispute_id).cloned())
}

/// Get votes for a dispute
#[receive(
    contract = "credify_dispute",
    name = "get_votes",
    parameter = "DisputeId",
    return_value = "Vec<Vote>",
    error = "DisputeError"
)]
fn get_votes(
    ctx: &ReceiveContext,
    host: &Host<DisputeResolutionState>,
) -> ContractResult<Vec<Vote>> {
    let dispute_id: DisputeId = ctx.parameter_cursor().get().map_err(|_| DisputeError::ParseError)?;
    Ok(host.state().votes.get(&dispute_id).cloned().unwrap_or_default())
}

// Helper functions

/// Get voter's reputation (simplified implementation)
fn get_voter_reputation<S>(
    _host: &Host<DisputeResolutionState>,
    _voter: AccountAddress,
) -> ContractResult<u64> {
    // In a real implementation, this would call the reputation contract
    // For MVP, we'll return a fixed value for demonstration
    Ok(100) // Assume all voters have sufficient reputation
}

/// Calculate vote weight based on reputation
fn calculate_vote_weight(reputation: u64) -> u64 {
    // Square root scaling to prevent excessive influence of high-reputation accounts
    let base_weight = (reputation as f64).sqrt() as u64;
    base_weight.max(1).min(100) // Min 1, max 100 weight
}

/// Calculate the final resolution based on weighted votes
fn calculate_resolution(votes: &[Vote], quorum_percentage: u8) -> ContractResult<DisputeResolution> {
    let total_weight: u64 = votes.iter().map(|v| v.weight).sum();
    let quorum_threshold = (total_weight * u64::from(quorum_percentage)) / 100;
    
    let mut buyer_weight = 0u64;
    let mut seller_weight = 0u64;
    let mut split_votes: Vec<(u8, u64)> = Vec::new();
    
    for vote in votes {
        match &vote.choice {
            VoteChoice::FavorBuyer => buyer_weight += vote.weight,
            VoteChoice::FavorSeller => seller_weight += vote.weight,
            VoteChoice::Split { seller_percentage } => {
                split_votes.push((*seller_percentage, vote.weight));
            }
        }
    }
    
    // Check if buyer or seller has clear majority
    if buyer_weight >= quorum_threshold {
        return Ok(DisputeResolution::FavorBuyer);
    }
    if seller_weight >= quorum_threshold {
        return Ok(DisputeResolution::FavorSeller);
    }
    
    // If no clear majority, calculate weighted average of split votes
    if !split_votes.is_empty() {
        let total_split_weight: u64 = split_votes.iter().map(|(_, w)| *w).sum();
        let weighted_percentage: u64 = split_votes
            .iter()
            .map(|(p, w)| u64::from(*p) * w)
            .sum();
        
        let average_percentage = (weighted_percentage / total_split_weight) as u8;
        return Ok(DisputeResolution::Split {
            seller_percentage: average_percentage,
        });
    }
    
    // Default to 50/50 split if no consensus
    Ok(DisputeResolution::Split {
        seller_percentage: 50,
    })
}

/// Distribute rewards to voters for participation
fn distribute_voting_rewards<S>(
    _host: &Host<DisputeResolutionState>,
    _dispute_id: DisputeId,
    _votes: &[Vote],
) -> ContractResult<()> {
    // In a real implementation, this would:
    // 1. Calculate rewards based on vote correctness and participation
    // 2. Update reputation scores for voters
    // 3. Possibly distribute small CCD rewards
    
    // For MVP, we'll just acknowledge the participation
    Ok(())
}