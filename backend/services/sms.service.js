import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Only initialize Twilio if credentials are valid
if (accountSid && authToken && accountSid.startsWith("AC") && authToken.length > 10) {
  try {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio SMS service initialized");
  } catch (error) {
    console.warn("⚠️  Twilio initialization failed. SMS features will use mock mode.");
  }
} else {
  console.warn("⚠️  Twilio credentials not configured. SMS features will use mock mode.");
}

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS
export const sendOTP = async (phoneNumber, otp) => {
  if (!client) {
    console.log(`[MOCK SMS] OTP for ${phoneNumber}: ${otp}`);
    return { success: true, mock: true, otp };
  }

  try {
    const message = await client.messages.create({
      body: `Your Technova verification code is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`SMS sent successfully. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

export const storeOTP = (phoneNumber, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(phoneNumber, { otp, expiresAt });
  
  // Auto-cleanup after expiration
  setTimeout(() => {
    otpStore.delete(phoneNumber);
  }, 10 * 60 * 1000);
};

export const verifyOTP = (phoneNumber, otp) => {
  const stored = otpStore.get(phoneNumber);
  
  if (!stored) {
    return { valid: false, message: "OTP not found or expired" };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phoneNumber);
    return { valid: false, message: "OTP expired" };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }
  
  otpStore.delete(phoneNumber);
  return { valid: true, message: "OTP verified successfully" };
};

// Send SMS notification for important events
export const sendNotification = async (phoneNumber, message) => {
  if (!client) {
    console.log(`[MOCK SMS] Notification to ${phoneNumber}: ${message}`);
    return { success: true, mock: true };
  }

  try {
    const sms = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`Notification sent successfully. SID: ${sms.sid}`);
    return { success: true, sid: sms.sid };
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

export default {
  generateOTP,
  sendOTP,
  storeOTP,
  verifyOTP,
  sendNotification,
};
