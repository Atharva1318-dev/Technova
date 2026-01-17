
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

let client = null;

if (accountSid && authToken && accountSid.startsWith("AC") && authToken.length > 10) {
  try {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio WhatsApp service initialized");
  } catch (error) {
    console.warn("⚠️ Twilio initialization failed. Running in mock mode.");
  }
} else {
  console.warn("⚠️ Twilio credentials not configured. Running in mock mode.");
}

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const normalizePhone = (phone) => {
  if (!phone) return phone;
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
};

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

export const storeOTP = (phoneNumber, otp) => {
  const normalized = normalizePhone(phoneNumber);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(normalized, { otp, expiresAt });
  setTimeout(() => otpStore.delete(normalized), 10 * 60 * 1000);
};

export const verifyOTP = (phoneNumber, otp) => {
  const normalized = normalizePhone(phoneNumber);
  const stored = otpStore.get(normalized);
  if (!stored) return { valid: false, message: "OTP not found or expired" };
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalized);
    return { valid: false, message: "OTP expired" };
  }
  if (stored.otp !== otp) return { valid: false, message: "Invalid OTP" };
  otpStore.delete(normalized);
  return { valid: true, message: "OTP verified successfully" };
};

// Send OTP via WhatsApp (uses sandbox sender)
export const sendOTP = async (phoneNumber, otp) => {
  const normalized = normalizePhone(phoneNumber);
  const to = `whatsapp:${normalized}`;
  const from = twilioWhatsAppNumber;

  if (!client) {
    console.log(`[MOCK WHATSAPP] OTP for ${to}: ${otp}`);
    return { success: true, mock: true, otp };
  }
  console.log(otp);
  try {
    const message = await client.messages.create({
      from,
      to,
      body: `Your Technova verification code is: ${otp}. Valid for 10 minutes.`,
    });
    console.log(`✅ WhatsApp OTP sent. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("❌ Error sending WhatsApp OTP:", error);
    if (error.code === 21660) {
      throw new Error("Twilio WhatsApp sender mismatch. Ensure recipient has joined sandbox (send 'join <code>' to +14155238886).");
    }
    throw error;
  }
};

export default {
  generateOTP,
  normalizePhone,
  storeOTP,
  verifyOTP,
  sendOTP,
};