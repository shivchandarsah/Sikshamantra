import { useState, useEffect } from "react";
import { Video, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useMyContext from "@/hooks/useMyContext";
import { toast } from "sonner";
import MeetingInterface from "./MeetingInterface";

export default function MeetingNotification() {
  const { meetingDb, user } = useMyContext();
  const [invitations, setInvitations] = useState([]);
  const [showMeetingInterface, setShowMeetingInterface] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    // Listen for meeting invitations
    const handleMeetingInvitation = (invitation) => {
      // Add to invitations list
      setInvitations(prev => [...prev, {
        ...invitation,
        id: `${invitation.roomId}-${Date.now()}`
      }]);

      // Show toast notification
      toast.info(`Meeting invitation from ${invitation.senderName || 'Someone'}`, {
        description: invitation.subject,
        duration: 10000,
      });
    };

    meetingDb.onMeetingInvitation(handleMeetingInvitation);

    // Cleanup function would go here if needed
    return () => {
      // Socket cleanup is handled in the service
    };
  }, [meetingDb]);

  const handleAcceptInvitation = (invitation) => {
    try {
      // Prepare meeting data for role-based interface
      const meetingData = {
        roomId: invitation.roomId,
        meetingUrl: invitation.meetingUrl,
        subject: invitation.subject,
        teacher: isTeacher ? {
          id: user._id,
          name: user.fullName,
          email: user.email
        } : {
          id: invitation.senderId || 'unknown',
          name: invitation.senderName || 'Teacher',
          email: ''
        },
        student: !isTeacher ? {
          id: user._id,
          name: user.fullName,
          email: user.email
        } : {
          id: invitation.recipientId || 'unknown',
          name: 'Student',
          email: ''
        }
      };
      
      // Remove from invitations
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      
      // Open role-based meeting interface
      setSelectedInvitation(meetingData);
      setShowMeetingInterface(true);
      
      toast.success(`Joining meeting as ${isTeacher ? 'Teacher' : 'Student'}...`);
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error("Failed to join meeting");
    }
  };

  const handleDeclineInvitation = (invitation) => {
    // Remove from invitations
    setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    toast.info("Meeting invitation declined");
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">Video Meeting</h4>
              <p className="text-sm text-gray-600">{invitation.subject}</p>
            </div>
            <button
              onClick={() => handleDeclineInvitation(invitation)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <User className="w-4 h-4" />
            <span>From: {invitation.senderName || 'Someone'}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleAcceptInvitation(invitation)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Video className="w-4 h-4 mr-2" />
              Join Meeting
            </Button>
            <Button
              onClick={() => handleDeclineInvitation(invitation)}
              variant="outline"
              size="sm"
              className="px-4"
            >
              Decline
            </Button>
          </div>
        </div>
      ))}

      {/* Role-Based Meeting Interface */}
      {showMeetingInterface && selectedInvitation && (
        <MeetingInterface
          meetingData={selectedInvitation}
          onClose={() => {
            setShowMeetingInterface(false);
            setSelectedInvitation(null);
          }}
        />
      )}
    </div>
  );
}