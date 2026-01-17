import Subscription from "../models/subscription.models.js";
import User from "../models/user.models.js";
import Chat from "../models/chat.models.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { jsPDF } from "jspdf";
import twilio from "twilio";
import fs from "fs";
import path from "path";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Pricing structure
const PRICING = {
  "1-month": 2999,
  "3-month": 7999,
  "6-month": 14999,
  "1-year": 27999,
};

const getDurationInDays = (duration) => {
  const days = {
    "1-month": 30,
    "3-month": 90,
    "6-month": 180,
    "1-year": 365,
  };
  return days[duration];
};

/**
 * Create Razorpay Order
 */
export const createOrder = async (req, res) => {
  try {
    const investorId = req.userId;
    const { advisorId, duration } = req.body;

    if (!advisorId || !duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!PRICING[duration]) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    const advisor = await User.findById(advisorId);
    if (!advisor || advisor.role !== "advisor") {
      return res.status(404).json({ message: "Advisor not found" });
    }

    const amount = PRICING[duration];

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      description: `Subscription to ${advisor.name} for ${duration}`,
    };

    const order = await razorpay.orders.create(options);

    // Create subscription in pending status
    const subscription = await Subscription.create({
      investorId,
      advisorId,
      amount,
      duration,
      razorpayOrderId: order.id,
      status: "pending",
      transactionId: order.id,
    });

    return res.status(200).json({
      success: true,
      order: order,
      subscription: subscription,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Failed to create order" });
  }
};

/**
 * Verify Payment & Create Bill
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      subscriptionId,
    } = req.body;

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update subscription
    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        razorpayPaymentId,
        razorpaySignature,
        status: "active",
        startDate: new Date(),
        endDate: new Date(
          Date.now() + getDurationInDays(subscription.duration) * 24 * 60 * 60 * 1000
        ),
      },
      { new: true }
    );

    // Get investor and advisor details
    const investor = await User.findById(subscription.investorId);
    const advisor = await User.findById(subscription.advisorId);

    // Create bill using jsPDF
    const bill = generateBill(investor, advisor, subscription);
    const billPath = await saveBill(bill, subscription._id);

    subscription.billGenerated = true;
    subscription.billUrl = billPath;
    await subscription.save();

    // Create chat room
    await Chat.create({
      subscriptionId: subscription._id,
      investorId: subscription.investorId,
      advisorId: subscription.advisorId,
      messages: [],
    });

    // Send SMS confirmation via Twilio
    await sendSMSConfirmation(investor.phone, advisor.name, subscription.duration);

    subscription.smsConfirmationSent = true;
    await subscription.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription,
      billUrl: billPath,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Failed to verify payment" });
  }
};

/**
 * Generate Bill using jsPDF
 */
const generateBill = (investor, advisor, subscription) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("SUBSCRIPTION RECEIPT", 20, 20);

  // Bill details
  doc.setFontSize(12);
  let yPosition = 40;

  doc.text(`Bill Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 10;
  doc.text(`Transaction ID: ${subscription.razorpayPaymentId}`, 20, yPosition);
  yPosition += 15;

  // Investor details
  doc.setFontSize(14);
  doc.text("BILL TO:", 20, yPosition);
  yPosition += 8;
  doc.setFontSize(11);
  doc.text(`Name: ${investor.name}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Email: ${investor.email}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Phone: ${investor.phone}`, 20, yPosition);
  yPosition += 15;

  // Advisor details
  doc.setFontSize(14);
  doc.text("ADVISOR:", 20, yPosition);
  yPosition += 8;
  doc.setFontSize(11);
  doc.text(`Name: ${advisor.name}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Expertise: ${advisor.expertise || "N/A"}`, 20, yPosition);
  yPosition += 15;

  // Subscription details
  doc.setFontSize(14);
  doc.text("SUBSCRIPTION DETAILS:", 20, yPosition);
  yPosition += 8;
  doc.setFontSize(11);
  doc.text(`Duration: ${subscription.duration}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Amount: ₹${subscription.amount}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Start Date: ${subscription.startDate.toLocaleDateString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`End Date: ${subscription.endDate.toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;

  // Total amount
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`TOTAL AMOUNT: ₹${subscription.amount}`, 20, yPosition);

  // Footer
  doc.setFontSize(9);
  doc.text("Thank you for your subscription!", 20, 270);
  doc.text("This is a digitally generated receipt.", 20, 280);

  return doc;
};

/**
 * Save Bill to File
 */
const saveBill = async (doc, subscriptionId) => {
  const billDir = path.join(process.cwd(), "bills");

  // Create directory if not exists
  if (!fs.existsSync(billDir)) {
    fs.mkdirSync(billDir, { recursive: true });
  }

  const billPath = path.join(billDir, `bill_${subscriptionId}.pdf`);
  doc.save(billPath);

  return `/bills/bill_${subscriptionId}.pdf`;
};

/**
 * Send SMS Confirmation via Twilio
 */
const sendSMSConfirmation = async (phone, advisorName, duration) => {
  try {
    await twilioClient.messages.create({
      body: `Your subscription to ${advisorName} for ${duration} is confirmed! You can now chat directly. Thank you for choosing us!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
};

/**
 * Get Active Subscriptions for Investor
 */
export const getMySubscriptions = async (req, res) => {
  try {
    const investorId = req.userId;

    const subscriptions = await Subscription.find({
      investorId,
      status: "active",
    })
      .populate("advisorId", "name expertise phone email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
};

/**
 * Get Advisor Subscribers
 */
export const getAdvisorSubscribers = async (req, res) => {
  try {
    const advisorId = req.userId;

    const subscriptions = await Subscription.find({
      advisorId,
      status: "active",
    })
      .populate("investorId", "name email phone profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return res.status(500).json({ message: "Failed to fetch subscribers" });
  }
};

/**
 * Cancel Subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status: "cancelled" },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled",
      subscription,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({ message: "Failed to cancel subscription" });
  }
};

export default {
  createOrder,
  verifyPayment,
  getMySubscriptions,
  getAdvisorSubscribers,
  cancelSubscription,
};