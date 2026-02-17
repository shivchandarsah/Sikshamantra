import { useState, useEffect } from "react";
import { CreditCard, Upload, Save, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";
import axiosInstance from "@/helper/axios";

export default function PaymentSettings() {
  const { user, auth } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [esewaId, setEsewaId] = useState("");
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState("");
  const [hasPaymentDetails, setHasPaymentDetails] = useState(false);
  
  // Track if component has been initialized
  const [initialized, setInitialized] = useState(false);

  // Initialize from user data
  useEffect(() => {
    if (user && !initialized) {
      console.log('🎬 Initializing PaymentSettings from database');
      
      // Always load from user context (which comes from database)
      const userEsewaId = user.esewaId || "";
      const userQrCode = user.esewaQRCode || "";
      
      console.log('👤 Loading from user context:', {
        hasEsewaId: !!userEsewaId,
        hasQRCode: !!userQrCode
      });
      
      setEsewaId(userEsewaId);
      setQrCodePreview(userQrCode);
      
      const hasDetails = !!(userEsewaId || userQrCode);
      setHasPaymentDetails(hasDetails);
      
      // If no details, start in edit mode
      if (!hasDetails) {
        setEditing(true);
      } else {
        setEditing(false);
      }
      
      setInitialized(true);
    }
  }, [user, initialized]);

  const handleQRCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }

      setQrCodeFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!esewaId && !qrCodePreview) {
      toast.error("Please provide at least eSewa ID or QR code");
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      
      if (esewaId) {
        payload.esewaId = esewaId;
      }
      
      if (qrCodePreview) {
        payload.esewaQRCode = qrCodePreview; // Base64 string
      }

      console.log('💾 Saving payment details:', { 
        hasEsewaId: !!esewaId, 
        hasQRCode: !!qrCodePreview,
        qrCodeLength: qrCodePreview?.length 
      });

      const response = await axiosInstance.put('/users/profile', payload);

      console.log('✅ Payment details saved:', response.data);
      toast.success("Payment details updated successfully!");
      
      // Get the saved values from response
      const finalEsewaId = response.data?.data?.esewaId || esewaId;
      const finalQrCode = response.data?.data?.esewaQRCode || qrCodePreview;
      
      // Update all state
      setEsewaId(finalEsewaId);
      setQrCodePreview(finalQrCode);
      setHasPaymentDetails(true);
      setEditing(false);
      
      console.log('💾 Payment details updated in state');
      
      // Refresh user data to ensure context is updated
      if (auth?.refreshUser) {
        auth.refreshUser().then(updatedUser => {
          console.log('🔄 User context refreshed:', {
            hasEsewaId: !!updatedUser?.esewaId,
            hasQRCode: !!updatedUser?.esewaQRCode
          });
        });
      }
    } catch (error) {
      console.error('❌ Error updating payment details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || "Failed to update payment details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="mt-1 hover:bg-white/20 text-white"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  <CreditCard className="w-10 h-10" />
                  Payment Settings
                </h1>
                <p className="text-green-100 text-lg">
                  Configure your eSewa payment details to receive payments from students
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        {hasPaymentDetails ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Payment details configured</p>
              <p className="text-sm text-green-700">Students can now pay you directly via eSewa</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">Payment details not configured</p>
              <p className="text-sm text-yellow-700">Add your eSewa details to receive payments from students</p>
            </div>
          </div>
        )}

        {/* Payment Details Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">eSewa Payment Details</h2>
              <p className="text-gray-600">
                {editing 
                  ? "Provide your eSewa ID and/or QR code so students can pay you directly after meetings"
                  : "Your saved payment details"}
              </p>
            </div>
            {hasPaymentDetails && !editing && (
              <Button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Edit Details
              </Button>
            )}
          </div>

          {!editing && hasPaymentDetails ? (
            /* Read-only view */
            <div className="space-y-6">
              {/* Saved eSewa ID */}
              {esewaId && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    eSewa ID
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-900 font-medium">{esewaId}</p>
                  </div>
                </div>
              )}

              {/* Saved QR Code */}
              {qrCodePreview && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    eSewa QR Code
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                      <img
                        src={qrCodePreview}
                        alt="eSewa QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Students can scan this QR code to pay you via eSewa</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Edit mode */
            <>
              {/* eSewa ID */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  eSewa ID <span className="text-gray-400 font-normal">(Phone number or eSewa ID)</span>
                </label>
                <input
                  type="text"
                  value={esewaId}
                  onChange={(e) => setEsewaId(e.target.value)}
                  placeholder="e.g., 9862081876"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">
                  Students will use this ID to send payments via eSewa
                </p>
              </div>

              {/* QR Code Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  eSewa QR Code <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                
                <div className="flex items-start gap-4">
                  {/* Upload Button */}
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleQRCodeChange}
                      />
                    </label>
                  </div>

                  {/* QR Code Preview */}
                  {qrCodePreview && (
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={qrCodePreview}
                          alt="QR Code Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-1">Preview</p>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-500">
                  Upload your eSewa QR code image for easy scanning by students
                </p>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                {hasPaymentDetails && (
                  <Button
                    onClick={() => {
                      setEditing(false);
                      // Reset to user data from context
                      setEsewaId(user?.esewaId || "");
                      setQrCodePreview(user?.esewaQRCode || "");
                      setQrCodeFile(null);
                    }}
                    variant="outline"
                    className="px-6"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || (!esewaId && !qrCodeFile && !qrCodePreview)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Saving..." : "Save Payment Details"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            How it works
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>After completing a meeting, students will see your eSewa payment details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Students can pay using your eSewa ID or by scanning your QR code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>After payment, students submit the transaction ID for your verification</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>You confirm the payment after verifying it in your eSewa account</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
