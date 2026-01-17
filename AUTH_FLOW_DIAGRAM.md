# Technova Authentication Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LANDING PAGE (/)                             │
│                                                                       │
│                    [Sign Up]    [Login]                              │
└───────────────────────┬──────────────┬──────────────────────────────┘
                        │              │
                        ▼              ▼
        ┌───────────────────┐  ┌──────────────────┐
        │   SIGNUP PAGE     │  │   LOGIN PAGE     │
        │   /signup         │  │   /login         │
        └────────┬──────────┘  └────────┬─────────┘
                 │                       │
                 │                       │
    ┌────────────┴────────────┐         │
    │                         │         │
    ▼                         ▼         ▼
┌─────────┐            ┌──────────┐  ┌──────────────────┐
│ Select  │            │ Select   │  │ Enter Email &    │
│ INVESTOR│            │ ADVISOR  │  │ Password         │
└────┬────┘            └────┬─────┘  └────────┬─────────┘
     │                      │                  │
     │                      │                  │
     ▼                      ▼                  ▼
┌─────────────┐      ┌──────────────┐   ┌──────────────┐
│ Enter:      │      │ Enter:       │   │ Check User   │
│ - Name      │      │ - Name       │   │ Exists?      │
│ - Email     │      │ - Email      │   └──────┬───────┘
│ - Password  │      │ - Password   │          │
└──────┬──────┘      │ - SEBI No.   │    ┌─────┴─────┐
       │             │ - Phone (opt)│    │           │
       │             └──────┬───────┘    │           │
       │                    │            NO          YES
       │                    │            │           │
       ▼                    ▼            ▼           ▼
┌──────────────┐     ┌──────────────┐  Error    ┌────────────┐
│ Check Email  │     │ Check Email  │  "Sign up │ Validate   │
│ Exists?      │     │ Exists?      │  first"   │ Password   │
└──────┬───────┘     └──────┬───────┘           └──────┬─────┘
       │                    │                           │
  ┌────┴────┐          ┌────┴────┐                ┌────┴────┐
  │         │          │         │                │         │
 YES       NO         YES       NO              VALID    INVALID
  │         │          │         │                │         │
  ▼         ▼          ▼         ▼                ▼         ▼
Error    Create    Error     Create           Login      Error
"Login   Account  "Login    Account          Success   "Invalid
instead"   │      instead"    │                │       Password"
           │                  │                │
           ▼                  ▼                │
    ┌──────────────┐   ┌──────────────┐       │
    │   INVESTOR   │   │   ADVISOR    │       │
    │  DASHBOARD   │   │  ONBOARDING  │       │
    │              │   │              │       │
    │ /investor/   │   │ /advisor/    │       │
    │  dashboard   │   │  onboarding  │       │
    └──────────────┘   └──────┬───────┘       │
                               │               │
                               ▼               │
                        ┌──────────────┐       │
                        │ Upload SEBI  │       │
                        │ Certificate  │       │
                        └──────┬───────┘       │
                               │               │
                               ▼               │
                        ┌──────────────┐       │
                        │ Submit for   │       │
                        │ Admin Review │       │
                        └──────┬───────┘       │
                               │               │
                               ▼               │
                        ┌──────────────┐       │
                        │ Wait for     │       │
                        │ Approval     │       │
                        └──────┬───────┘       │
                               │               │
                        Admin Approves         │
                               │               │
                               ▼               │
                        ┌──────────────┐       │
                        │   ADVISOR    │       │
                        │  DASHBOARD   │       │
                        │              │       │
                        │ /advisor/    │       │
                        │  dashboard   │       │
                        └──────────────┘       │
                                               │
                        ┌──────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │ Redirect Based│
                │ on Role:      │
                │               │
                │ • Investor →  │
                │   Dashboard   │
                │               │
                │ • Advisor     │
                │   (unverified)│
                │   → Onboarding│
                │               │
                │ • Advisor     │
                │   (verified)  │
                │   → Dashboard │
                └───────────────┘
```

---

## Google OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIGNUP/LOGIN PAGE                                 │
│                                                                       │
│              [Sign in/up with Google]                                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Google OAuth     │
                  │ Popup            │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Check if User    │
                  │ Exists in DB     │
                  └────────┬─────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                   YES           NO
                    │             │
                    ▼             ▼
            ┌──────────────┐  ┌──────────────┐
            │ Existing     │  │ New User     │
            │ User Login   │  │ Redirect to  │
            │              │  │ /role-       │
            │ Redirect     │  │ selection    │
            │ to Dashboard │  └──────┬───────┘
            └──────────────┘         │
                                     ▼
                            ┌──────────────────┐
                            │ Select Role:     │
                            │ • Investor       │
                            │ • Advisor        │
                            └────────┬─────────┘
                                     │
                              ┌──────┴──────┐
                              │             │
                          INVESTOR      ADVISOR
                              │             │
                              ▼             ▼
                      ┌──────────────┐  ┌──────────────┐
                      │ Create       │  │ Create       │
                      │ Investor     │  │ Advisor      │
                      │ Account      │  │ Account      │
                      └──────┬───────┘  └──────┬───────┘
                             │                 │
                             ▼                 ▼
                      ┌──────────────┐  ┌──────────────┐
                      │ INVESTOR     │  │ ADVISOR      │
                      │ DASHBOARD    │  │ ONBOARDING   │
                      └──────────────┘  └──────────────┘
```

---

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MAIN.JSX                                     │
│                                                                       │
│                    <BrowserRouter>                                   │
│                      <AuthProvider>                                  │
│                        <App />                                       │
│                      </AuthProvider>                                 │
│                    </BrowserRouter>                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   AUTHCONTEXT.JSX     │
                    │                       │
                    │  State:               │
                    │  • userData           │
                    │  • loading            │
                    │                       │
                    │  Functions:           │
                    │  • login()            │
                    │  • signup()           │
                    │  • googleSignIn()     │
                    │  • logout()           │
                    │  • checkUserExists()  │
                    │  • refreshUser()      │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌───────────────────┐
        │  ALL COMPONENTS   │   │   ALL PAGES       │
        │                   │   │                   │
        │  • Login.jsx      │   │  • Home.jsx       │
        │  • SignUp.jsx     │   │  • RoleSelection  │
        │  • Navbar.jsx     │   │  • AdvisorDash    │
        │  • Sidebar.jsx    │   │  • InvestorDash   │
        │  • etc...         │   │  • etc...         │
        │                   │   │                   │
        │  Use: useAuth()   │   │  Use: useAuth()   │
        └───────────────────┘   └───────────────────┘
```

---

## API Communication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                      │
│                                                                       │
│  Component → useAuth() → AuthContext → axios → Backend API          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ HTTP Request
                                │ (with credentials: true)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND                                       │
│                                                                       │
│  Express Routes → Controllers → Models → MongoDB                    │
│                                                                       │
│  /api/auth/signup    → SignUp()    → User.create()                  │
│  /api/auth/login     → Login()     → User.findOne()                 │
│  /api/auth/google    → googleAuth() → User.findOne/create()         │
│  /api/auth/logout    → logout()    → res.clearCookie()              │
│  /api/user/current   → getCurrent() → User.findById()               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ HTTP Response
                                │ (with JWT cookie)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                      │
│                                                                       │
│  Response → setUserData() → Re-render Components                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER SUBMITS CREDENTIALS                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Frontend Validation   │
                    │ • Required fields     │
                    │ • Email format        │
                    │ • Password length     │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Backend Validation    │
                    │ • User exists check   │
                    │ • Input sanitization  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Password Hashing      │
                    │ • bcrypt (10 rounds)  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ JWT Token Generation  │
                    │ • User ID payload     │
                    │ • 7-day expiry        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Set HttpOnly Cookie   │
                    │ • Secure flag         │
                    │ • SameSite: strict    │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Return User Data      │
                    │ (without password)    │
                    └───────────────────────┘
```

---

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER REQUESTS PROTECTED ROUTE                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Check if userData     │
                    │ exists in Context     │
                    └───────────┬───────────┘
                                │
                         ┌──────┴──────┐
                         │             │
                        YES           NO
                         │             │
                         ▼             ▼
              ┌───────────────┐  ┌──────────────┐
              │ Check Role    │  │ Redirect to  │
              │ Matches Route │  │ /login       │
              └───────┬───────┘  └──────────────┘
                      │
               ┌──────┴──────┐
               │             │
             MATCH        NO MATCH
               │             │
               ▼             ▼
        ┌──────────┐   ┌──────────┐
        │ Allow    │   │ Redirect │
        │ Access   │   │ to /     │
        └──────────┘   └──────────┘

Route Protection Examples:
• /investor/dashboard → Requires role: "investor"
• /advisor/dashboard  → Requires role: "advisor" + isVerified: true
• /advisor/onboarding → Requires role: "advisor"
• /admin/panel        → Requires role: "admin"
```

---

## Data Flow Summary

```
┌──────────────┐
│   Browser    │
│   Storage    │
│              │
│ • JWT Cookie │ ←──────────────┐
└──────┬───────┘                │
       │                        │
       │ Sent with              │ Set by
       │ every request          │ backend
       │                        │
       ▼                        │
┌──────────────┐         ┌──────────────┐
│   Frontend   │ ←──────→│   Backend    │
│              │  HTTP   │              │
│ • React      │ Request │ • Express    │
│ • Context    │ ←──────→│ • MongoDB    │
│ • Components │Response │ • JWT        │
└──────────────┘         └──────────────┘
       │                        │
       │ Updates                │ Queries
       │ UI State               │ Database
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│   User       │         │   MongoDB    │
│   Interface  │         │   Database   │
│              │         │              │
│ • Dashboard  │         │ • Users      │
│ • Forms      │         │ • Trades     │
│ • Modals     │         │ • Signals    │
└──────────────┘         └──────────────┘
```

---

**Note**: This diagram represents the simplified authentication flow after removing 2FA/OTP and confirming React Context usage (no Redux).

**Last Updated**: January 17, 2026

