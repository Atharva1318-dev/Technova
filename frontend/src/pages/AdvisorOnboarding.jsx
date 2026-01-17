import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Upload,
  Phone,
  FileText,
  CheckCircle,
  Shield,
  Lock,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { toast } from "react-toastify";
import { setUserData } from "../redux/userSlice";

const AdvisorOnboarding = () => {
  // 🔒 LOGIC — DO NOT TOUCH
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sebiRegistrationNumber: "",
    bio: "",
    phone: "",
    otp: "",
  });
  const [sebiFile, setSebiFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const { serverUrl } = useContext(AuthDataContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user.userData);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSebiFile(file);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/advisor/send-otp`,
        { phone: formData.phone },
        { withCredentials: true }
      );
      toast.success("OTP sent to WhatsApp successfully");
      setFormData((prev) => ({ ...prev, phone: response.data.phone }));
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/advisor/verify-otp`,
        { phone: formData.phone, otp: formData.otp },
        { withCredentials: true }
      );
      toast.success("Phone verified successfully");

      if (response.data.user) {
        dispatch(setUserData(response.data.user));
      }

      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.sebiRegistrationNumber || !sebiFile) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("sebiRegistrationNumber", formData.sebiRegistrationNumber);
      data.append("bio", formData.bio);
      data.append("phone", formData.phone);
      data.append("sebiCertificate", sebiFile);

      const response = await axios.post(
        `${serverUrl}/api/advisor/onboarding`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Application submitted successfully!");

      if (response.data.user) {
        dispatch(setUserData(response.data.user));
      }

      setStep(4);
      setTimeout(() => navigate("/advisor/dashboard"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-24 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-900/20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-900/10 blur-[120px]" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-blue-400">
            <Shield />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Advisor Onboarding
          </h1>
          <p className="text-neutral-400">
            Complete verification to publish trading signals
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{
                  width:
                    step === 1
                      ? "0%"
                      : step === 2
                        ? "33%"
                        : step === 3
                          ? "66%"
                          : "100%",
                }}
              />
            </div>

            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center border z-10 ${step >= s
                  ? "bg-neutral-950 border-blue-500 text-blue-400"
                  : "bg-neutral-900 border-white/10 text-neutral-500"
                  }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-neutral-500 mt-2">
            <span>Phone</span>
            <span>OTP</span>
            <span>Documents</span>
            <span>Done</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Phone /> Phone Verification
              </h2>
              <p className="text-neutral-400 mb-6">
                Receive OTP on WhatsApp
              </p>

              <input
                type="tel"
                placeholder="10 digit phone number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3 bg-neutral-950/60 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 mb-6"
              />

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Lock /> Verify OTP
              </h2>
              <p className="text-neutral-400 mb-6">
                Sent to {formData.phone}
              </p>

              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={formData.otp}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setFormData({ ...formData, otp: e.target.value })
                }
                className="w-full px-4 py-3 text-center text-3xl tracking-widest bg-neutral-950/60 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-neutral-300"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                >
                  Verify
                </button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <FileText /> SEBI Details
              </h2>

              <input
                type="text"
                placeholder="SEBI Registration Number"
                value={formData.sebiRegistrationNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sebiRegistrationNumber: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-4 py-3 bg-neutral-950/60 border border-white/10 rounded-xl text-white mb-4"
              />

              <textarea
                placeholder="Short professional bio (optional)"
                rows={4}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full px-4 py-3 bg-neutral-950/60 border border-white/10 rounded-xl text-white mb-4 resize-none"
              />

              <label className="block border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-white/20 mb-6">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="mx-auto text-neutral-400 mb-2" />
                <p className="text-neutral-300 text-sm">
                  {sebiFile ? sebiFile.name : "Upload SEBI Certificate"}
                </p>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-neutral-300"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
                >
                  Submit
                </button>
              </div>
            </>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="text-center py-10">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Application Submitted
              </h2>
              <p className="text-neutral-400 mb-6">
                Our team will verify your details shortly
              </p>
              <button
                onClick={() => navigate("/advisor/dashboard")}
                className="px-8 py-3 rounded-xl bg-white text-black font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorOnboarding;
