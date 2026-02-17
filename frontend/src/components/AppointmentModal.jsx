import { useState } from "react";
import { Calendar, Clock, Video, X, Send, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";
import ProfileAvatar from "./ProfileAvatar";

export default function AppointmentModal({ 
  isOpen, 
  onClose, 
  student, 
  onAppointmentSent 
}) {
  const { user, meetingDb, appointmentDb } = useMyContext();
  const [appointmentData, setAppointmentData] = useState({
    subject: "",
    description: "",
    scheduledDate: "",
    scheduledTime: "",
    price: "0"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!appointmentData.subject || !appointmentData.scheduledDate || !appointmentData.scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${appointmentData.scheduledDate}T${appointmentData.scheduledTime}`);
      
      // Check if the scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        toast.error("Please select a future date and time");
        setIsSubmitting(false);
        return;
      }

      // Validate user and student data
      if (!user || !user._id) {
        console.error('❌ User data missing:', user);
        toast.error("User authentication error. Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }

      if (!student || !student._id) {
        console.error('❌ Student data missing:', student);
        toast.error("Student information missing. Please try again.");
        setIsSubmitting(false);
        return;
      }

      console.log('📝 Generating meeting link with:', {
        studentId: student._id,
        teacherId: user._id,
        subject: appointmentData.subject,
        scheduledTime: scheduledDateTime.toISOString(),
        price: parseFloat(appointmentData.price) || 0
      });

      let meetingData = null;
      
      // Always generate video meeting link for appointments
      try {
        meetingData = await meetingDb.generateMeetingLink(
          student._id,
          user._id,
          appointmentData.subject,
          scheduledDateTime.toISOString(),
          parseFloat(appointmentData.price) || 0  // Add price parameter
        );
        
        console.log('✅ Meeting link generated:', meetingData);
      } catch (error) {
        console.error('❌ Error generating meeting link:', error);
        console.error('❌ Error response:', error.response?.data);
        const errorMessage = error.response?.data?.message || error.message || "Failed to generate video meeting link";
        toast.error(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Create appointment with video meeting details
      const appointmentPayload = {
        studentId: student._id,
        teacherId: user._id,
        subject: appointmentData.subject,
        description: appointmentData.description,
        scheduledTime: scheduledDateTime.toISOString(),
        status: 'pending',
        videoMeeting: {
          roomId: meetingData.roomId,
          meetingUrl: meetingData.meetingUrl,
          meetingId: meetingData._id
        }
      };

      // Send appointment invitation via WebSocket
      const socket = await import("@/utils/socket.js").then(m => m.getSocket());
      if (socket && socket.connected) {
        socket.emit('sendAppointmentInvitation', {
          type: 'appointment_invitation',
          recipientId: student._id,
          appointment: appointmentPayload,
          sender: {
            id: user._id,
            name: user.fullName,
            role: user.role
          },
          timestamp: new Date().toISOString()
        });
        
      }

      // Show success message
      toast.success("Appointment invitation with video meeting link sent!");
      
      // Call callback if provided
      if (onAppointmentSent) {
        onAppointmentSent(appointmentPayload);
      }

      // Reset form and close modal
      setAppointmentData({
        subject: "",
        description: "",
        scheduledDate: "",
        scheduledTime: "",
        price: "0"
      });
      onClose();

    } catch (error) {
      console.error('❌ Error sending appointment:', error);
      toast.error("Failed to send appointment invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Validate student data
  if (!student || !student._id) {
    console.error('❌ AppointmentModal: Invalid student data:', student);
    return (
      <div className="fixed inset-0 bg-gray-100/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">Student information is missing. Please try again.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get minimum time (current time if today is selected)
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const isToday = appointmentData.scheduledDate === today;

  return (
    <div className="fixed inset-0 bg-gray-100/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Send Appointment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Student Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <ProfileAvatar 
                user={student} 
                size="xs"
              />
              <span className="font-medium">Student: {student?.fullName}</span>
            </div>
            <div className="text-blue-600 text-sm mt-1">{student?.email}</div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={appointmentData.subject}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Math Tutoring Session"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={appointmentData.description}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows="3"
              placeholder="Additional details about the appointment..."
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={appointmentData.scheduledDate}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                min={today}
                required
              />
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="time"
                value={appointmentData.scheduledTime}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                min={isToday ? currentTime : undefined}
                required
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Fee (NPR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                NPR
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={appointmentData.price}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 for free meetings. Student pays after meeting completion.
            </p>
          </div>

          {/* Automatic Video Meeting Info */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-800">
              <Video className="w-4 h-4" />
              <span className="text-sm font-medium">Video Meeting Included</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              A Jitsi Meet link will be automatically generated for this appointment
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Appointment
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}