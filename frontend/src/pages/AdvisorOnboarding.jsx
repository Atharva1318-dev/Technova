
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Upload, Phone, FileText, CheckCircle } from "lucide-react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { toast } from "react-toastify";
import { setUserData } from "../redux/userSlice";

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
      // Store normalized phone from response
      setFormData(prev => ({ ...prev, phone: response.data.phone }));
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

      // Update Redux with server-returned user (isVerified is now true)
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

      // Update Redux with server-returned user (verificationStatus is now pending)
      if (response.data.user) {
        dispatch(setUserData(response.data.user));
      }

      setStep(4);
      setTimeout(() => {
        navigate("/advisor/dashboard");
      }, 2000);
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
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s <= step ? (
                    s < 4 ? s : <CheckCircle className="w-6 h-6" />
                  ) : (
                    s
                  )}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step > s ? "bg-black" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-600">
            <span>Phone</span>
            <span>Verify OTP</span>
            <span>Documents</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Phone className="w-6 h-6 text-black" />
                <h2 className="text-2xl font-bold">Phone Verification</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Enter your phone number to receive an OTP via WhatsApp for verification.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="10 digit number (e.g., 8433943227)"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    OTP will be sent via WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading || !formData.phone}
                className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? "Sending..." : "Send OTP via WhatsApp"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-black" />
                <h2 className="text-2xl font-bold">Verify OTP</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Enter the 6-digit OTP sent to WhatsApp at {formData.phone}
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      setFormData({ ...formData, otp: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-3xl tracking-widest font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
                <p className="text-xs text-gray-500 text-center">
                  OTP valid for 10 minutes
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-black font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || formData.otp.length !== 6}
                  className="flex-1 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-black" />
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
                        sebiRegistrationNumber: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    placeholder="Tell investors about your trading experience, expertise, and investment strategy..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    SEBI Certificate *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="sebi-upload"
                    />
                    <label
                      htmlFor="sebi-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">
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
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 text-black font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.sebiRegistrationNumber || !sebiFile}
                  className="flex-1 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2">
                Application Submitted!
              </h2>
              <p className="text-gray-600 mb-2">
                Your advisor application has been received successfully.
              </p>
              <p className="text-gray-500 text-sm mb-8">
                You'll be notified once it's approved by our admin team. This usually takes 1-2 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800">
                  ✓ Phone verified: {formData.phone}
                </p>
                <p className="text-sm text-blue-800">
                  ✓ SEBI Registration: {formData.sebiRegistrationNumber}
                </p>
                <p className="text-sm text-blue-800">
                  ✓ Certificate uploaded: {sebiFile?.name}
                </p>
              </div>
              <button
                onClick={() => navigate("/advisor/dashboard")}
                className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition"
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