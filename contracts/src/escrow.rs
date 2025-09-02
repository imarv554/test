/*!
CREDIFY Escrow Smart Contract

This contract handles secure escrow transactions between buyers and sellers on the CREDIFY platform.
Features:
- Automated escrow with smart contract logic
- Dispute resolution integration
- Identity verification requirements
- Reputation system integration
- Multi-stage transaction lifecycle
*/

use concordium_std::*;

// Contract state
#[derive(Serialize, SchemaType)]
pub struct EscrowState {
    /// Map of escrow ID to escrow details
    pub escrows: collections::BTreeMap<EscrowId, EscrowDetails>,
    /// Admin account that can manage the contract
    pub admin: AccountAddress,
    /// Platform fee percentage (basis points, e.g., 200 = 2%)
    pub platform_fee: u32,
    /// Dispute resolution contract address
    pub dispute_contract: Option<ContractAddress>,
    /// Next escrow ID to use
    pub next_escrow_id: EscrowId,
}

// Escrow identifier
pub type EscrowId = u64;

// Escrow details
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq)]
pub struct EscrowDetails {
    /// Buyer account
    pub buyer: AccountAddress,
    /// Seller account
    pub seller: AccountAddress,
    /// Amount in escrow (in microCCD)
    pub amount: Amount,
    /// Product/service description
    pub description: String,
    /// Current status of the escrow
    pub status: EscrowStatus,
    /// Timestamp when escrow was created
    pub created_at: Timestamp,
    /// Timestamp when buyer can claim refund (if applicable)
    pub refund_deadline: Option<Timestamp>,
    /// Whether identity verification is required
    pub requires_identity_verification: bool,
    /// Identity verification status for buyer
    pub buyer_verified: bool,
    /// Identity verification status for seller
    pub seller_verified: bool,
    /// Dispute resolution ID if dispute was raised
    pub dispute_id: Option<u64>,
}

// Escrow status
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq, Debug)]
pub enum EscrowStatus {
    /// Escrow created, waiting for conditions to be met
    Created,
    /// All conditions met, escrow is active
    Active,
    /// Goods/services delivered, waiting for buyer confirmation
    DeliveryConfirmed,
    /// Transaction completed successfully
    Completed,
    /// Dispute raised, waiting for resolution
    Disputed,
    /// Refund issued to buyer
    Refunded,
    /// Escrow cancelled
    Cancelled,
}

// Contract initialization parameters
#[derive(Serialize, SchemaType)]
pub struct InitParams {
    /// Admin account address
    pub admin: AccountAddress,
    /// Platform fee in basis points
    pub platform_fee: u32,
}

// Contract update parameters
#[derive(Serialize, SchemaType)]
pub enum UpdateParams {
    /// Create a new escrow
    CreateEscrow {
        seller: AccountAddress,
        description: String,
        refund_deadline_hours: Option<u64>,
        requires_identity_verification: bool,
    },
    /// Confirm identity verification
    ConfirmIdentity {
        escrow_id: EscrowId,
    },
    /// Activate escrow (when all conditions are met)
    ActivateEscrow {
        escrow_id: EscrowId,
    },
    /// Confirm delivery (seller action)
    ConfirmDelivery {
        escrow_id: EscrowId,
    },
    /// Complete transaction (buyer action)
    CompleteTransaction {
        escrow_id: EscrowId,
    },
    /// Raise dispute
    RaiseDispute {
        escrow_id: EscrowId,
        reason: String,
    },
    /// Resolve dispute (called by dispute resolution contract)
    ResolveDispute {
        escrow_id: EscrowId,
        resolution: DisputeResolution,
    },
    /// Cancel escrow (admin only)
    CancelEscrow {
        escrow_id: EscrowId,
    },
    /// Update platform fee (admin only)
    UpdatePlatformFee {
        new_fee: u32,
    },
    /// Set dispute resolution contract (admin only)
    SetDisputeContract {
        contract_address: ContractAddress,
    },
}

// Dispute resolution options
#[derive(Serialize, SchemaType, Clone, PartialEq, Eq)]
pub enum DisputeResolution {
    /// Favor buyer - full refund
    FavorBuyer,
    /// Favor seller - release payment
    FavorSeller,
    /// Split payment (percentage to seller)
    Split { seller_percentage: u8 },
}

// Contract errors
#[derive(Debug, PartialEq, Eq, Reject, Serialize, SchemaType)]
pub enum EscrowError {
    /// Only admin can perform this action
    Unauthorized,
    /// Escrow not found
    EscrowNotFound,
    /// Invalid escrow status for this operation
    InvalidStatus,
    /// Insufficient funds
    InsufficientFunds,
    /// Identity verification required
    IdentityVerificationRequired,
    /// Invalid dispute resolution
    InvalidDisputeResolution,
    /// Refund deadline not reached
    RefundDeadlineNotReached,
    /// Parse error
    ParseError,
    /// Contract invocation error
    InvokeContractError,
    /// Transfer error
    TransferError,
}

// Contract events
#[derive(Debug, Serialize, SchemaType)]
pub enum EscrowEvent {
    /// Escrow created
    EscrowCreated {
        escrow_id: EscrowId,
        buyer: AccountAddress,
        seller: AccountAddress,
        amount: Amount,
    },
    /// Escrow activated
    EscrowActivated {
        escrow_id: EscrowId,
    },
    /// Delivery confirmed
    DeliveryConfirmed {
        escrow_id: EscrowId,
    },
    /// Transaction completed
    TransactionCompleted {
        escrow_id: EscrowId,
        seller_amount: Amount,
        platform_fee: Amount,
    },
    /// Dispute raised
    DisputeRaised {
        escrow_id: EscrowId,
        dispute_id: u64,
    },
    /// Dispute resolved
    DisputeResolved {
        escrow_id: EscrowId,
        resolution: DisputeResolution,
    },
    /// Escrow refunded
    EscrowRefunded {
        escrow_id: EscrowId,
        refund_amount: Amount,
    },
}

type ContractResult<T> = Result<T, EscrowError>;

/// Initialize the escrow contract
#[init(contract = "credify_escrow", parameter = "InitParams")]
fn init(ctx: &InitContext, _state_builder: &mut StateBuilder) -> InitResult<EscrowState> {
    let params: InitParams = ctx.parameter_cursor().get()?;
    
    let state = EscrowState {
        escrows: collections::BTreeMap::new(),
        admin: params.admin,
        platform_fee: params.platform_fee,
        dispute_contract: None,
        next_escrow_id: 0,
    };
    
    Ok(state)
}

/// Handle contract updates
#[receive(
    contract = "credify_escrow",
    name = "update",
    parameter = "UpdateParams",
    error = "EscrowError",
    enable_logger,
    mutable
)]
fn update(
    ctx: &ReceiveContext,
    host: &mut Host<EscrowState>,
    logger: &mut Logger,
) -> ContractResult<()> {
    let params: UpdateParams = ctx.parameter_cursor().get().map_err(|_| EscrowError::ParseError)?;
    let state = host.state_mut();
    
    match params {
        UpdateParams::CreateEscrow {
            seller,
            description,
            refund_deadline_hours,
            requires_identity_verification,
        } => {
            // Verify the amount sent with the transaction
            let amount = ctx.amount();
            if amount == Amount::zero() {
                return Err(EscrowError::InsufficientFunds);
            }
            
            // Calculate refund deadline if specified
            let refund_deadline = refund_deadline_hours.map(|hours| {
                ctx.metadata().slot_time().add_duration(Duration::from_hours(hours))
            });
            
            // Create new escrow
            let escrow_id = state.next_escrow_id;
            let escrow = EscrowDetails {
                buyer: ctx.sender(),
                seller,
                amount,
                description: description.clone(),
                status: EscrowStatus::Created,
                created_at: ctx.metadata().slot_time(),
                refund_deadline,
                requires_identity_verification,
                buyer_verified: !requires_identity_verification, // If no verification required, mark as verified
                seller_verified: !requires_identity_verification,
                dispute_id: None,
            };
            
            state.escrows.insert(escrow_id, escrow);
            state.next_escrow_id += 1;
            
            // Log event
            logger.log(&EscrowEvent::EscrowCreated {
                escrow_id,
                buyer: ctx.sender(),
                seller,
                amount,
            })?;
            
            Ok(())
        }
        
        UpdateParams::ConfirmIdentity { escrow_id } => {
            let escrow = state.escrows.get_mut(&escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            
            // Only buyer or seller can confirm their identity
            if ctx.sender() == escrow.buyer {
                escrow.buyer_verified = true;
            } else if ctx.sender() == escrow.seller {
                escrow.seller_verified = true;
            } else {
                return Err(EscrowError::Unauthorized);
            }
            
            // Auto-activate if both parties are verified and escrow is still created
            if escrow.status == EscrowStatus::Created 
                && escrow.buyer_verified 
                && escrow.seller_verified {
                escrow.status = EscrowStatus::Active;
                
                logger.log(&EscrowEvent::EscrowActivated { escrow_id })?;
            }
            
            Ok(())
        }
        
        UpdateParams::ActivateEscrow { escrow_id } => {
            let escrow = state.escrows.get_mut(&escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            
            // Only buyer or admin can activate
            if ctx.sender() != escrow.buyer && ctx.sender() != state.admin {
                return Err(EscrowError::Unauthorized);
            }
            
            if escrow.status != EscrowStatus::Created {
                return Err(EscrowError::InvalidStatus);
            }
            
            // Check if identity verification is complete
            if escrow.requires_identity_verification && (!escrow.buyer_verified || !escrow.seller_verified) {
                return Err(EscrowError::IdentityVerificationRequired);
            }
            
            escrow.status = EscrowStatus::Active;
            
            logger.log(&EscrowEvent::EscrowActivated { escrow_id })?;
            
            Ok(())
        }
        
        UpdateParams::ConfirmDelivery { escrow_id } => {
            let escrow = state.escrows.get_mut(&escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            
            // Only seller can confirm delivery
            if ctx.sender() != escrow.seller {
                return Err(EscrowError::Unauthorized);
            }
            
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidStatus);
            }
            
            escrow.status = EscrowStatus::DeliveryConfirmed;
            
            logger.log(&EscrowEvent::DeliveryConfirmed { escrow_id })?;
            
            Ok(())
        }
        
        UpdateParams::CompleteTransaction { escrow_id } => {
            let escrow = state.escrows.get_mut(&escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            
            // Only buyer can complete the transaction
            if ctx.sender() != escrow.buyer {
                return Err(EscrowError::Unauthorized);
            }
            
            if escrow.status != EscrowStatus::DeliveryConfirmed {
                return Err(EscrowError::InvalidStatus);
            }
            
            // Calculate platform fee and seller amount
            let platform_fee_amount = Amount::from_micro_ccd(
                (escrow.amount.micro_ccd() * u64::from(state.platform_fee)) / 10000
            );
            let seller_amount = escrow.amount - platform_fee_amount;
            
            // Transfer to seller
            if seller_amount > Amount::zero() {
                host.invoke_transfer(&escrow.seller, seller_amount)
                    .map_err(|_| EscrowError::TransferError)?;
            }
            
            // Keep platform fee in contract (admin can withdraw later)
            
            escrow.status = EscrowStatus::Completed;
            
            logger.log(&EscrowEvent::TransactionCompleted {
                escrow_id,
                seller_amount,
                platform_fee: platform_fee_amount,
            })?;
            
            Ok(())
        }
        
        UpdateParams::RaiseDispute { escrow_id, reason: _ } => {
            let escrow = state.escrows.get_mut(&escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            
            // Only buyer or seller can raise dispute
            if ctx.sender() != escrow.buyer && ctx.sender() != escrow.seller {
                return Err(EscrowError::Unauthorized);
            }
            
            // Can only dispute active or delivery-confirmed escrows
            if escrow.status != EscrowStatus::Active && escrow.status != EscrowStatus::DeliveryConfirmed {
                return Err(EscrowError::InvalidStatus);
            }
            
            escrow.status = EscrowStatus::Disputed;
            
            // In a full implementation, this would create a dispute in the dispute resolution contract
            let dispute_id = escrow_id; // Simplified for MVP
            escrow.dispute_id = Some(dispute_id);
            
            logger.log(&EscrowEvent::DisputeRaised { escrow_id, dispute_id })?;
            
            Ok(())
        }
        
        UpdateParams::ResolveDispute { escrow_id, resolution } => {
            let escrow = state.escrows.get_mut(&escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            
            // Only dispute contract or admin can resolve disputes
            if let Some(dispute_contract) = state.dispute_contract {
                if ctx.sender() != AccountAddress::Contract(dispute_contract) && ctx.sender() != state.admin {
                    return Err(EscrowError::Unauthorized);
                }
            } else if ctx.sender() != state.admin {
                return Err(EscrowError::Unauthorized);
            }
            
            if escrow.status != EscrowStatus::Disputed {
                return Err(EscrowError::InvalidStatus);
            }
            
            // Execute resolution
            match resolution {
                DisputeResolution::FavorBuyer => {
                    // Refund to buyer
                    host.invoke_transfer(&escrow.buyer, escrow.amount)
                        .map_err(|_| EscrowError::TransferError)?;
                    escrow.status = EscrowStatus::Refunded;
                    
                    logger.log(&EscrowEvent::EscrowRefunded {
                        escrow_id,
                        refund_amount: escrow.amount,
                    })?;
                }
                DisputeResolution::FavorSeller => {
                    // Calculate platform fee and pay seller
                    let platform_fee_amount = Amount::from_micro_ccd(
                        (escrow.amount.micro_ccd() * u64::from(state.platform_fee)) / 10000
                    );
                    let seller_amount = escrow.amount - platform_fee_amount;
                    
                    if seller_amount > Amount::zero() {
                        host.invoke_transfer(&escrow.seller, seller_amount)
                            .map_err(|_| EscrowError::TransferError)?;
                    }
                    
                    escrow.status = EscrowStatus::Completed;
                    
                    logger.log(&EscrowEvent::TransactionCompleted {
                        escrow_id,
                        seller_amount,
                        platform_fee: platform_fee_amount,
                    })?;
                }
                DisputeResolution::Split { seller_percentage } => {
                    if seller_percentage > 100 {
                        return Err(EscrowError::InvalidDisputeResolution);
                    }
                    
                    let seller_amount = Amount::from_micro_ccd(
                        (escrow.amount.micro_ccd() * u64::from(seller_percentage)) / 100
                    );
                    let buyer_refund = escrow.amount - seller_amount;
                    
                    if seller_amount > Amount::zero() {
                        host.invoke_transfer(&escrow.seller, seller_amount)
                            .map_err(|_| EscrowError::TransferError)?;
                    }
                    
                    if buyer_refund > Amount::zero() {
                        host.invoke_transfer(&escrow.buyer, buyer_refund)
                            .map_err(|_| EscrowError::TransferError)?;
                    }
                    
                    escrow.status = EscrowStatus::Completed;
                }
            }
            
            logger.log(&EscrowEvent::DisputeResolved { escrow_id, resolution })?;
            
            Ok(())
        }
        
        UpdateParams::CancelEscrow { escrow_id } => {
            // Only admin can cancel escrow
            if ctx.sender() != state.admin {
                return Err(EscrowError::Unauthorized);
            }
            
            let escrow = state.escrows.get_mut(&escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            
            // Can only cancel created or active escrows
            if escrow.status != EscrowStatus::Created && escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidStatus);
            }
            
            // Refund to buyer
            host.invoke_transfer(&escrow.buyer, escrow.amount)
                .map_err(|_| EscrowError::TransferError)?;
            
            escrow.status = EscrowStatus::Cancelled;
            
            Ok(())
        }
        
        UpdateParams::UpdatePlatformFee { new_fee } => {
            if ctx.sender() != state.admin {
                return Err(EscrowError::Unauthorized);
            }
            
            // Platform fee should not exceed 10% (1000 basis points)
            if new_fee > 1000 {
                return Err(EscrowError::InvalidDisputeResolution);
            }
            
            state.platform_fee = new_fee;
            Ok(())
        }
        
        UpdateParams::SetDisputeContract { contract_address } => {
            if ctx.sender() != state.admin {
                return Err(EscrowError::Unauthorized);
            }
            
            state.dispute_contract = Some(contract_address);
            Ok(())
        }
    }
}

/// Get escrow details by ID
#[receive(
    contract = "credify_escrow",
    name = "get_escrow",
    parameter = "EscrowId",
    return_value = "Option<EscrowDetails>",
    error = "EscrowError"
)]
fn get_escrow(ctx: &ReceiveContext, host: &Host<EscrowState>) -> ContractResult<Option<EscrowDetails>> {
    let escrow_id: EscrowId = ctx.parameter_cursor().get().map_err(|_| EscrowError::ParseError)?;
    Ok(host.state().escrows.get(&escrow_id).cloned())
}

/// Get platform fee
#[receive(
    contract = "credify_escrow",
    name = "get_platform_fee",
    return_value = "u32"
)]
fn get_platform_fee(_ctx: &ReceiveContext, host: &Host<EscrowState>) -> ReceiveResult<u32> {
    Ok(host.state().platform_fee)
}