import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Phone, FileText, CheckCircle } from "lucide-react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { toast } from "react-toastify";

const AdvisorOnboarding = () => {
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
      await axios.post(
        `${serverUrl}/api/advisor/send-otp`,
        { phone: formData.phone },
        { withCredentials: true }
      );
      toast.success("OTP sent successfully");
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
      await axios.post(
        `${serverUrl}/api/advisor/verify-otp`,
        { phone: formData.phone, otp: formData.otp },
        { withCredentials: true }
      );
      toast.success("Phone verified successfully");
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

      await axios.post(`${serverUrl}/api/advisor/onboarding`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Application submitted successfully!");
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s ? "bg-black" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Phone</span>
            <span>Verify</span>
            <span>Documents</span>
            <span>Done</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Phone className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Phone Verification</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Enter your phone number to receive an OTP for verification.
              </p>
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-black"
              />
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Enter OTP</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Enter the 6-digit OTP sent to {formData.phone}
              </p>
              <input
                type="text"
                placeholder="Enter OTP"
                maxLength={6}
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-center text-2xl tracking-widest focus:outline-none focus:border-black"
              />
              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6" />
                <h2 className="text-2xl font-bold">SEBI Registration</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    SEBI Registration Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., INH000001234"
                    value={formData.sebiRegistrationNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sebiRegistrationNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    placeholder="Tell investors about your trading experience..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    SEBI Certificate *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="sebi-upload"
                    />
                    <label
                      htmlFor="sebi-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {sebiFile
                          ? sebiFile.name
                          : "Click to upload SEBI certificate"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF or Image (Max 5MB)
                      </p>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Application Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your advisor application is under review. You'll be notified
                once it's approved by our admin team.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition"
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
