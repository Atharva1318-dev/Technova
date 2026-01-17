import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    advisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    duration: {
      type: String, // "1-month", "3-month", "6-month", "1-year"
      enum: ["1-month", "3-month", "6-month", "1-year"],
      required: true,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ["pending", "active", "cancelled", "expired"],
      default: "pending",
    },
    startDate: Date,
    endDate: Date,
    billGenerated: {
      type: Boolean,
      default: false,
    },
    billUrl: String,
    smsConfirmationSent: {
      type: Boolean,
      default: false,
    },
    transactionId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);