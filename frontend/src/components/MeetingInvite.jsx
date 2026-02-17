import { useState } from "react";
import { Video, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import useMyContext from "@/hooks/useMyContext";
import { toast } from "sonner";
import MeetingInterface from "./MeetingInterface";

export default function MeetingInvite({ 
  recipientId, 
  recipientName, 
  recipientRole,
  subject = "Study Session",
  setSubject = () => {},
  onMeetingCreated = () => {} 
}) {
  const { user, meetingDb } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [showMeetingInterface, setShowMeetingInterface] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);

  const isTeacher = user?.role === 'teacher';

  const handleCreateInstantMeeting = async () => {
    if (!recipientId || !user) {
      toast.error("Missing user information");
      return;
    }

    setLoading(true);
    try {
      const meetingData = await meetingDb.generateMeetingLink(
        user.role === 'student' ? user._id : recipientId,
        user.role === 'teacher' ? user._id : recipientId,
        subject
      );

      // Send invitation via WebSocket
      meetingDb.sendMeetingInvitation(
        meetingData.roomId,
        meetingData.meetingUrl,
        recipientId,
        subject
      );

      toast.success(`Meeting link created and sent to ${recipientName}!`);
      onMeetingCreated(meetingData);

      // Prepare meeting data for role-based interface
      const meetingInterfaceData = {
        ...meetingData,
        teacher: isTeacher ? {
          id: user._id,
          name: user.fullName,
          email: user.email
        } : {
          id: recipientId,
          name: recipientName,
          email: ''
        },
        student: !isTeacher ? {
          id: user._id,
          name: user.fullName,
          email: user.email
        } : {
          id: recipientId,
          name: recipientName,
          email: ''
        }
      };

      // Open role-based meeting interface instead of direct Jitsi
      setCreatedMeeting(meetingInterfaceData);
      setShowMeetingInterface(true);
      
    } catch (error) {
      toast.error("Failed to create meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!scheduledTime) {
      toast.error("Please select a date and time");
      return;
    }

    setLoading(true);
    try {
      const meetingData = await meetingDb.generateMeetingLink(
        user.role === 'student' ? user._id : recipientId,
        user.role === 'teacher' ? user._id : recipientId,
        subject,
        new Date(scheduledTime)
      );

      // Send invitation via WebSocket
      meetingDb.sendMeetingInvitation(
        meetingData.roomId,
        meetingData.meetingUrl,
        recipientId,
        `${subject} - Scheduled for ${new Date(scheduledTime).toLocaleString()}`
      );

      toast.success(`Meeting scheduled and invitation sent to ${recipientName}!`);
      onMeetingCreated(meetingData);
      setScheduledTime("");
      
    } catch (error) {
      toast.error("Failed to schedule meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime (current time + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Video className="w-5 h-5" />
        <h3 className="font-semibold">Video Meeting</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        Invite <strong>{recipientName}</strong> ({recipientRole}) to a video meeting
      </p>

      {/* Meeting Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Meeting Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter meeting subject"
        />
      </div>

      {/* Instant Meeting */}
      <div className="flex gap-2">
        <Button
          onClick={handleCreateInstantMeeting}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <Video className="w-4 h-4 mr-2" />
          {loading ? "Creating..." : "Start Now"}
        </Button>
      </div>

      {/* Schedule Meeting */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Schedule for Later
        </label>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            min={getMinDateTime()}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleScheduleMeeting}
            disabled={loading || !scheduledTime}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {loading ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </div>

      {/* Role-Based Meeting Interface */}
      {showMeetingInterface && createdMeeting && (
        <MeetingInterface
          meetingData={createdMeeting}
          onClose={() => {
            setShowMeetingInterface(false);
            setCreatedMeeting(null);
          }}
        />
      )}
    </div>
  );
}