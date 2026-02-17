import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  X,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useParams, useNavigate } from "react-router-dom";

// Rejection Modal Component
function RejectionModal({ isOpen, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");

  const predefinedReasons = [
    "Price is too high",
    "Time doesn't work for me",
    "Found a better offer",
    "Changed my mind",
    "Teacher doesn't match my requirements",
    "Other"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === "Other" ? reason : selectedReason;
    if (!finalReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    onConfirm(finalReason);
  };

  const handleReasonSelect = (reasonText) => {
    setSelectedReason(reasonText);
    if (reasonText !== "Other") {
      setReason("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Reject Offer</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Please let the teacher know why you're rejecting their offer. This helps them improve future offers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reason for rejection:</label>
            <div className="space-y-2">
              {predefinedReasons.map((reasonText) => (
                <label key={reasonText} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reasonText}
                    checked={selectedReason === reasonText}
                    onChange={() => handleReasonSelect(reasonText)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{reasonText}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please specify:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter your reason..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
                maxLength={200}
                required
              />
              <div className="text-xs text-gray-500 mt-1">{reason.length}/200</div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rejecting...
                </span>
              ) : (
                "Reject Offer"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OfferTile({ offer, onAccept, onReject, clicking, rejecting, accepted, rejected }) {
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const handleRejectClick = () => {
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = (reason) => {
    onReject(offer?._id, reason);
    setShowRejectionModal(false);
  };

  return (
    <>
      <div
        className={`relative bg-white border border-neutral-100 rounded-2xl shadow-sm p-6 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg ${
          accepted ? "ring-2 ring-green-500 bg-green-50" : rejected ? "ring-2 ring-red-500 bg-red-50" : "hover:border-gray-300"
        }`}
        style={{ minHeight: 200 }}
      >
        {/* Header with Teacher Info */}
        <div className="flex items-center gap-3 mb-2">
          <ProfileAvatar 
            user={offer?.offeredBy} 
            size="md"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-800 text-base tracking-tight">
                {offer?.offeredBy.fullName}
              </span>
              {accepted && (
                <CheckCircle2
                  className="text-green-500"
                  size={18}
                  title="Accepted"
                />
              )}
              {rejected && (
                <X
                  className="text-red-500"
                  size={18}
                  title="Rejected"
                />
              )}
            </div>
            <div className="text-xs text-gray-500">
              {offer?.offeredBy.role === 'teacher' ? '👨‍🏫 Teacher' : '👤 User'}
            </div>
          </div>
        </div>

        {/* Offer Details */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-1 font-medium">
              <IndianRupee size={16} className="text-green-600" /> 
              <span className="text-green-600 font-semibold">₹{offer?.proposed_price}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={16} className="text-blue-600" />
              <span>{new Date(offer?.appointmentTime).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} className="text-purple-600" />
              <span>{new Date(offer?.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          </div>

          {/* Message */}
          <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <MessageSquare size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Teacher's Message:</p>
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  "{offer?.message}"
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        {!accepted && !rejected && (
          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={() => onAccept(offer?._id)}
              disabled={clicking || rejecting}
            >
              {clicking ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Accepting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Accept Offer
                </span>
              )}
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleRejectClick}
              disabled={clicking || rejecting}
            >
              {rejecting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rejecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <X size={16} />
                  Reject Offer
                </span>
              )}
            </Button>
          </div>
        )}
        
        {/* Status Indicators */}
        {accepted && (
          <div className="bg-green-100 border border-green-300 rounded-xl p-3 mt-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={18} />
              <span className="font-semibold">Offer Accepted!</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              You can now chat with this teacher and schedule your session.
            </p>
          </div>
        )}
        
        {rejected && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-3 mt-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <X size={18} />
              <span className="font-semibold">Offer Rejected</span>
            </div>
            {offer?.rejectionReason && (
              <div className="bg-white rounded-lg p-2 border border-red-200">
                <p className="text-red-600 text-sm">
                  <strong>Reason:</strong> {offer.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleRejectConfirm}
        loading={rejecting}
      />
    </>
  );
}

function OfferForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ fee: "", time: "", message: "" });
  const [error, setError] = useState("");
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fee || !form.time || !form.message) {
      setError("All fields are required.");
      return;
    }
    setError("");
    onSubmit(form);
    setForm({ fee: "", time: "", message: "" });
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-white border border-neutral-100 rounded-2xl shadow-sm p-8 max-w-lg mx-auto mt-10"
    >
      <h2 className="text-xl font-bold text-green-700 mb-2 tracking-tight">
        Send Your Offer
      </h2>
      <div className="flex flex-col gap-3">
        <Input
          name="fee"
          placeholder="Fee (₹)"
          type="number"
          value={form.fee}
          onChange={handleChange}
          required
          min={0}
          className="rounded-lg border-neutral-200 focus:border-green-400 focus:ring-green-100"
        />
        <Input
          name="time"
          placeholder="Preferred Time"
          type="datetime-local"
          value={form.time}
          onChange={handleChange}
          required
          className="rounded-lg border-neutral-200 focus:border-green-400 focus:ring-green-100"
        />
        <textarea
          name="message"
          placeholder="Message for the student"
          value={form.message}
          onChange={handleChange}
          required
          className="border rounded-lg px-3 py-2 text-base shadow-xs focus:border-green-400 focus:ring-green-100 outline-none min-h-[60px] resize-y bg-neutral-50"
        />
      </div>
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <Button
        type="submit"
        className="w-full bg-green-600 text-white hover:bg-green-700 rounded-full px-6 py-2 text-base font-semibold shadow-none mt-2"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Offer"}
      </Button>
    </form>
  );
}

export default function RequestDetails() {
  const [offersList, setOffersList] = useState([]);
  const [acceptedOfferId, setAcceptedOfferId] = useState(null);
  const [rejectedOfferId, setRejectedOfferId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, offerDb, postDb, userLoaded, initialized } = useMyContext();
  const [isTeacher, setIsTeacher] = useState(false);
  const [request, setRequest] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userLoaded && initialized) {
      const isteacher = user?.role === "teacher";
      setIsTeacher(isteacher);
    }
  }, [user, userLoaded, initialized]);

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!user || !userLoaded || !initialized || !id) {
        return;
      }

      setLoading(true);
      try {
        const res = await postDb.fetchPostDetail(id);
        setRequest(res);
      } catch (error) {
        if (error.response?.status === 404) {
          // Post not found - redirect to appropriate page
          toast.error("This request no longer exists or has been removed.");
          navigate(user?.role === 'teacher' ? '/teacher/explore-requests' : '/student/requests');
          return;
        }
        toast.error("Failed to load request details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPostDetails();
  }, [id, user, userLoaded, initialized, postDb]);

  useEffect(() => {
    const fetchSubmittedOffer = async () => {
      if (!user || !userLoaded || !initialized) {
        return;
      }
      
      if (!id) {
        return;
      }
      
      try {
        const res = await offerDb.fetchOfferByReqId(id);
        
        if (user.role === 'teacher') {
          if (res) {
            setSubmitted(true);
          } else {
            setSubmitted(false);
          }
        } else {
          setSubmitted(false);
        }
      } catch (error) {
        console.error("❌ Error checking submitted offer:", error);
        if (error.response?.status !== 404 && error.response?.status !== 403) {
          console.error("❌ Unexpected error:", error.response?.data);
          toast.error("Failed to check your submitted offer status.");
        } else {
          setSubmitted(false);
        }
      }
    };

    fetchSubmittedOffer();
  }, [user, userLoaded, initialized, isTeacher, id, offerDb]);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user || !userLoaded || !initialized || !id) {
        return;
      }

      // Only students should see offers list
      if (user.role !== 'student') {
        return;
      }

      setLoading(true);
      try {
        const res = await offerDb.fetchOffersByReqId(id);
        setOffersList(res || []);
      } catch (error) {
        console.error("❌ Error fetching offers:", error);
        toast.error("Failed to load offers. Please try again later.");
        setOffersList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [id, user, userLoaded, initialized, offerDb]);

  const handleOfferSubmit = async (formdata) => {
    setLoading(true);
    try {
      const res = await offerDb.createOffer({
        ...formdata,
        reqId: id,
        studentId: request?.studentDetail._id,
      });
      toast.success("Offer sent to the student!");
    } catch (error) {
      console.error(error);
      toast.error("Error sending offer to the student!");
    } finally {
      setLoading(false);
    }
  };

  const handleAccpetOffer = async (offerId) => {
    setAcceptedOfferId(offerId);
    try {
      const res = await offerDb.acceptOffer(offerId);
      toast.success("Offer accepted successfully!");
      // Update the offers list
      setOffersList((prev) =>
        prev.map((offer) =>
          offer._id === offerId ? { ...offer, status: "Accepted" } : offer
        )
      );
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error("Failed to accept the offer. Please try again.");
    } finally {
      setAcceptedOfferId(null);
    }
  };

  const handleRejectOffer = async (offerId, reason = null) => {
    setRejectedOfferId(offerId);
    try {
      const res = await offerDb.rejectOffer(offerId, reason);
      toast.success("Offer rejected successfully!");
      // Update the offers list
      setOffersList((prev) =>
        prev.map((offer) =>
          offer._id === offerId ? { ...offer, status: "Rejected", rejectionReason: reason } : offer
        )
      );
    } catch (error) {
      console.error("Error rejecting offer:", error);
      toast.error("Failed to reject the offer. Please try again.");
    } finally {
      setRejectedOfferId(null);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-2 md:px-0">
      {/* ✅ Show loading state while waiting for authentication */}
      {(!user || !userLoaded || !initialized) ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-neutral-500">Loading request details...</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Request Card */}
          <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-8 mb-10">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4 tracking-tight">
              {request?.topic}
            </h1>
            <p className="text-neutral-600 mb-4">{request?.description}</p>
            <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
              <span className="flex items-center gap-1">
                <IndianRupee size={16} /> {request?.budget}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} />{" "}
                {new Date(request?.appointmentTime).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ProfileAvatar 
                user={request?.studentDetail} 
                size="sm"
              />
              <span className="font-semibold text-neutral-800 text-base tracking-tight">
                {request?.studentDetail.fullName}
              </span>
            </div>
            <div className="text-neutral-500 text-sm mt-2">
              <span className="italic">
                Posted on: {new Date(request?.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Student: Offers List */}
          {!isTeacher && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-neutral-800 mb-8 tracking-tight">
                Offers from Teachers
              </h2>
              {offersList.length === 0 ? (
                <div className="text-neutral-400 text-center py-20 text-lg">
                  No offers yet. Please wait for teachers to respond.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {offersList.map((offer) => (
                    <OfferTile
                      key={offer._id}
                      offer={offer}
                      onAccept={handleAccpetOffer}
                      onReject={handleRejectOffer}
                      accepted={offer.status === "Accepted"}
                      rejected={offer.status === "Rejected"}
                      clicking={acceptedOfferId === offer._id}
                      rejecting={rejectedOfferId === offer._id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Teacher: Offer Form */}
          {isTeacher &&
            (submitted ? (
              <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-8 mt-10">
                <h2 className="text-2xl font-bold text-neutral-800 mb-4 tracking-tight">
                  Your Offer
                </h2>
                <p className="text-neutral-600 mb-4">
                  You have already submitted an offer for this request.
                </p>
                <p className="text-neutral-500 text-sm">
                  Please wait for the student to respond.
                </p>
              </div>
            ) : (
              <OfferForm onSubmit={handleOfferSubmit} loading={loading} />
            ))}
        </>
      )}
    </div>
  );
}
