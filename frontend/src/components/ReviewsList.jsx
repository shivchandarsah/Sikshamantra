import { useState, useEffect } from "react";
import { Star, User, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import meetingReviewService from "@/utils/services/meetingReviewService";
import { toast } from "sonner";

export default function ReviewsList({ userId, userRole, onStatisticsUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await meetingReviewService.getUserReviews(userId, { page, limit: 10 });
      setReviews(response.data.reviews);
      setStatistics(response.data.statistics);
      setPagination(response.data.pagination);
      
      // Call the callback to update parent component
      if (onStatisticsUpdate) {
        onStatisticsUpdate(response.data.statistics);
      }
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingBar = (count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      {statistics && statistics.totalReviews > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Overall Rating</h3>
              </div>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {statistics.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {renderStars(Math.round(statistics.averageRating))}
              </div>
              <p className="text-sm text-gray-600">
                Based on {statistics.totalReviews} {statistics.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution</h3>
              {[5, 4, 3, 2, 1].map((star) => {
                const starKeys = {
                  5: 'fiveStars',
                  4: 'fourStars',
                  3: 'threeStars',
                  2: 'twoStars',
                  1: 'oneStar'
                };
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-12">{star} star</span>
                    {renderRatingBar(
                      statistics[starKeys[star]] || 0,
                      statistics.totalReviews
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {review.isAnonymous ? (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                  ) : (
                    <img
                      src={review.reviewer?.profilePicture || "/default-avatar.png"}
                      alt={review.reviewer?.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.isAnonymous ? "Anonymous" : review.reviewer?.fullName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-lg font-bold text-gray-900">{review.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Meeting Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Meeting:</span> {review.meeting?.subject}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(review.meeting?.scheduledTime).toLocaleString()}
                </p>
              </div>

              {/* Category Ratings */}
              {review.categories && Object.keys(review.categories).length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Object.entries(review.categories).map(([category, rating]) => (
                    rating > 0 && (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{category}:</span>
                        <div className="flex items-center gap-1">
                          {renderStars(rating)}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Comment */}
              {review.comment && (
                <div className="flex gap-2 text-gray-700">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500">
              {userRole === "teacher" 
                ? "Complete meetings to receive reviews from students"
                : "Complete meetings to receive reviews from teachers"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
