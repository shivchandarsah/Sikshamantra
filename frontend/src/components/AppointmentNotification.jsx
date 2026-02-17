import { useState, useEffect } from "react";
import { Calendar, Clock, Video, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";

export default function AppointmentNotification() {
  const { user, meetingDb } = useMyContext();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // Listen for appointment invitations
    const handleAppointmentInvitation = (invitation) => {
      
      // Add to appointments list
      setAppointments(prev => [...prev, {
        ...invitation,
        id: `${invitation.appointment.teacherId}-${Date.now()}`
      }]);

      // Show toast notification
      toast.info(`New appointment invitation from ${invitation.sender.name}!`, {
        description: `${invitation.appointment.subject} - ${new Date(invitation.appointment.scheduledTime).toLocaleString()}`,
        duration: 10000,
        action: {
          label: "View",
          onClick: () => {
            // Scroll to notification or highlight it
          }
        }
      });

      // Play notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors
        });
      } catch (error) {
        // Ignore audio errors
      }
    };

    // Set up WebSocket listener
    const setupSocketListener = async () => {
      try {
        const { getSocket } = await import("@/utils/socket.js");
        const socket = getSocket();
        
        if (socket) {
          socket.on('receiveAppointmentInvitation', handleAppointmentInvitation);
        }
      } catch (error) {
        // Ignore setup errors
      }
    };

    setupSocketListener();

    // Cleanup function
    return () => {
      const cleanup = async () => {
        try {
          const { getSocket } = await import("@/utils/socket.js");
          const socket = getSocket();
          if (socket) {
            socket.off('receiveAppointmentInvitation', handleAppointmentInvitation);
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      cleanup();
    };
  }, []);

  const handleAcceptAppointment = async (appointment) => {
    try {
      
      // Remove from notifications
      setAppointments(prev => prev.filter(a => a.id !== appointment.id));
      
      // Show success message
      toast.success("Appointment accepted!", {
        description: `${appointment.appointment.subject} - ${new Date(appointment.appointment.scheduledTime).toLocaleString()}`
      });

      // Show the video meeting link info
      toast.info("Video meeting link included!", {
        description: "You'll receive a reminder 10 minutes before the meeting",
        duration: 8000,
        action: {
          label: "Join Meeting",
          onClick: () => {
            meetingDb.openMeeting(
              appointment.appointment.videoMeeting.meetingUrl,
              appointment.appointment.videoMeeting.roomId
            );
          }
        }
      });

      // Here you would typically save the appointment to the database
      // await appointmentDb.acceptAppointment(appointment.appointment);

    } catch (error) {
      toast.error("Failed to accept appointment");
    }
  };

  const handleDeclineAppointment = (appointment) => {
    try {
      
      // Remove from notifications
      setAppointments(prev => prev.filter(a => a.id !== appointment.id));
      
      toast.info("Appointment declined");
      
      // Here you would typically notify the teacher
      // await appointmentDb.declineAppointment(appointment.appointment);

    } catch (error) {
      toast.error("Failed to decline appointment");
    }
  };

  if (appointments.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">Appointment Invitation</h4>
              <p className="text-sm text-gray-600">From: {appointment.sender.name}</p>
            </div>
            <button
              onClick={() => handleDeclineAppointment(appointment)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="font-medium text-gray-800">{appointment.appointment.subject}</p>
            
            {appointment.appointment.description && (
              <p className="text-sm text-gray-600">{appointment.appointment.description}</p>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{new Date(appointment.appointment.scheduledTime).toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Video className="w-4 h-4" />
              <span>Video meeting included</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleAcceptAppointment(appointment)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            
            <Button
              onClick={() => handleDeclineAppointment(appointment)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}