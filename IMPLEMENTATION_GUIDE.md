# Technova Trading Platform - Implementation Guide

## 🎯 Project Overview

Technova is a blockchain-verified trading signals platform connecting SEBI-registered advisors with investors through transparent, real-time trading signals.

## ✅ Completed Backend Implementation

### 1. Database Models
- ✅ **User Model** - Extended with advisor/investor fields, trust scores, Solana wallet
- ✅ **Trade Model** - Complete trade lifecycle management
- ✅ **Signal Model** - Public trading signals with engagement metrics
- ✅ **TrustScore Model** - Comprehensive advisor scoring system
- ✅ **AdminAction Model** - Audit logs for admin actions
- ✅ **PaperTrade Model** - Virtual portfolio for investors

### 2. Services
- ✅ **Supabase Service** - Hot storage for active/pending trades with real-time subscriptions
- ✅ **Solana Service** - Wallet generation, blockchain writing, trade verification
- ✅ **SMS Service** - Twilio integration for 2FA OTP
- ✅ **Socket.io Service** - Real-time updates for signals, trades, trust scores
- ✅ **Market Data Service** - Live price fetching, symbol parsing, market status
- ✅ **Trust Score Service** - Algorithm for calculating advisor reputation

### 3. Controllers
- ✅ **Auth Controller** - Login, signup, Google OAuth with role selection
- ✅ **Advisor Controller** - Onboarding, profile management, stats
- ✅ **Trade Controller** - Signal creation, trade management, closing
- ✅ **Investor Controller** - Paper trading, portfolio management, following advisors
- ✅ **Admin Controller** - Verification queue, dispute resolution, system health
- ✅ **Blockchain Controller** - On-chain verification, data comparison

### 4. Middleware
- ✅ **Auth Middleware** - JWT verification
- ✅ **Role Check Middleware** - Role-based access control
- ✅ **Upload Middleware** - Cloudinary integration for file uploads

### 5. Cron Jobs
- ✅ **Trust Score Cron** - Daily calculation at 4:00 PM IST

### 6. API Routes
```
/api/auth       - Authentication endpoints
/api/user       - User profile endpoints
/api/advisor    - Advisor-specific endpoints
/api/trade      - Trade and signal management
/api/investor   - Investor paper trading
/api/admin      - Admin panel endpoints
/api/blockchain - Blockchain verification
```

## 🚀 Running the Backend

```bash
cd backend
npm install
npm run dev
```

### Environment Variables Required

Create a `.env` file with:
```env
PORT=8901
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Supabase (Optional - for real-time features)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com

# Twilio (Optional - SMS will use mock mode without these)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📱 Frontend Implementation Status

### Completed
- ✅ Socket.io utility and hooks
- ✅ Solana utility and hooks
- ✅ Role Selection page
- ✅ Advisor Onboarding page

### Remaining Frontend Components

#### 1. Advisor Dashboard (`/frontend/src/pages/AdvisorDashboard.jsx`)
**Features to implement:**
- Dashboard stats cards (subscribers, trades, win rate, trust score)
- Signal creation form with smart search
- Active trades table with modify/close actions
- Real-time updates via Socket.io

**Key Components:**
- `SignalCreator.jsx` - Form for creating new signals
- `ActiveTrades.jsx` - Table of active trades
- `ProfileEditor.jsx` - Profile picture and bio editor
- `StatsCards.jsx` - Dashboard metrics

#### 2. Investor Dashboard (`/frontend/src/pages/InvestorDashboard.jsx`)
**Features to implement:**
- Discovery feed (Twitter-style signal stream)
- Advanced filtering (risk level, asset class, win rate)
- Advisor comparison tool (side-by-side)
- Paper trading portfolio with P&L tracker
- Blockchain verification modal

**Key Components:**
- `DiscoveryFeed.jsx` - Signal stream with real-time updates
- `AdvisorCard.jsx` - Advisor profile card with stats
- `ComparisonTool.jsx` - Compare up to 3 advisors
- `PaperTrading.jsx` - Virtual portfolio dashboard
- `BlockchainVerification.jsx` - Verify on-chain modal

#### 3. Admin Panel (`/frontend/src/pages/AdminPanel.jsx`)
**Features to implement:**
- Verification queue with SEBI doc viewer
- Approve/reject advisor applications
- Dispute resolution interface
- System health monitoring
- Admin action logs

**Key Components:**
- `VerificationQueue.jsx` - Pending advisor applications
- `DisputeResolution.jsx` - Trade correction interface
- `SystemHealth.jsx` - Metrics and monitoring

#### 4. Update App.jsx Routing
```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/signup" element={<SignUp />} />
  <Route path="/login" element={<Login />} />
  <Route path="/role-selection" element={<RoleSelection />} />
  <Route path="/advisor/onboarding" element={<AdvisorOnboarding />} />
  <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />
  <Route path="/investor/dashboard" element={<InvestorDashboard />} />
  <Route path="/admin/panel" element={<AdminPanel />} />
</Routes>
```

## 🔧 Frontend Development Guide

### 1. API Integration Pattern
```javascript
import axios from "axios";
import { useContext } from "react";
import { AuthDataContext } from "../context/AuthDataContext";

const { serverUrl } = useContext(AuthDataContext);

// Example API call
const fetchData = async () => {
  try {
    const response = await axios.get(
      `${serverUrl}/api/endpoint`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || "Error");
  }
};
```

### 2. Socket.io Integration Pattern
```javascript
import { useEffect } from "react";
import { 
  initializeSocket, 
  joinSignalsFeed, 
  onNewSignal 
} from "../utils/socket";

useEffect(() => {
  const socket = initializeSocket();
  joinSignalsFeed();

  const handleNewSignal = (signal) => {
    console.log("New signal:", signal);
    // Update state
  };

  onNewSignal(handleNewSignal);

  return () => {
    socket.off("new-signal", handleNewSignal);
  };
}, []);
```

### 3. Recharts Integration for Analytics
```javascript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#000" />
  </LineChart>
</ResponsiveContainer>
```

## 🧪 Testing Checklist

### Backend Testing
- [ ] Test all API endpoints with Postman/Thunder Client
- [ ] Verify JWT authentication works
- [ ] Test role-based access control
- [ ] Test file uploads to Cloudinary
- [ ] Verify Socket.io connections
- [ ] Test trade lifecycle (create → modify → close)
- [ ] Test paper trading calculations
- [ ] Verify trust score algorithm
- [ ] Test admin approval workflow

### Frontend Testing
- [ ] Test role selection flow
- [ ] Test advisor onboarding with file upload
- [ ] Test signal creation and real-time updates
- [ ] Test paper trading follow/close
- [ ] Test blockchain verification modal
- [ ] Test responsive design on mobile/tablet
- [ ] Test Socket.io real-time updates
- [ ] Browser testing (Chrome, Firefox)

## 📊 Database Setup

### MongoDB Collections
- `users` - User accounts
- `trades` - Historical trades
- `signals` - Trading signals
- `paperTrades` - Investor virtual trades
- `trustScores` - Advisor scores
- `adminActions` - Audit logs

### Supabase Tables (Optional)
Create these tables in Supabase for real-time features:

**active_trades**
```sql
CREATE TABLE active_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id TEXT NOT NULL,
  advisor_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  order_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  target NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**pending_trades**
```sql
CREATE TABLE pending_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id TEXT NOT NULL,
  advisor_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  order_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  target NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 UI/UX Guidelines

### Design System
- **Primary Color**: Black (#000000)
- **Background**: White (#FFFFFF) and Gray shades
- **Accent**: Use for success/error states
- **Typography**: System fonts, clean and modern
- **Spacing**: Consistent 4px grid system
- **Borders**: Subtle gray borders, rounded corners

### Component Patterns
- Use Tailwind CSS utility classes
- Consistent button styles (black bg, white text)
- Card-based layouts with subtle shadows
- Responsive grid layouts
- Loading states for async operations
- Toast notifications for user feedback

## 🔐 Security Considerations

1. **JWT Tokens**: Stored in httpOnly cookies
2. **File Uploads**: Validated size and type
3. **Role-Based Access**: Middleware checks on all protected routes
4. **Input Validation**: Server-side validation for all inputs
5. **Rate Limiting**: Consider adding for production
6. **CORS**: Configured for frontend origin

## 📈 Next Steps

1. **Complete Frontend Components**
   - Advisor Dashboard
   - Investor Dashboard
   - Admin Panel

2. **Implement Real-time Features**
   - Socket.io event handlers
   - Live price updates
   - Real-time signal feed

3. **Add Blockchain Integration**
   - Solana program deployment (Rust)
   - Write trades to blockchain
   - Verification UI

4. **Testing & Deployment**
   - Unit tests
   - Integration tests
   - Deploy to production

## 🆘 Troubleshooting

### Common Issues

**Socket.io not connecting:**
- Check CORS configuration
- Verify server is running
- Check browser console for errors

**File upload failing:**
- Verify Cloudinary credentials
- Check file size limits
- Ensure correct Content-Type header

**JWT authentication failing:**
- Check cookie settings
- Verify JWT_SECRET matches
- Ensure withCredentials: true in axios

**Supabase errors:**
- Verify credentials in .env
- Check table schemas match
- Enable RLS policies if needed

## 📚 Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudinary API](https://cloudinary.com/documentation)

## 🤝 Contributing

This is a hackathon project. For production use:
1. Add comprehensive error handling
2. Implement rate limiting
3. Add input sanitization
4. Deploy Solana program
5. Add monitoring and logging
6. Implement backup strategies

---

**Built with ❤️ for Technova Hackathon**
