import { useState, useEffect } from "react";
import { Video, Calendar, Clock, User, ExternalLink, Trash2, Copy, Star, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";
import MeetingInterface from "./MeetingInterface";
import ProfileAvatar from "./ProfileAvatar";
import MeetingReviewModal from "./MeetingReviewModal";
import DirectPaymentModal from "./DirectPaymentModal";
import meetingReviewService from "@/utils/services/meetingReviewService";

export default function SavedMeetings() {
  const { user, meetingDb, auth } = useMyContext();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showMeetingInterface, setShowMeetingInterface] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [meetingToReview, setMeetingToReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState({}); // Track which meetings can be reviewed
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [meetingToPay, setMeetingToPay] = useState(null);

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  // Fetch user's meetings and review status
  const fetchMeetingsAndReviewStatus = async () => {
    if (!user || !meetingDb) return;
    
    setLoading(true);
    try {
      // Fetch all meetings instead of just upcoming
      const allMeetingsData = await meetingDb.getAllMeetings(1, 50); // Get first 50 meetings
      const allMeetings = allMeetingsData.meetings || allMeetingsData || [];
      
      setMeetings(allMeetings);
      
      // Check review status for completed meetings
      const completedMeetings = allMeetings.filter(m => m.status === 'completed');
      const statusChecks = await Promise.all(
        completedMeetings.map(async (meeting) => {
          try {
            const response = await meetingReviewService.canReviewMeeting(meeting._id);
            return { meetingId: meeting._id, ...response.data };
          } catch (error) {
            return { meetingId: meeting._id, canReview: false };
          }
        })
      );
      
      const statusMap = {};
      statusChecks.forEach(status => {
        statusMap[status.meetingId] = status;
      });
      setReviewStatus(statusMap);
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch meetings on mount
  useEffect(() => {
    fetchMeetingsAndReviewStatus();
  }, [user, meetingDb]);

  // Filter meetings based on selected filter
  const filteredMeetings = meetings.filter(meeting => {
    const now = new Date();
    const meetingTime = new Date(meeting.scheduledTime);
    
    switch (filter) {
      case 'upcoming':
        return meetingTime > now && meeting.status === 'scheduled';
      case 'past':
        return meetingTime <= now || meeting.status === 'completed';
      case 'all':
      default:
        return true;
    }
  });

  // Join meeting with role-based interface
  const handleJoinMeeting = (meeting) => {
    try {
      // Validate meeting data
      if (!meeting) {
        toast.error("Meeting data not available");
        return;
      }

      if (!meeting.teacherId || !meeting.studentId) {
        console.error('❌ Missing participant data:', meeting);
        toast.error("Meeting participant information is incomplete");
        return;
      }

      // Check if IDs are populated objects or just strings
      const teacherData = typeof meeting.teacherId === 'object' 
        ? meeting.teacherId 
        : { _id: meeting.teacherId, fullName: 'Teacher', email: '' };
      
      const studentData = typeof meeting.studentId === 'object'
        ? meeting.studentId
        : { _id: meeting.studentId, fullName: 'Student', email: '' };
      
      // Prepare meeting data for the interface
      const meetingData = {
        ...meeting,
        teacher: {
          id: teacherData._id,
          name: teacherData.fullName || 'Teacher',
          email: teacherData.email || ''
        },
        student: {
          id: studentData._id,
          name: studentData.fullName || 'Student',
          email: studentData.email || ''
        }
      };
      
      setSelectedMeeting(meetingData);
      setShowMeetingInterface(true);
      
      toast.success(`Opening meeting as ${isTeacher ? 'Teacher' : 'Student'}...`);
    } catch (error) {
      console.error('❌ Error opening meeting interface:', error);
      console.error('❌ Meeting data:', meeting);
      toast.error("Failed to open meeting interface");
    }
  };

  // Copy meeting link
  const handleCopyLink = async (meetingUrl) => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      toast.success("Meeting link copied to clipboard!");
    } catch (error) {
      console.error('❌ Error copying link:', error);
      toast.error("Failed to copy link");
    }
  };

  // Delete meeting (only for meeting creator)
  const handleDeleteMeeting = async (meetingId) => {
    try {
      // This would need a delete endpoint in the backend
      setMeetings(prev => prev.filter(m => m._id !== meetingId));
      toast.success("Meeting deleted");
    } catch (error) {
      console.error('❌ Error deleting meeting:', error);
      toast.error("Failed to delete meeting");
    }
  };

  // Handle review meeting
  const handleReviewMeeting = (meeting) => {
    setMeetingToReview(meeting);
    setShowReviewModal(true);
  };

  // Handle review success
  const handleReviewSuccess = async () => {
    // Update review status
    setReviewStatus(prev => ({
      ...prev,
      [meetingToReview._id]: { canReview: false, reason: "Already reviewed" }
    }));
    toast.success("Thank you for your feedback!");
    
    // Refresh user data to update average rating and total reviews
    if (auth?.refreshUser) {
      await auth.refreshUser();
    }
    
    // Refresh meetings to update any changes
    fetchMeetingsAndReviewStatus();
  };

  // Handle payment for meeting
  const handlePayMeeting = (meeting) => {
    setMeetingToPay(meeting);
    setShowPaymentModal(true);
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    // Refresh meetings to update payment status
    setMeetings(prev => prev.map(m => 
      m._id === meetingToPay._id 
        ? { ...m, paymentStatus: 'paid_awaiting_confirmation', paymentProof: 'submitted' }
        : m
    ));
    toast.success("Payment submitted! Waiting for teacher confirmation.");
  };

  // Handle payment confirmation (teacher only)
  const handleConfirmPayment = async (meetingId) => {
    try {
      await meetingDb.confirmPayment(meetingId);
      // Update meeting in state
      setMeetings(prev => prev.map(m => 
        m._id === meetingId 
          ? { ...m, isPaid: true, paymentStatus: 'completed' }
          : m
      ));
      toast.success("Payment confirmed! Student has been notified.");
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      toast.error("Failed to confirm payment");
    }
  };

  // Get meeting status
  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const meetingTime = new Date(meeting.scheduledTime);
    const timeDiff = meetingTime - now;
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));

    if (meeting.status === 'completed') return { text: 'Completed', color: 'text-gray-500 bg-gray-100' };
    if (meeting.status === 'cancelled') return { text: 'Cancelled', color: 'text-red-600 bg-red-100' };
    if (timeDiff < 0) return { text: 'Past', color: 'text-gray-500 bg-gray-100' };
    if (minutesUntil <= 10) return { text: 'Starting Soon', color: 'text-orange-600 bg-orange-100' };
    if (minutesUntil <= 60) return { text: 'Starting in 1hr', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'Scheduled', color: 'text-green-600 bg-green-100' };
  };

  // Get participant info
  const getParticipantInfo = (meeting) => {
    const isStudent = user?.role === 'student';
    
    // Handle both populated and non-populated participant data
    let otherParticipant;
    let otherRole;
    
    if (isStudent) {
      otherParticipant = typeof meeting.teacherId === 'object' 
        ? meeting.teacherId 
        : { fullName: 'Teacher' };
      otherRole = 'Teacher';
    } else {
      otherParticipant = typeof meeting.studentId === 'object'
        ? meeting.studentId
        : { fullName: 'Student' };
      otherRole = 'Student';
    }
    
    return {
      name: otherParticipant?.fullName || otherRole,
      role: otherRole
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            My Meetings
          </h2>
          <p className="text-gray-600 mt-1">Manage your scheduled video meetings</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'upcoming', label: 'Upcoming', count: meetings.filter(m => new Date(m.scheduledTime) > new Date() && m.status === 'scheduled').length },
          { key: 'past', label: 'Past', count: meetings.filter(m => new Date(m.scheduledTime) <= new Date() || m.status === 'completed').length },
          { key: 'all', label: 'All', count: meetings.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {filter === 'upcoming' ? 'No upcoming meetings' : 
             filter === 'past' ? 'No past meetings' : 'No meetings found'}
          </h3>
          <p className="text-gray-400">
            {filter === 'upcoming' ? 'Schedule a meeting to get started!' : 'Your meetings will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMeetings.map((meeting) => {
            const status = getMeetingStatus(meeting);
            const participant = getParticipantInfo(meeting);
            const isCreator = meeting.createdBy === user?._id;
            const canJoin = new Date(meeting.scheduledTime) <= new Date(Date.now() + 10 * 60 * 1000); // Can join 10 minutes before

            return (
              <div key={meeting._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                {/* Meeting Title and Status */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{meeting.subject}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.text}
                  </span>
                </div>

                {/* Meeting Details */}
                <div className="space-y-3 mb-5">
                  {/* Date and Time */}
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{new Date(meeting.scheduledTime).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{new Date(meeting.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  {/* Participant */}
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="text-sm">With {participant.name} ({participant.role})</span>
                  </div>
                  
                  {/* Price if meeting has a fee */}
                  {meeting.price > 0 && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">
                        Fee: NPR {meeting.price}
                        {meeting.status === 'completed' && (
                          <span className="ml-2 text-xs">
                            {meeting.isPaid || meeting.paymentStatus === 'completed' 
                              ? '(Payment Required)' 
                              : '(Payment Required)'}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* Room ID */}
                  <div className="flex items-center gap-2 text-gray-500">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-mono text-xs bg-gray-50 px-3 py-1 rounded border border-gray-200">
                      {meeting.roomId}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 flex-wrap">
                  {canJoin && meeting.status === 'scheduled' && (
                    <Button
                      onClick={() => handleJoinMeeting(meeting)}
                      className={`${
                        isTeacher 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                      size="sm"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {isTeacher ? 'Start Teaching' : 'Join Class'}
                    </Button>
                  )}
                  
                  {/* Payment Button for Completed Meetings (Student Only) */}
                  {isStudent && meeting.status === 'completed' && meeting.price > 0 && (
                    <>
                      {meeting.paymentStatus === 'completed' || meeting.isPaid ? (
                        <span className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      ) : meeting.paymentStatus === 'paid_awaiting_confirmation' ? (
                        <span className="text-sm text-orange-600 flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg font-medium">
                          <Clock className="w-4 h-4" />
                          Awaiting Confirmation
                        </span>
                      ) : (
                        <Button
                          onClick={() => handlePayMeeting(meeting)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                          size="sm"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay NPR {meeting.price}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Payment Status for Teachers */}
                  {isTeacher && meeting.status === 'completed' && meeting.price > 0 && (
                    <>
                      {meeting.paymentStatus === 'completed' || meeting.isPaid ? (
                        <span className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Paid (NPR {meeting.price})
                        </span>
                      ) : meeting.paymentStatus === 'paid_awaiting_confirmation' ? (
                        <Button
                          onClick={() => handleConfirmPayment(meeting._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium animate-pulse"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Payment
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-700 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg font-medium">
                          <CreditCard className="w-4 h-4" />
                          NPR {meeting.price} (Pending)
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Review Button for Completed Meetings - ALWAYS SHOW */}
                  {meeting.status === 'completed' && (
                    <>
                      {/* Show "Reviewed" badge if already reviewed */}
                      {reviewStatus[meeting._id]?.reason === "Already reviewed" ? (
                        <span className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg font-medium">
                          <Star className="w-4 h-4 fill-green-600" />
                          Reviewed
                        </span>
                      ) : (
                        /* Show "Rate Meeting" button for all other cases */
                        <Button
                          onClick={() => handleReviewMeeting(meeting)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium"
                          size="sm"
                        >
                          <Star className="w-4 h-4 mr-2 fill-white" />
                          Rate Meeting
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    onClick={() => handleCopyLink(meeting.meetingUrl)}
                    variant="outline"
                    className="px-6 py-2 rounded-lg font-medium border-gray-300 hover:bg-gray-50"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  
                  {isCreator && meeting.status === 'scheduled' && (
                    <Button
                      onClick={() => handleDeleteMeeting(meeting._id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role-Based Meeting Interface */}
      {showMeetingInterface && selectedMeeting && (
        <MeetingInterface
          meetingData={selectedMeeting}
          onClose={() => {
            setShowMeetingInterface(false);
            setSelectedMeeting(null);
          }}
          onMeetingEnd={(meeting) => {
            // Meeting ended - refresh data and show review prompt
            setShowMeetingInterface(false);
            setSelectedMeeting(null);
            
            // Refresh meetings to get updated status
            fetchMeetingsAndReviewStatus();
            
            // Show review prompt after a short delay
            setTimeout(() => {
              toast.success("Meeting completed! Please rate your experience.", {
                duration: 5000,
                action: {
                  label: "Rate Now",
                  onClick: () => {
                    setMeetingToReview(meeting);
                    setShowReviewModal(true);
                  }
                }
              });
            }, 1000);
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && meetingToReview && (
        <MeetingReviewModal
          meeting={meetingToReview}
          onClose={() => {
            setShowReviewModal(false);
            setMeetingToReview(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && meetingToPay && (
        <DirectPaymentModal
          meeting={meetingToPay}
          onClose={() => {
            setShowPaymentModal(false);
            setMeetingToPay(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}