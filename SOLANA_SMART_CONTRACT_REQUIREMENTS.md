# Solana Smart Contract Requirements for Technova

## Overview
This document outlines the requirements for building Rust-based Solana smart contracts (programs) for the Technova trading platform. The contracts will handle:
1. **Escrow Management** - Create escrow accounts for advisor signups
2. **Trade Recording** - Store closed trade data on-chain for transparency and verification

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Program 1: Escrow Program](#program-1-escrow-program)
3. [Program 2: Trade Recording Program](#program-2-trade-recording-program)
4. [Account Structures](#account-structures)
5. [Instructions](#instructions)
6. [Security Considerations](#security-considerations)
7. [Integration with Backend](#integration-with-backend)
8. [Testing Requirements](#testing-requirements)
9. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Technova Backend                         │
│  (Node.js + Express + Mongoose + Solana Web3.js)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ RPC Calls
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Solana Blockchain                          │
│                                                             │
│  ┌──────────────────────┐    ┌─────────────────────────┐  │
│  │  Escrow Program      │    │  Trade Recording Program│  │
│  │  (Rust)              │    │  (Rust)                 │  │
│  │                      │    │                         │  │
│  │  - Create Escrow     │    │  - Record Trade         │  │
│  │  - Fund Escrow       │    │  - Verify Trade         │  │
│  │  - Release Funds     │    │  - Query Trades         │  │
│  │  - Refund            │    │  - Update Stats         │  │
│  └──────────────────────┘    └─────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Program Derived Addresses (PDAs)          │  │
│  │                                                      │  │
│  │  - Escrow Accounts (per advisor)                    │  │
│  │  - Trade History Accounts (per advisor)             │  │
│  │  - Global Stats Account                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Smart Contract Language**: Rust
- **Framework**: Anchor Framework (recommended) or Native Solana
- **RPC Connection**: Solana Web3.js
- **Network**: Devnet (testing) → Mainnet-beta (production)
- **Wallet**: Phantom, Solflare, or programmatic keypairs

---

## Program 1: Escrow Program

### Purpose
Create and manage escrow accounts for advisors during signup. Funds are held in escrow and can be released based on performance or refunded.

### Use Cases
1. **Advisor Signup** - Create escrow, advisor deposits signup fee
2. **Performance Bond** - Hold funds as performance guarantee
3. **Dispute Resolution** - Refund or release based on platform rules
4. **Subscription Management** - Lock funds for subscription periods

---

### Account Structure

#### 1. Escrow Account (PDA)
```rust
#[account]
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Active,      // Funds locked
    Released,    // Funds released to advisor
    Refunded,    // Funds refunded to platform
    Expired,     // Escrow expired
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowType {
    SignupFee,           // Initial signup fee
    PerformanceBond,     // Performance guarantee
    Subscription,        // Subscription payment
    Penalty,             // Penalty deposit
}
```

**Size Calculation:**
- `advisor`: 32 bytes
- `platform_authority`: 32 bytes
- `amount`: 8 bytes
- `status`: 1 byte (enum)
- `created_at`: 8 bytes
- `expires_at`: 9 bytes (Option<i64>)
- `escrow_type`: 1 byte (enum)
- `bump`: 1 byte
- **Total**: ~92 bytes + discriminator (8 bytes) = **100 bytes**

---

### Instructions

#### 1. Initialize Escrow
```rust
pub fn initialize_escrow(
    ctx: Context<InitializeEscrow>,
    amount: u64,
    escrow_type: EscrowType,
    expires_at: Option<i64>,
) -> Result<()>
```

**Accounts:**
- `escrow_account` (PDA, mut, init) - Escrow account to create
- `advisor` (signer, mut) - Advisor creating the escrow
- `platform_authority` (account) - Platform authority
- `system_program` (program) - System program

**Logic:**
1. Derive PDA for escrow account
2. Initialize escrow with provided data
3. Transfer `amount` from advisor to escrow PDA
4. Set status to `Active`
5. Emit `EscrowCreated` event

---

#### 2. Fund Escrow
```rust
pub fn fund_escrow(
    ctx: Context<FundEscrow>,
    additional_amount: u64,
) -> Result<()>
```

**Accounts:**
- `escrow_account` (PDA, mut) - Escrow to fund
- `funder` (signer, mut) - Account funding the escrow
- `system_program` (program) - System program

**Logic:**
1. Verify escrow is `Active`
2. Transfer `additional_amount` to escrow PDA
3. Update escrow amount
4. Emit `EscrowFunded` event

---

#### 3. Release Escrow
```rust
pub fn release_escrow(
    ctx: Context<ReleaseEscrow>,
) -> Result<()>
```

**Accounts:**
- `escrow_account` (PDA, mut) - Escrow to release
- `advisor` (mut) - Advisor receiving funds
- `platform_authority` (signer) - Platform authority
- `system_program` (program) - System program

**Logic:**
1. Verify signer is platform authority
2. Verify escrow is `Active`
3. Transfer all funds from escrow to advisor
4. Set status to `Released`
5. Emit `EscrowReleased` event

**Authorization:**
- Only platform authority can release
- Escrow must be active

---

#### 4. Refund Escrow
```rust
pub fn refund_escrow(
    ctx: Context<RefundEscrow>,
    recipient: Pubkey,
) -> Result<()>
```

**Accounts:**
- `escrow_account` (PDA, mut) - Escrow to refund
- `recipient` (mut) - Account receiving refund
- `platform_authority` (signer) - Platform authority
- `system_program` (program) - System program

**Logic:**
1. Verify signer is platform authority
2. Verify escrow is `Active`
3. Transfer all funds from escrow to recipient
4. Set status to `Refunded`
5. Emit `EscrowRefunded` event

---

#### 5. Close Escrow
```rust
pub fn close_escrow(
    ctx: Context<CloseEscrow>,
) -> Result<()>
```

**Accounts:**
- `escrow_account` (PDA, mut, close) - Escrow to close
- `advisor` (mut) - Advisor (rent receiver)
- `platform_authority` (signer) - Platform authority

**Logic:**
1. Verify escrow is `Released`, `Refunded`, or `Expired`
2. Close account and return rent to advisor
3. Emit `EscrowClosed` event

---

### Events

```rust
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
pub struct EscrowClosed {
    pub escrow: Pubkey,
    pub timestamp: i64,
}
```

---

## Program 2: Trade Recording Program

### Purpose
Store closed trade data on-chain for transparency, verification, and building advisor reputation.

### Use Cases
1. **Trade History** - Immutable record of all closed trades
2. **Performance Verification** - Verify advisor claims
3. **Trust Score** - Calculate on-chain trust scores
4. **Regulatory Compliance** - Auditable trade history
5. **Investor Confidence** - Transparent track record

---

### Account Structure

#### 1. Trade Record Account (PDA)
```rust
#[account]
pub struct TradeRecord {
    /// Advisor's public key
    pub advisor: Pubkey,
    
    /// Trade ID from MongoDB (for cross-reference)
    pub trade_id: [u8; 32], // Hash of MongoDB ObjectId
    
    /// Trading symbol
    pub symbol: String, // Max 32 chars
    
    /// Asset class
    pub asset_class: AssetClass,
    
    /// Trade direction
    pub direction: TradeDirection,
    
    /// Entry price (scaled by 1e6 for precision)
    pub entry_price: u64,
    
    /// Exit price (scaled by 1e6 for precision)
    pub exit_price: u64,
    
    /// Quantity
    pub quantity: u32,
    
    /// Profit/Loss (scaled by 1e6, can be negative)
    pub profit_loss: i64,
    
    /// Profit/Loss percentage (scaled by 1e4, e.g., 1550 = 15.50%)
    pub profit_loss_percentage: i32,
    
    /// Trade outcome
    pub outcome: TradeOutcome,
    
    /// Stop loss price (scaled by 1e6)
    pub stop_loss: u64,
    
    /// Target price (scaled by 1e6)
    pub target: u64,
    
    /// Risk-reward ratio (scaled by 1e2, e.g., 250 = 2.50)
    pub risk_reward_ratio: u16,
    
    /// Timestamp when trade was opened
    pub opened_at: i64,
    
    /// Timestamp when trade was closed
    pub closed_at: i64,
    
    /// Reason for closure
    pub closed_reason: ClosedReason,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AssetClass {
    Equity,
    Futures,
    Options,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TradeDirection {
    Buy,
    Sell,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TradeOutcome {
    Profit,
    Loss,
    Breakeven,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ClosedReason {
    TargetHit,
    StopLossHit,
    Manual,
    Expired,
}
```

**Size Calculation:**
- `advisor`: 32 bytes
- `trade_id`: 32 bytes
- `symbol`: 4 + 32 = 36 bytes (String with max 32 chars)
- `asset_class`: 1 byte
- `direction`: 1 byte
- `entry_price`: 8 bytes
- `exit_price`: 8 bytes
- `quantity`: 4 bytes
- `profit_loss`: 8 bytes
- `profit_loss_percentage`: 4 bytes
- `outcome`: 1 byte
- `stop_loss`: 8 bytes
- `target`: 8 bytes
- `risk_reward_ratio`: 2 bytes
- `opened_at`: 8 bytes
- `closed_at`: 8 bytes
- `closed_reason`: 1 byte
- `bump`: 1 byte
- **Total**: ~171 bytes + discriminator (8 bytes) = **179 bytes**

---

#### 2. Advisor Stats Account (PDA)
```rust
#[account]
pub struct AdvisorStats {
    /// Advisor's public key
    pub advisor: Pubkey,
    
    /// Total number of trades
    pub total_trades: u32,
    
    /// Number of winning trades
    pub winning_trades: u32,
    
    /// Number of losing trades
    pub losing_trades: u32,
    
    /// Win rate (scaled by 1e4, e.g., 6500 = 65.00%)
    pub win_rate: u16,
    
    /// Total profit (scaled by 1e6)
    pub total_profit: u64,
    
    /// Total loss (scaled by 1e6)
    pub total_loss: u64,
    
    /// Net profit/loss (scaled by 1e6, can be negative)
    pub net_profit_loss: i64,
    
    /// Average risk-reward ratio (scaled by 1e2)
    pub avg_risk_reward: u16,
    
    /// Trust score (0-100)
    pub trust_score: u8,
    
    /// Last updated timestamp
    pub last_updated: i64,
    
    /// Bump seed
    pub bump: u8,
}
```

**Size Calculation:**
- `advisor`: 32 bytes
- `total_trades`: 4 bytes
- `winning_trades`: 4 bytes
- `losing_trades`: 4 bytes
- `win_rate`: 2 bytes
- `total_profit`: 8 bytes
- `total_loss`: 8 bytes
- `net_profit_loss`: 8 bytes
- `avg_risk_reward`: 2 bytes
- `trust_score`: 1 byte
- `last_updated`: 8 bytes
- `bump`: 1 byte
- **Total**: ~82 bytes + discriminator (8 bytes) = **90 bytes**

---

### Instructions

#### 1. Initialize Advisor Stats
```rust
pub fn initialize_advisor_stats(
    ctx: Context<InitializeAdvisorStats>,
) -> Result<()>
```

**Accounts:**
- `advisor_stats` (PDA, mut, init) - Stats account to create
- `advisor` (signer, mut) - Advisor
- `system_program` (program) - System program

**Logic:**
1. Derive PDA for advisor stats
2. Initialize with zero values
3. Emit `AdvisorStatsInitialized` event

---

#### 2. Record Trade
```rust
pub fn record_trade(
    ctx: Context<RecordTrade>,
    trade_data: TradeData,
) -> Result<()>

pub struct TradeData {
    pub trade_id: [u8; 32],
    pub symbol: String,
    pub asset_class: AssetClass,
    pub direction: TradeDirection,
    pub entry_price: u64,
    pub exit_price: u64,
    pub quantity: u32,
    pub profit_loss: i64,
    pub profit_loss_percentage: i32,
    pub outcome: TradeOutcome,
    pub stop_loss: u64,
    pub target: u64,
    pub risk_reward_ratio: u16,
    pub opened_at: i64,
    pub closed_at: i64,
    pub closed_reason: ClosedReason,
}
```

**Accounts:**
- `trade_record` (PDA, mut, init) - Trade record to create
- `advisor_stats` (PDA, mut) - Advisor stats to update
- `advisor` (signer, mut) - Advisor
- `platform_authority` (account) - Platform authority (for verification)
- `system_program` (program) - System program

**Logic:**
1. Verify signer is advisor
2. Derive PDA for trade record (using advisor + trade_id)
3. Create trade record with provided data
4. Update advisor stats:
   - Increment total_trades
   - Increment winning_trades or losing_trades
   - Update total_profit or total_loss
   - Recalculate win_rate
   - Update avg_risk_reward
   - Update net_profit_loss
5. Emit `TradeRecorded` event

**Validation:**
- `symbol` must be <= 32 chars
- `entry_price` and `exit_price` must be > 0
- `quantity` must be > 0
- `closed_at` must be >= `opened_at`

---

#### 3. Verify Trade
```rust
pub fn verify_trade(
    ctx: Context<VerifyTrade>,
    trade_id: [u8; 32],
) -> Result<TradeRecord>
```

**Accounts:**
- `trade_record` (PDA) - Trade record to verify
- `advisor` (account) - Advisor

**Logic:**
1. Fetch trade record from PDA
2. Verify it exists and matches advisor
3. Return trade data

**Returns:** Full `TradeRecord` struct

---

#### 4. Query Advisor Stats
```rust
pub fn get_advisor_stats(
    ctx: Context<GetAdvisorStats>,
) -> Result<AdvisorStats>
```

**Accounts:**
- `advisor_stats` (PDA) - Advisor stats account
- `advisor` (account) - Advisor

**Logic:**
1. Fetch advisor stats from PDA
2. Return stats data

**Returns:** Full `AdvisorStats` struct

---

#### 5. Update Trust Score
```rust
pub fn update_trust_score(
    ctx: Context<UpdateTrustScore>,
    new_score: u8,
) -> Result<()>
```

**Accounts:**
- `advisor_stats` (PDA, mut) - Advisor stats to update
- `platform_authority` (signer) - Platform authority
- `advisor` (account) - Advisor

**Logic:**
1. Verify signer is platform authority
2. Update trust_score in advisor stats
3. Update last_updated timestamp
4. Emit `TrustScoreUpdated` event

**Authorization:**
- Only platform authority can update trust score

---

### Events

```rust
#[event]
pub struct AdvisorStatsInitialized {
    pub advisor: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TradeRecorded {
    pub advisor: Pubkey,
    pub trade_id: [u8; 32],
    pub symbol: String,
    pub outcome: TradeOutcome,
    pub profit_loss: i64,
    pub timestamp: i64,
}

#[event]
pub struct TrustScoreUpdated {
    pub advisor: Pubkey,
    pub old_score: u8,
    pub new_score: u8,
    pub timestamp: i64,
}
```

---

## Security Considerations

### 1. Access Control
```rust
// Only advisor can record their own trades
require!(
    ctx.accounts.advisor.key() == ctx.accounts.trade_record.advisor,
    ErrorCode::Unauthorized
);

// Only platform authority can release escrow
require!(
    ctx.accounts.platform_authority.is_signer,
    ErrorCode::UnauthorizedPlatformAction
);
```

### 2. Input Validation
```rust
// Validate price values
require!(
    trade_data.entry_price > 0 && trade_data.exit_price > 0,
    ErrorCode::InvalidPrice
);

// Validate symbol length
require!(
    trade_data.symbol.len() <= 32,
    ErrorCode::SymbolTooLong
);

// Validate timestamps
require!(
    trade_data.closed_at >= trade_data.opened_at,
    ErrorCode::InvalidTimestamp
);
```

### 3. Overflow Protection
```rust
// Use checked arithmetic
let new_total = old_total
    .checked_add(amount)
    .ok_or(ErrorCode::Overflow)?;

// For signed values
let net_pnl = total_profit
    .checked_sub(total_loss)
    .ok_or(ErrorCode::Overflow)?;
```

### 4. PDA Derivation
```rust
// Escrow PDA
let (escrow_pda, bump) = Pubkey::find_program_address(
    &[
        b"escrow",
        advisor.key().as_ref(),
    ],
    program_id,
);

// Trade Record PDA
let (trade_pda, bump) = Pubkey::find_program_address(
    &[
        b"trade",
        advisor.key().as_ref(),
        trade_id.as_ref(),
    ],
    program_id,
);

// Advisor Stats PDA
let (stats_pda, bump) = Pubkey::find_program_address(
    &[
        b"stats",
        advisor.key().as_ref(),
    ],
    program_id,
);
```

### 5. Rent Exemption
```rust
// Ensure accounts are rent-exempt
let rent = Rent::get()?;
let space = 179; // TradeRecord size
let lamports = rent.minimum_balance(space);

require!(
    ctx.accounts.payer.lamports() >= lamports,
    ErrorCode::InsufficientFunds
);
```

---

## Integration with Backend

### 1. Connection Setup

**File:** `/backend/services/solana.service.js`

```javascript
import { 
  Connection, 
  Keypair, 
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { IDL as EscrowIDL } from "../idl/escrow_program.json";
import { IDL as TradeIDL } from "../idl/trade_program.json";

// Configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const ESCROW_PROGRAM_ID = new PublicKey(process.env.ESCROW_PROGRAM_ID);
const TRADE_PROGRAM_ID = new PublicKey(process.env.TRADE_PROGRAM_ID);
const PLATFORM_KEYPAIR = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(process.env.PLATFORM_SECRET_KEY))
);

const connection = new Connection(SOLANA_RPC_URL, "confirmed");
```

---

### 2. Escrow Functions

#### Create Escrow
```javascript
export const createEscrow = async (advisorPublicKey, amount, escrowType) => {
  try {
    const advisor = new PublicKey(advisorPublicKey);
    
    // Derive escrow PDA
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), advisor.toBuffer()],
      ESCROW_PROGRAM_ID
    );
    
    // Create provider
    const provider = new AnchorProvider(
      connection,
      { publicKey: advisor },
      { commitment: "confirmed" }
    );
    
    // Load program
    const program = new Program(EscrowIDL, ESCROW_PROGRAM_ID, provider);
    
    // Build transaction
    const tx = await program.methods
      .initializeEscrow(
        new web3.BN(amount * web3.LAMPORTS_PER_SOL),
        { [escrowType]: {} }, // Enum variant
        null // No expiry
      )
      .accounts({
        escrowAccount: escrowPDA,
        advisor: advisor,
        platformAuthority: PLATFORM_KEYPAIR.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return {
      success: true,
      transactionId: tx,
      escrowPDA: escrowPDA.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    };
  } catch (error) {
    console.error("Error creating escrow:", error);
    throw error;
  }
};
```

#### Release Escrow
```javascript
export const releaseEscrow = async (advisorPublicKey) => {
  try {
    const advisor = new PublicKey(advisorPublicKey);
    
    // Derive escrow PDA
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), advisor.toBuffer()],
      ESCROW_PROGRAM_ID
    );
    
    const provider = new AnchorProvider(
      connection,
      { publicKey: PLATFORM_KEYPAIR.publicKey, signTransaction: async (tx) => tx },
      { commitment: "confirmed" }
    );
    
    const program = new Program(EscrowIDL, ESCROW_PROGRAM_ID, provider);
    
    const tx = await program.methods
      .releaseEscrow()
      .accounts({
        escrowAccount: escrowPDA,
        advisor: advisor,
        platformAuthority: PLATFORM_KEYPAIR.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([PLATFORM_KEYPAIR])
      .rpc();
    
    return {
      success: true,
      transactionId: tx,
      explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    };
  } catch (error) {
    console.error("Error releasing escrow:", error);
    throw error;
  }
};
```

---

### 3. Trade Recording Functions

#### Record Trade to Blockchain
```javascript
export const writeTradeToBlockchain = async (tradeData) => {
  try {
    const { advisorPublicKey, tradeDetails } = tradeData;
    const advisor = new PublicKey(advisorPublicKey);
    
    // Convert MongoDB ObjectId to 32-byte hash
    const tradeIdHash = crypto
      .createHash('sha256')
      .update(tradeDetails.tradeId)
      .digest();
    
    // Derive PDAs
    const [tradePDA] = await PublicKey.findProgramAddress(
      [Buffer.from("trade"), advisor.toBuffer(), tradeIdHash],
      TRADE_PROGRAM_ID
    );
    
    const [statsPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("stats"), advisor.toBuffer()],
      TRADE_PROGRAM_ID
    );
    
    const provider = new AnchorProvider(
      connection,
      { publicKey: advisor },
      { commitment: "confirmed" }
    );
    
    const program = new Program(TradeIDL, TRADE_PROGRAM_ID, provider);
    
    // Prepare trade data (scale prices by 1e6 for precision)
    const tradeDataOnChain = {
      tradeId: Array.from(tradeIdHash),
      symbol: tradeDetails.symbol,
      assetClass: { [tradeDetails.assetClass]: {} },
      direction: { [tradeDetails.direction]: {} },
      entryPrice: new web3.BN(tradeDetails.entryPrice * 1e6),
      exitPrice: new web3.BN(tradeDetails.exitPrice * 1e6),
      quantity: tradeDetails.quantity,
      profitLoss: new web3.BN(tradeDetails.profitLoss * 1e6),
      profitLossPercentage: Math.round(tradeDetails.profitLossPercentage * 1e4),
      outcome: { [tradeDetails.outcome]: {} },
      stopLoss: new web3.BN(tradeDetails.stopLoss * 1e6),
      target: new web3.BN(tradeDetails.target * 1e6),
      riskRewardRatio: Math.round(tradeDetails.riskRewardRatio * 1e2),
      openedAt: new web3.BN(new Date(tradeDetails.openedAt).getTime() / 1000),
      closedAt: new web3.BN(new Date(tradeDetails.closedAt).getTime() / 1000),
      closedReason: { [tradeDetails.closedReason]: {} },
    };
    
    const tx = await program.methods
      .recordTrade(tradeDataOnChain)
      .accounts({
        tradeRecord: tradePDA,
        advisorStats: statsPDA,
        advisor: advisor,
        platformAuthority: PLATFORM_KEYPAIR.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return {
      success: true,
      transactionId: tx,
      tradePDA: tradePDA.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    };
  } catch (error) {
    console.error("Error writing trade to blockchain:", error);
    throw error;
  }
};
```

#### Verify Trade
```javascript
export const verifyTradeOnChain = async (advisorPublicKey, tradeId) => {
  try {
    const advisor = new PublicKey(advisorPublicKey);
    
    const tradeIdHash = crypto
      .createHash('sha256')
      .update(tradeId)
      .digest();
    
    const [tradePDA] = await PublicKey.findProgramAddress(
      [Buffer.from("trade"), advisor.toBuffer(), tradeIdHash],
      TRADE_PROGRAM_ID
    );
    
    const provider = new AnchorProvider(
      connection,
      { publicKey: advisor },
      { commitment: "confirmed" }
    );
    
    const program = new Program(TradeIDL, TRADE_PROGRAM_ID, provider);
    
    // Fetch trade record
    const tradeRecord = await program.account.tradeRecord.fetch(tradePDA);
    
    return {
      isValid: true,
      onChainData: {
        symbol: tradeRecord.symbol,
        entryPrice: tradeRecord.entryPrice.toNumber() / 1e6,
        exitPrice: tradeRecord.exitPrice.toNumber() / 1e6,
        profitLoss: tradeRecord.profitLoss.toNumber() / 1e6,
        outcome: Object.keys(tradeRecord.outcome)[0],
        closedAt: new Date(tradeRecord.closedAt.toNumber() * 1000),
      },
      tradePDA: tradePDA.toString(),
    };
  } catch (error) {
    console.error("Error verifying trade:", error);
    return {
      isValid: false,
      error: error.message,
    };
  }
};
```

#### Get Advisor Stats
```javascript
export const getAdvisorStats = async (advisorPublicKey) => {
  try {
    const advisor = new PublicKey(advisorPublicKey);
    
    const [statsPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("stats"), advisor.toBuffer()],
      TRADE_PROGRAM_ID
    );
    
    const provider = new AnchorProvider(
      connection,
      { publicKey: advisor },
      { commitment: "confirmed" }
    );
    
    const program = new Program(TradeIDL, TRADE_PROGRAM_ID, provider);
    
    const stats = await program.account.advisorStats.fetch(statsPDA);
    
    return {
      totalTrades: stats.totalTrades,
      winningTrades: stats.winningTrades,
      losingTrades: stats.losingTrades,
      winRate: stats.winRate / 1e4, // Convert back to percentage
      totalProfit: stats.totalProfit.toNumber() / 1e6,
      totalLoss: stats.totalLoss.toNumber() / 1e6,
      netProfitLoss: stats.netProfitLoss.toNumber() / 1e6,
      avgRiskReward: stats.avgRiskReward / 1e2,
      trustScore: stats.trustScore,
      lastUpdated: new Date(stats.lastUpdated.toNumber() * 1000),
    };
  } catch (error) {
    console.error("Error fetching advisor stats:", error);
    throw error;
  }
};
```

---

## Testing Requirements

### 1. Unit Tests (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::prelude::*;
    
    #[test]
    fn test_initialize_escrow() {
        // Test escrow creation
    }
    
    #[test]
    fn test_release_escrow() {
        // Test escrow release
    }
    
    #[test]
    fn test_record_trade() {
        // Test trade recording
    }
    
    #[test]
    fn test_advisor_stats_update() {
        // Test stats calculation
    }
}
```

### 2. Integration Tests

```typescript
// tests/escrow.ts
describe("Escrow Program", () => {
  it("Creates escrow account", async () => {
    // Test implementation
  });
  
  it("Releases escrow funds", async () => {
    // Test implementation
  });
  
  it("Refunds escrow", async () => {
    // Test implementation
  });
});

// tests/trade_recording.ts
describe("Trade Recording Program", () => {
  it("Records trade on-chain", async () => {
    // Test implementation
  });
  
  it("Updates advisor stats", async () => {
    // Test implementation
  });
  
  it("Verifies trade data", async () => {
    // Test implementation
  });
});
```

### 3. Backend Integration Tests

```javascript
// backend/test/blockchain.test.js
describe("Blockchain Integration", () => {
  it("should create escrow on advisor signup", async () => {
    // Test implementation
  });
  
  it("should record closed trade to blockchain", async () => {
    // Test implementation
  });
  
  it("should verify trade on-chain", async () => {
    // Test implementation
  });
});
```

---

## Deployment Guide

### 1. Build Programs

```bash
# Navigate to program directory
cd programs/escrow_program
anchor build

cd ../trade_program
anchor build
```

### 2. Deploy to Devnet

```bash
# Set Solana config to devnet
solana config set --url devnet

# Deploy escrow program
anchor deploy --provider.cluster devnet

# Deploy trade program
anchor deploy --provider.cluster devnet
```

### 3. Update Backend Configuration

```bash
# .env
SOLANA_RPC_URL=https://api.devnet.solana.com
ESCROW_PROGRAM_ID=<deployed_escrow_program_id>
TRADE_PROGRAM_ID=<deployed_trade_program_id>
PLATFORM_SECRET_KEY=<platform_keypair_secret>
```

### 4. Initialize Platform Authority

```javascript
// scripts/initialize.js
const initializePlatform = async () => {
  // Create platform authority keypair
  // Fund with SOL for transaction fees
  // Initialize global accounts if needed
};
```

---

## Cost Estimation

### Transaction Costs (Devnet/Mainnet)

| Operation | Accounts | Compute Units | Approx Cost (SOL) |
|-----------|----------|---------------|-------------------|
| Create Escrow | 4 | ~20,000 | 0.000005 |
| Release Escrow | 4 | ~15,000 | 0.000005 |
| Record Trade | 5 | ~30,000 | 0.000005 |
| Verify Trade | 2 | ~5,000 | 0.000005 |

### Storage Costs (Rent)

| Account Type | Size | Rent (SOL) | Recoverable |
|--------------|------|------------|-------------|
| Escrow Account | 100 bytes | ~0.0007 | Yes |
| Trade Record | 179 bytes | ~0.0013 | No |
| Advisor Stats | 90 bytes | ~0.0006 | No |

**Note:** Rent is one-time and can be recovered when closing accounts.

---

## Security Audit Checklist

- [ ] Access control implemented correctly
- [ ] Input validation on all instructions
- [ ] Overflow protection with checked arithmetic
- [ ] PDA derivation secure and unique
- [ ] Rent exemption enforced
- [ ] No reentrancy vulnerabilities
- [ ] Events emitted for all state changes
- [ ] Error handling comprehensive
- [ ] No hardcoded addresses
- [ ] Proper account ownership checks

---

## Maintenance & Upgrades

### Program Upgrades

```bash
# Build new version
anchor build

# Upgrade program (requires upgrade authority)
anchor upgrade <program_id> --program-id <program_id>
```

### Monitoring

```javascript
// Monitor program events
connection.onLogs(TRADE_PROGRAM_ID, (logs) => {
  console.log("Program logs:", logs);
});

// Monitor account changes
connection.onAccountChange(tradePDA, (accountInfo) => {
  console.log("Account updated:", accountInfo);
});
```

---

## Summary

This document provides comprehensive requirements for building Solana smart contracts for Technova:

1. **Escrow Program** - Manages advisor signup deposits and performance bonds
2. **Trade Recording Program** - Stores immutable trade history on-chain

### Key Benefits
- ✅ Transparent trade history
- ✅ Verifiable advisor performance
- ✅ Secure escrow management
- ✅ Immutable audit trail
- ✅ Regulatory compliance
- ✅ Investor confidence

### Next Steps
1. Set up Anchor development environment
2. Implement escrow program
3. Implement trade recording program
4. Write comprehensive tests
5. Deploy to devnet
6. Integrate with backend
7. Security audit
8. Deploy to mainnet

**Estimated Development Time:** 4-6 weeks for both programs including testing and integration.

