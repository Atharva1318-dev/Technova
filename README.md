# Technova - Blockchain-Verified Trading Signals Platform

A transparent trading signals platform connecting SEBI-registered advisors with investors through blockchain-verified trades.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Firebase account (for Google OAuth)
- Cloudinary account (for file uploads)

### Installation

```bash
# Clone the repository
cd Technova

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

1. **Backend `.env`** (in `/backend/.env`):
```env
PORT=8901
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. **Frontend `.env`** (in `/frontend/.env`):
```env
VITE_SOLANA_NETWORK=devnet
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### Running the Application

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

- Backend: http://localhost:8901
- Frontend: http://localhost:5173

## 📋 Features

### ✅ Completed
- **Authentication:** Google OAuth + Email/Password
- **Role-Based Access:** Advisor, Investor, Admin
- **Advisor Onboarding:** SEBI certificate upload, SMS 2FA
- **Advisor Dashboard:** Signal creation, trade management, analytics
- **Real-time Updates:** Socket.io for live signals
- **Blockchain Integration:** Solana wallet generation
- **Trust Score Algorithm:** Automated advisor rating
- **File Uploads:** Cloudinary integration

### 🚧 In Progress
- Investor Dashboard (Discovery feed, paper trading)
- Admin Panel (Verification queue, system health)

## 🏗️ Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- Socket.io
- Solana Web3.js
- Twilio (SMS)
- Cloudinary
- JWT Authentication

### Frontend
- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Socket.io Client
- Firebase Auth

## 📁 Project Structure

```
Technova/
├── backend/
│   ├── models/          # Database schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── services/        # External services
│   ├── middleware/      # Auth, validation
│   └── cron/            # Scheduled tasks
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Route pages
│   │   ├── utils/       # Utilities
│   │   ├── hooks/       # Custom hooks
│   │   └── redux/       # State management
│   └── public/
└── docs/
    ├── IMPLEMENTATION_GUIDE.md
    ├── PROJECT_SUMMARY.md
    └── CURRENT_STATUS.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/signup` - Email signup
- `POST /api/auth/login` - Email login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout

### Advisor
- `POST /api/advisor/onboarding` - Submit application
- `POST /api/advisor/send-otp` - Send SMS OTP
- `POST /api/advisor/verify-otp` - Verify OTP
- `PUT /api/advisor/profile` - Update profile
- `GET /api/advisor/dashboard/stats` - Get stats

### Trade
- `POST /api/trade/signal` - Create signal
- `GET /api/trade/advisor/trades` - Get advisor trades
- `PUT /api/trade/:id` - Update trade
- `POST /api/trade/:id/close` - Close trade
- `GET /api/trade/signals` - Get all signals

### Investor
- `POST /api/investor/paper-trade/follow` - Follow signal
- `GET /api/investor/paper-trades` - Get paper trades
- `GET /api/investor/portfolio/summary` - Portfolio stats

### Admin
- `GET /api/admin/verifications/pending` - Pending advisors
- `POST /api/admin/advisor/:id/approve` - Approve advisor
- `POST /api/admin/advisor/:id/reject` - Reject advisor
- `GET /api/admin/health` - System health

### Blockchain
- `GET /api/blockchain/advisor/:id/trades` - On-chain trades
- `GET /api/blockchain/trade/:id/verify` - Verify trade
- `GET /api/blockchain/advisor/:id/compare` - Compare data

## 🧪 Testing

### Test Advisor Flow
1. Signup/Login as advisor
2. Complete onboarding
3. Create signals
4. Manage active trades

### Test Investor Flow (Coming Soon)
1. Signup/Login as investor
2. Browse signals
3. Follow advisors
4. Paper trade

## 📖 Documentation

- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Detailed technical guide
- [Project Summary](./PROJECT_SUMMARY.md) - Complete overview
- [Current Status](./CURRENT_STATUS.md) - Latest progress

## 🤝 Contributing

This is a hackathon project. For production use:
1. Add comprehensive testing
2. Implement rate limiting
3. Add input sanitization
4. Deploy Solana program
5. Set up monitoring

## 📄 License

MIT License - Built for Technova Hackathon 2026

## 👥 Team

Built with ❤️ for Technova Hackathon

---

**Status:** 90% Complete | **Demo Ready:** Yes (Advisor Flow)
