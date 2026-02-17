import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useMyContext from "@/hooks/useMyContext";
import meetingReviewService from "@/utils/services/meetingReviewService";
import MeetingReviewModal from "./MeetingReviewModal";

export default function ReviewNotificationBanner() {
  const { user, meetingDb } = useMyContext();
  const [pendingReviews, setPendingReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [dismissedMeetings, setDismissedMeetings] = useState(new Set());

  useEffect(() => {
    fetchPendingReviews();
  }, [user, meetingDb]);

  const fetchPendingReviews = async () => {
    if (!user || !meetingDb) return;

    try {
      // Get all completed meetings
      const allMeetingsData = await meetingDb.getAllMeetings(1, 50);
      const allMeetings = allMeetingsData.meetings || allMeetingsData || [];
      
      // Filter completed meetings
      const completedMeetings = allMeetings.filter(m => m.status === 'completed');
      
      // Check which ones can be reviewed
      const reviewChecks = await Promise.all(
        completedMeetings.map(async (meeting) => {
          try {
            const response = await meetingReviewService.canReviewMeeting(meeting._id);
            if (response.data.canReview) {
              return meeting;
            }
            return null;
          } catch (error) {
            return null;
          }
        })
      );
      
      // Filter out nulls and dismissed meetings
      const pending = reviewChecks.filter(m => m !== null && !dismissedMeetings.has(m._id));
      setPendingReviews(pending);
    } catch (error) {
      console.error('❌ Error fetching pending reviews:', error);
    }
  };

  const handleReviewClick = (meeting) => {
    setSelectedMeeting(meeting);
    setShowReviewModal(true);
  };

  const handleDismiss = (meetingId) => {
    setDismissedMeetings(prev => new Set([...prev, meetingId]));
    setPendingReviews(prev => prev.filter(m => m._id !== meetingId));
  };

  const handleReviewSuccess = () => {
    // Remove the reviewed meeting from pending list
    setPendingReviews(prev => prev.filter(m => m._id !== selectedMeeting._id));
    setShowReviewModal(false);
    setSelectedMeeting(null);
  };

  if (pendingReviews.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6 space-y-3">
        {pendingReviews.slice(0, 3).map((meeting) => (
          <div
            key={meeting._id}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm animate-pulse-slow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Rate Your Meeting
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">{meeting.subject}</span> with{" "}
                    {user?.role === 'student' 
                      ? meeting.teacherId?.fullName || 'Teacher'
                      : meeting.studentId?.fullName || 'Student'
                    }
                  </p>
                  <p className="text-xs text-gray-600">
                    Completed on {new Date(meeting.completedAt || meeting.scheduledTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => handleReviewClick(meeting)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  size="sm"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Rate Now
                </Button>
                <button
                  onClick={() => handleDismiss(meeting._id)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {pendingReviews.length > 3 && (
          <div className="text-center">
            <button
              onClick={() => window.location.href = '/meetings'}
              className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
            >
              + {pendingReviews.length - 3} more meeting{pendingReviews.length - 3 !== 1 ? 's' : ''} to review
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedMeeting && (
        <MeetingReviewModal
          meeting={selectedMeeting}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedMeeting(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}
