use anchor_lang::prelude::*;

declare_id!("EisKdCuTXweGNbtaYbe1pAiCda2Xh2ouroVTcTyhFupA");

#[program]
pub mod technova_escrow {
    use super::*;

    /// Initialize a new escrow account for an advisor
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        escrow_type: EscrowType,
        expires_at: Option<i64>,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::InvalidAmount);
    
        let clock = Clock::get()?;
    
        // ✅ Extract everything needed BEFORE mutable borrow
        let escrow_key = ctx.accounts.escrow_account.key();
        let advisor_key = ctx.accounts.advisor.key();
        let platform_key = ctx.accounts.platform_authority.key();
    
        // ✅ Now take mutable borrow
        let escrow = &mut ctx.accounts.escrow_account;
    
        if let Some(expiry) = expires_at {
            require!(expiry > clock.unix_timestamp, EscrowError::InvalidExpiry);
        }
    
        escrow.advisor = advisor_key;
        escrow.platform_authority = platform_key;
        escrow.amount = amount;
        escrow.status = EscrowStatus::Active;
        escrow.created_at = clock.unix_timestamp;
        escrow.expires_at = expires_at;
        escrow.escrow_type = escrow_type.clone();
        escrow.bump = ctx.bumps.escrow_account;
    
        // ✅ Transfer SOL
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &advisor_key,
            &escrow_key,
            amount,
        );
    
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.advisor.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    
        // ✅ Emit event AFTER mutation
        emit!(EscrowCreated {
            escrow: escrow_key,
            advisor: advisor_key,
            amount,
            escrow_type,
            timestamp: clock.unix_timestamp,
        });
    
        Ok(())
    }

    /// Add additional funds to an existing escrow
    pub fn fund_escrow(ctx: Context<FundEscrow>, additional_amount: u64) -> Result<()> {
        require!(additional_amount > 0, EscrowError::InvalidAmount);

        let escrow = &mut ctx.accounts.escrow_account;

        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::EscrowNotActive
        );

        // Update amount with overflow check
        let new_amount = escrow
            .amount
            .checked_add(additional_amount)
            .ok_or(EscrowError::Overflow)?;

        // Transfer SOL from funder to escrow PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.funder.key(),
            &ctx.accounts.escrow_account.key(),
            additional_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.funder.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        escrow.amount = new_amount;

        let clock = Clock::get()?;
        emit!(EscrowFunded {
            escrow: ctx.accounts.escrow_account.key(),
            funder: ctx.accounts.funder.key(),
            amount: additional_amount,
            new_total: new_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Release escrow funds to the advisor (platform authority only)
    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;

        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::EscrowNotActive
        );

        let amount = escrow.amount;

        // Transfer all funds from escrow PDA to advisor
        // PDA can sign for itself using seeds
        **ctx
            .accounts
            .escrow_account
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .advisor
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        escrow.amount = 0;
        escrow.status = EscrowStatus::Released;

        let clock = Clock::get()?;
        emit!(EscrowReleased {
            escrow: ctx.accounts.escrow_account.key(),
            advisor: ctx.accounts.advisor.key(),
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Refund escrow funds to a specified recipient (platform authority only)
    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;

        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::EscrowNotActive
        );

        let amount = escrow.amount;

        // Transfer all funds from escrow PDA to recipient
        **ctx
            .accounts
            .escrow_account
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .recipient
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        escrow.amount = 0;
        escrow.status = EscrowStatus::Refunded;

        let clock = Clock::get()?;
        emit!(EscrowRefunded {
            escrow: ctx.accounts.escrow_account.key(),
            recipient: ctx.accounts.recipient.key(),
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Mark an escrow as expired (if past expiry time)
    pub fn expire_escrow(ctx: Context<ExpireEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::EscrowNotActive
        );

        require!(escrow.expires_at.is_some(), EscrowError::NoExpirySet);

        require!(
            clock.unix_timestamp >= escrow.expires_at.unwrap(),
            EscrowError::NotExpiredYet
        );

        escrow.status = EscrowStatus::Expired;

        emit!(EscrowExpired {
            escrow: ctx.accounts.escrow_account.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Close an escrow account and recover rent (only if not active)
    pub fn close_escrow(ctx: Context<CloseEscrow>) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;

        require!(
            escrow.status != EscrowStatus::Active,
            EscrowError::CannotCloseActiveEscrow
        );

        require!(escrow.amount == 0, EscrowError::EscrowNotEmpty);

        let clock = Clock::get()?;
        emit!(EscrowClosed {
            escrow: ctx.accounts.escrow_account.key(),
            timestamp: clock.unix_timestamp,
        });

        // Account will be closed automatically via the `close` constraint

        Ok(())
    }

    /// Get escrow details (view function - can be called off-chain)
    pub fn get_escrow_info(ctx: Context<GetEscrowInfo>) -> Result<EscrowInfo> {
        let escrow = &ctx.accounts.escrow_account;

        Ok(EscrowInfo {
            advisor: escrow.advisor,
            platform_authority: escrow.platform_authority,
            amount: escrow.amount,
            status: escrow.status.clone(),
            escrow_type: escrow.escrow_type.clone(),
            created_at: escrow.created_at,
            expires_at: escrow.expires_at,
        })
    }
}

// ============================================================================
// ACCOUNT STRUCTURES
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    /// Advisor's public key
    pub advisor: Pubkey,

    /// Platform authority (can release/refund)
    pub platform_authority: Pubkey,

    /// Amount locked in escrow (in lamports)
    pub amount: u64,

    /// Escrow status
    pub status: EscrowStatus,

    /// Timestamp when escrow was created
    pub created_at: i64,

    /// Timestamp when escrow expires (if applicable)
    pub expires_at: Option<i64>,

    /// Reason for escrow
    pub escrow_type: EscrowType,

    /// Bump seed for PDA derivation
    pub bump: u8,
}

// ============================================================================
// ENUMS
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Active,
    Released,
    Refunded,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowType {
    SignupFee,
    PerformanceBond,
    Subscription,
    Penalty,
}

// ============================================================================
// INSTRUCTION CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = advisor,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [b"escrow", advisor.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub advisor: Signer<'info>,

    /// CHECK: Platform authority pubkey, validated by business logic
    pub platform_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.advisor.as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub funder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.advisor.as_ref()],
        bump = escrow_account.bump,
        constraint = escrow_account.platform_authority == platform_authority.key() @ EscrowError::Unauthorized
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    /// CHECK: Advisor account to receive funds
    #[account(
        mut,
        constraint = advisor.key() == escrow_account.advisor @ EscrowError::InvalidAdvisor
    )]
    pub advisor: UncheckedAccount<'info>,

    #[account(mut)]
    pub platform_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.advisor.as_ref()],
        bump = escrow_account.bump,
        constraint = escrow_account.platform_authority == platform_authority.key() @ EscrowError::Unauthorized
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    /// CHECK: Recipient account to receive refund
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub platform_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExpireEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.advisor.as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    /// Anyone can call expire if conditions are met
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.advisor.as_ref()],
        bump = escrow_account.bump,
        constraint = escrow_account.platform_authority == platform_authority.key() @ EscrowError::Unauthorized,
        close = rent_receiver
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub platform_authority: Signer<'info>,

    /// CHECK: Account to receive rent
    #[account(mut)]
    pub rent_receiver: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct GetEscrowInfo<'info> {
    #[account(
        seeds = [b"escrow", escrow_account.advisor.as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
}

// ============================================================================
// RETURN TYPES
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct EscrowInfo {
    pub advisor: Pubkey,
    pub platform_authority: Pubkey,
    pub amount: u64,
    pub status: EscrowStatus,
    pub escrow_type: EscrowType,
    pub created_at: i64,
    pub expires_at: Option<i64>,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub advisor: Pubkey,
    pub amount: u64,
    pub escrow_type: EscrowType,
    pub timestamp: i64,
}

#[event]
pub struct EscrowFunded {
    pub escrow: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
    pub new_total: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowReleased {
    pub escrow: Pubkey,
    pub advisor: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowRefunded {
    pub escrow: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowExpired {
    pub escrow: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct EscrowClosed {
    pub escrow: Pubkey,
    pub timestamp: i64,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum EscrowError {
    #[msg("Unauthorized: Only platform authority can perform this action")]
    Unauthorized,

    #[msg("Invalid advisor account")]
    InvalidAdvisor,

    #[msg("Escrow is not active")]
    EscrowNotActive,

    #[msg("Cannot close an active escrow")]
    CannotCloseActiveEscrow,

    #[msg("Escrow account still has funds")]
    EscrowNotEmpty,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Expiry time must be in the future")]
    InvalidExpiry,

    #[msg("No expiry time set for this escrow")]
    NoExpirySet,

    #[msg("Escrow has not expired yet")]
    NotExpiredYet,
}
