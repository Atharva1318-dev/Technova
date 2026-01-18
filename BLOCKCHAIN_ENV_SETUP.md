# Blockchain Environment Variables Setup Guide

## Required Environment Variables

### Backend `.env` File

Add these variables to `/home/dhruv/C_drive/techno/Technova/backend/.env`:

```env
# ============================================================================
# SOLANA BLOCKCHAIN CONFIGURATION
# ============================================================================

# Solana RPC URL (Devnet for testing, Mainnet for production)
SOLANA_RPC_URL=https://api.devnet.solana.com

# Deployed Escrow Program ID
ESCROW_PROGRAM_ID=EisKdCuTXweGNbtaYbe1pAiCda2Xh2ouroVTcTyhFupA

# Trade Recording Program ID (Future - when deployed)
TRADE_PROGRAM_ID=TradeProgram111111111111111111111111111111

# Platform Authority Secret Key (KEEP THIS SECRET!)
# This is a JSON array of 64 numbers representing the keypair
# Generate using: node scripts/generate-platform-keypair.js
PLATFORM_SECRET_KEY=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]

# ============================================================================
# EXISTING ENVIRONMENT VARIABLES (Keep these)
# ============================================================================

PORT=8901
MONGODB_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret

# Cloudinary (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Twilio (Optional - for SMS 2FA)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Supabase (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

---

## Step-by-Step Setup

### Step 1: Generate Platform Authority Keypair

The platform authority is the admin account that can release escrows and manage the blockchain operations.

**Option A: Using Node.js (Recommended)**

Create a file `backend/scripts/generate-platform-keypair.js`:

```javascript
import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate();

console.log("=".repeat(60));
console.log("PLATFORM AUTHORITY KEYPAIR GENERATED");
console.log("=".repeat(60));
console.log("\nPublic Key (Platform Authority Address):");
console.log(keypair.publicKey.toString());
console.log("\nSecret Key (Add this to .env as PLATFORM_SECRET_KEY):");
console.log(JSON.stringify(Array.from(keypair.secretKey)));
console.log("\n⚠️  KEEP THE SECRET KEY SECURE! Never commit it to git!");
console.log("=".repeat(60));
```

Run it:
```bash
cd backend
node scripts/generate-platform-keypair.js
```

**Option B: Using Solana CLI**

```bash
# Generate a new keypair
solana-keygen new --outfile platform-authority.json

# Get the public key
solana-keygen pubkey platform-authority.json

# Convert to array format for .env
node -e "const fs = require('fs'); const kp = JSON.parse(fs.readFileSync('platform-authority.json')); console.log(JSON.stringify(kp));"
```

### Step 2: Fund the Platform Authority (Devnet Only)

The platform authority needs SOL to pay for transaction fees.

```bash
# Get devnet SOL (free)
solana airdrop 2 <YOUR_PLATFORM_AUTHORITY_PUBLIC_KEY> --url devnet

# Check balance
solana balance <YOUR_PLATFORM_AUTHORITY_PUBLIC_KEY> --url devnet
```

You should see `2 SOL` (or whatever amount you requested).

### Step 3: Update Backend .env

Copy the generated secret key array and add it to your `.env`:

```env
PLATFORM_SECRET_KEY=[1,2,3,...,64]
```

Replace the numbers with your actual secret key.

### Step 4: Verify Configuration

Create a test script `backend/scripts/test-blockchain.js`:

```javascript
import dotenv from "dotenv";
dotenv.config();

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const testBlockchainConfig = async () => {
  console.log("Testing Blockchain Configuration...\n");
  
  // Check RPC URL
  console.log("1. RPC URL:", process.env.SOLANA_RPC_URL);
  const connection = new Connection(process.env.SOLANA_RPC_URL, "confirmed");
  
  try {
    const version = await connection.getVersion();
    console.log("   ✅ RPC Connection successful");
    console.log("   Solana Version:", version["solana-core"]);
  } catch (error) {
    console.log("   ❌ RPC Connection failed:", error.message);
    return;
  }
  
  // Check Program IDs
  console.log("\n2. Escrow Program ID:", process.env.ESCROW_PROGRAM_ID);
  try {
    const programId = new PublicKey(process.env.ESCROW_PROGRAM_ID);
    const programAccount = await connection.getAccountInfo(programId);
    if (programAccount) {
      console.log("   ✅ Program deployed and found on-chain");
    } else {
      console.log("   ⚠️  Program not found (may not be deployed yet)");
    }
  } catch (error) {
    console.log("   ❌ Invalid Program ID:", error.message);
  }
  
  // Check Platform Authority
  console.log("\n3. Platform Authority:");
  if (!process.env.PLATFORM_SECRET_KEY) {
    console.log("   ⚠️  PLATFORM_SECRET_KEY not set - using mock mode");
    return;
  }
  
  try {
    const secretKey = JSON.parse(process.env.PLATFORM_SECRET_KEY);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    console.log("   Public Key:", keypair.publicKey.toString());
    
    const balance = await connection.getBalance(keypair.publicKey);
    console.log("   Balance:", balance / LAMPORTS_PER_SOL, "SOL");
    
    if (balance === 0) {
      console.log("   ⚠️  No SOL balance! Request airdrop:");
      console.log(`   solana airdrop 2 ${keypair.publicKey.toString()} --url devnet`);
    } else {
      console.log("   ✅ Platform authority configured and funded");
    }
  } catch (error) {
    console.log("   ❌ Invalid PLATFORM_SECRET_KEY:", error.message);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("Configuration test complete!");
};

testBlockchainConfig();
```

Run it:
```bash
cd backend
node scripts/test-blockchain.js
```

---

## Frontend Environment Variables

Add to `/home/dhruv/C_drive/techno/Technova/frontend/.env`:

```env
# Solana Network (devnet or mainnet-beta)
VITE_SOLANA_NETWORK=devnet

# Existing Firebase variables (keep these)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Operating Modes

### Mock Mode (Default)
- **When:** `PLATFORM_SECRET_KEY` is not set
- **Behavior:** All blockchain functions return mock data
- **Use Case:** Development and testing without real blockchain
- **Cost:** Free

### Real Blockchain Mode
- **When:** `PLATFORM_SECRET_KEY` is set and valid
- **Behavior:** Real transactions on Solana blockchain
- **Use Case:** Production or testing with real blockchain
- **Cost:** ~0.000005 SOL per transaction (~$0.0005)

---

## Security Best Practices

### 🔒 DO:
- ✅ Store `PLATFORM_SECRET_KEY` in environment variables
- ✅ Use different keypairs for devnet and mainnet
- ✅ Rotate keys periodically
- ✅ Use hardware wallets for mainnet
- ✅ Backup your keypairs securely
- ✅ Monitor transaction logs

### ❌ DON'T:
- ❌ Commit `.env` files to git
- ❌ Share your secret key
- ❌ Use the same key for dev and production
- ❌ Store keys in code
- ❌ Use weak/predictable keys

---

## Troubleshooting

### Issue: "Platform keypair not loaded"
**Solution:** Check if `PLATFORM_SECRET_KEY` is set in `.env` and is a valid JSON array of 64 numbers.

### Issue: "Insufficient funds"
**Solution:** Fund your platform authority:
```bash
solana airdrop 2 <PLATFORM_AUTHORITY_PUBLIC_KEY> --url devnet
```

### Issue: "Program not found"
**Solution:** Verify `ESCROW_PROGRAM_ID` matches the deployed program address: `EisKdCuTXweGNbtaYbe1pAiCda2Xh2ouroVTcTyhFupA`

### Issue: "Transaction failed"
**Solution:** 
1. Check RPC URL is correct
2. Verify network (devnet vs mainnet)
3. Check Solana network status: https://status.solana.com
4. Review transaction logs on Explorer

---

## Quick Start Commands

```bash
# 1. Generate platform keypair
cd backend
node scripts/generate-platform-keypair.js

# 2. Fund platform authority (devnet)
solana airdrop 2 <PLATFORM_AUTHORITY_PUBLIC_KEY> --url devnet

# 3. Test configuration
node scripts/test-blockchain.js

# 4. Start backend
npm run dev

# 5. Start frontend (in another terminal)
cd ../frontend
npm run dev
```

---

## Environment Variable Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOLANA_RPC_URL` | Yes | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `ESCROW_PROGRAM_ID` | Yes | `EisKdCuTXweGNbtaYbe1pAiCda2Xh2ouroVTcTyhFupA` | Deployed escrow program |
| `TRADE_PROGRAM_ID` | No | Mock value | Trade recording program (future) |
| `PLATFORM_SECRET_KEY` | No | None (mock mode) | Platform authority keypair |
| `VITE_SOLANA_NETWORK` | Yes | `devnet` | Network for frontend |

---

## Next Steps

1. ✅ Add environment variables to `.env` files
2. ✅ Generate and fund platform authority
3. ✅ Test configuration
4. ✅ Restart backend server
5. ✅ Test escrow creation via API
6. ✅ View transactions on Solana Explorer

---

**Need Help?**
- Solana Docs: https://docs.solana.com
- Anchor Docs: https://www.anchor-lang.com
- Solana Explorer (Devnet): https://explorer.solana.com/?cluster=devnet

---

**Built for Technova - Transparent Trading Platform** 🚀

