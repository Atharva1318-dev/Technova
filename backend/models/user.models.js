import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { Schema, model } from "mongoose";
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    isGoogleAuth: { type: Boolean, default: false },
    role:{
      type:String,
      enum:["advisor","investor","admin"],
      default:"investor"
    },
    phone:{
      type:String
    },
    // Advisor-specific fields
    profilePicture: { type: String }, // Cloudinary URL
    bio: { type: String, maxlength: 500 },
    sebiCertificate: { type: String }, // Cloudinary URL
    sebiRegistrationNumber: { type: String },
    isVerified: { type: Boolean, default: false }, // Admin verification status
    verificationStatus: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },
    solanaWallet: { type: String }, // Solana PDA address
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    // Analytics
    subscriberCount: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }, // Percentage
    totalProfit: { type: Number, default: 0 },
    totalLoss: { type: Number, default: 0 },
    // Investor-specific fields
    followedAdvisors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    paperTradingBalance: { type: Number, default: 100000 }, // Virtual balance
  },
  { timestamps: true }
);

const User = model("User", userSchema);
export default User;