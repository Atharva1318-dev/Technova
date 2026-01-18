# 🔐 Environment Variables - Quick Reference

## Backend `.env` (Required)

```env
# ============================================================================
# BLOCKCHAIN CONFIGURATION (NEW)
# ============================================================================

# Solana RPC URL - Devnet for testing
SOLANA_RPC_URL=https://api.devnet.solana.com

# Deployed Escrow Program Address
ESCROW_PROGRAM_ID=EisKdCuTXweGNbtaYbe1pAiCda2Xh2ouroVTcTyhFupA

# Trade Recording Program (Future - use placeholder for now)
TRADE_PROGRAM_ID=TradeProgram111111111111111111111111111111

# Platform Authority Secret Key (OPTIONAL - enables real blockchain)
# Generate using: node backend/scripts/generate-platform-keypair.js
# Leave empty/commented for mock mode (recommended for development)
# PLATFORM_SECRET_KEY=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]

# ============================================================================
# EXISTING CONFIGURATION (Keep these)
# ============================================================================

PORT=8901
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Cloudinary (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Twilio (Optional - for SMS 2FA)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Supabase (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

---

## Frontend `.env` (Required)

```env
# ============================================================================
# BLOCKCHAIN CONFIGURATION (NEW)
# ============================================================================

# Solana Network
VITE_SOLANA_NETWORK=devnet

# ============================================================================
# EXISTING CONFIGURATION (Keep these)
# ============================================================================

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 🚀 Quick Start

### Option 1: Mock Mode (Recommended for Development)

**No additional setup required!** Just add the blockchain variables above (without `PLATFORM_SECRET_KEY`) and start the server.

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

**What you get:**
- ✅ All blockchain features work
- ✅ Mock transaction IDs
- ✅ No real blockchain writes
- ✅ Perfect for development

---

### Option 2: Real Blockchain Mode

**For testing with actual Solana blockchain:**

1. **Generate Platform Keypair**
   ```bash
   cd backend
   node scripts/generate-platform-keypair.js
   ```

2. **Copy the secret key array and add to `.env`**
   ```env
   PLATFORM_SECRET_KEY=[your,generated,array,of,64,numbers]
   ```

3. **Fund the Platform Authority (Devnet)**
   ```bash
   solana airdrop 2 <PLATFORM_AUTHORITY_PUBLIC_KEY> --url devnet
   ```

4. **Test Configuration**
   ```bash
   node scripts/test-blockchain.js
   ```

5. **Start Server**
   ```bash
   npm run dev
   ```

**What you get:**
- ✅ Real Solana transactions
- ✅ Visible on Solana Explorer
- ✅ Actual blockchain writes
- ✅ Production-ready

---

## 📋 Variable Descriptions

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOLANA_RPC_URL` | Yes | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `ESCROW_PROGRAM_ID` | Yes | Deployed address | Escrow smart contract |
| `TRADE_PROGRAM_ID` | No | Placeholder | Trade recording (future) |
| `PLATFORM_SECRET_KEY` | No | None (mock) | Platform authority keypair |
| `VITE_SOLANA_NETWORK` | Yes | `devnet` | Network for frontend |

---

## ✅ Verification

Test your configuration:

```bash
cd backend
node scripts/test-blockchain.js
```

Expected output:
```
✅ ALL CHECKS PASSED - Blockchain integration ready!
```

---

## 🔒 Security Notes

- ⚠️ **NEVER** commit `.env` files to git
- ⚠️ **NEVER** share your `PLATFORM_SECRET_KEY`
- ✅ Use different keys for dev and production
- ✅ Keep `.env` in `.gitignore`
- ✅ Backup your keys securely

---

## 📚 Full Documentation

- **Setup Guide:** `BLOCKCHAIN_ENV_SETUP.md`
- **Integration Guide:** `BLOCKCHAIN_INTEGRATION_GUIDE.md`
- **Complete Summary:** `BLOCKCHAIN_COMPLETE_SUMMARY.md`

---

**Need Help?** Run the test script or check the documentation!

