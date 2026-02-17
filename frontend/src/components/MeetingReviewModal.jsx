import { useState } from "react";
import { X, Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import meetingReviewService from "@/utils/services/meetingReviewService";
import { toast } from "sonner";

export default function MeetingReviewModal({ meeting, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    comment: "",
    rating: 0, // Single overall rating
    isAnonymous: false,
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  const handleStarClick = (rating) => {
    setFormData({
      ...formData,
      rating: rating,
    });
  };

  const handleStarHover = (rating) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate rating
    if (formData.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      await meetingReviewService.createReview(meeting._id, formData);
      toast.success("Review submitted successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      toast.error(error.response?.data?.message || error.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const currentRating = formData.rating;
    const hovered = hoveredRating;

    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            onMouseLeave={() => handleStarLeave()}
            className="focus:outline-none transition-transform hover:scale-125"
          >
            <Star
              className={`w-12 h-12 ${
                star <= (hovered || currentRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Rate Your Meeting</h2>
              <p className="text-blue-100 mt-1">
                {meeting.subject} - {new Date(meeting.scheduledTime).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Single Rating Row */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 text-center">How would you rate this meeting?</h3>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              {renderStars()}
              <p className="text-center mt-3 text-sm font-medium text-gray-700">
                {formData.rating === 0 && "Click to rate"}
                {formData.rating === 1 && "⭐ Poor"}
                {formData.rating === 2 && "⭐⭐ Fair"}
                {formData.rating === 3 && "⭐⭐⭐ Good"}
                {formData.rating === 4 && "⭐⭐⭐⭐ Very Good"}
                {formData.rating === 5 && "⭐⭐⭐⭐⭐ Excellent"}
              </p>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share your experience..."
              rows={4}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length} / 500 characters
            </p>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={(e) =>
                setFormData({ ...formData, isAnonymous: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
              Submit this review anonymously
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
