import { useState, useEffect } from "react";
import { Bell, Video, Clock, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";

export default function SimpleMeetingReminder() {
  const { meetingDb } = useMyContext();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    // Listen for meeting reminders
    const handleMeetingReminder = (reminder) => {
      
      // Add to reminders list
      setReminders(prev => [...prev, {
        ...reminder,
        id: `${reminder.meetingId}-${reminder.reminderStage}-${Date.now()}`
      }]);

      // Show toast notification with different styles based on urgency
      const toastOptions = {
        duration: reminder.isUrgent ? 15000 : 10000, // Longer duration for urgent reminders
        action: {
          label: "Join",
          onClick: () => {
            meetingDb.openMeeting(reminder.meetingUrl, reminder.roomId);
          }
        }
      };

      // Different toast styles based on reminder stage
      if (reminder.reminderStage === '15-minute') {
        toast.info(`Meeting in ${reminder.minutesUntilMeeting} minutes`, {
          description: `${reminder.subject} - First reminder`,
          ...toastOptions
        });
      } else if (reminder.reminderStage === '10-minute') {
        toast.warning(`Meeting in ${reminder.minutesUntilMeeting} minutes`, {
          description: `${reminder.subject} - Second reminder`,
          ...toastOptions
        });
      } else if (reminder.reminderStage === '5-minute') {
        toast.error(`Meeting starting soon! ${reminder.minutesUntilMeeting} minutes`, {
          description: `${reminder.subject} - Third reminder`,
          ...toastOptions
        });
      } else if (reminder.reminderStage === '2-minute') {
        toast.error(`Meeting starting NOW! ${reminder.minutesUntilMeeting} minutes`, {
          description: `${reminder.subject} - FINAL REMINDER!`,
          ...toastOptions
        });
      }

      // Play notification sound with different tones for different stages
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different reminder stages
        if (reminder.reminderStage === '15-minute') {
          oscillator.frequency.value = 600; // Lower tone for first reminder
        } else if (reminder.reminderStage === '10-minute') {
          oscillator.frequency.value = 800; // Medium tone for second reminder
        } else if (reminder.reminderStage === '5-minute') {
          oscillator.frequency.value = 1000; // Higher tone for third reminder
        } else if (reminder.reminderStage === '2-minute') {
          oscillator.frequency.value = 1200; // Highest tone for final reminder
        }
        
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // For urgent reminders, play multiple beeps
        if (reminder.isUrgent) {
          setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.value = 1000;
            oscillator2.type = 'sine';
            gainNode2.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.3);
          }, 600);
        }
      } catch (error) {
        // Ignore audio errors
      }
    };

    // Set up WebSocket listener
    if (meetingDb && meetingDb.onMeetingReminder) {
      meetingDb.onMeetingReminder(handleMeetingReminder);
    }

    return () => {
      // Cleanup handled by the service
    };
  }, [meetingDb]);

  const handleJoinMeeting = (reminder) => {
    try {
      meetingDb.openMeeting(reminder.meetingUrl, reminder.roomId);
      setReminders(prev => prev.filter(r => r.id !== reminder.id));
      toast.success("Joining meeting...");
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error("Failed to join meeting");
    }
  };

  const handleDismissReminder = (reminder) => {
    setReminders(prev => prev.filter(r => r.id !== reminder.id));
  };

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {reminders.map((reminder) => {
        // Get reminder stage styling
        const getReminderStyle = (stage) => {
          switch (stage) {
            case '15-minute':
              return {
                bgColor: 'bg-blue-50 border-blue-200',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                icon: Bell
              };
            case '10-minute':
              return {
                bgColor: 'bg-yellow-50 border-yellow-200',
                iconBg: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
                icon: Clock
              };
            case '5-minute':
              return {
                bgColor: 'bg-orange-50 border-orange-200',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                icon: AlertTriangle
              };
            case '2-minute':
              return {
                bgColor: 'bg-red-50 border-red-200',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
                icon: AlertTriangle
              };
            default:
              return {
                bgColor: 'bg-gray-50 border-gray-200',
                iconBg: 'bg-gray-100',
                iconColor: 'text-gray-600',
                icon: Bell
              };
          }
        };

        const style = getReminderStyle(reminder.reminderStage);
        const IconComponent = style.icon;

        return (
          <div
            key={reminder.id}
            className={`${style.bgColor} border rounded-lg shadow-lg p-4 w-80 ${reminder.isUrgent ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {reminder.reminderStage === '15-minute' && 'Meeting Reminder (1/4)'}
                    {reminder.reminderStage === '10-minute' && 'Meeting Reminder (2/4)'}
                    {reminder.reminderStage === '5-minute' && 'Meeting Reminder (3/4)'}
                    {reminder.reminderStage === '2-minute' && 'FINAL REMINDER (4/4)'}
                  </h4>
                  <button
                    onClick={() => handleDismissReminder(reminder)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1 mb-3">
                  <p className="text-sm font-medium text-gray-700">{reminder.subject}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span className={reminder.isUrgent ? 'font-bold text-red-600' : ''}>
                      Starting in {reminder.minutesUntilMeeting} minutes
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    With {reminder.student.name} & {reminder.teacher.name}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleJoinMeeting(reminder)}
                    className={`flex-1 text-white ${
                      reminder.reminderStage === '2-minute'
                        ? 'bg-red-700 hover:bg-red-800 animate-pulse'
                        : reminder.isUrgent 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : reminder.reminderStage === '10-minute'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    size="sm"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    {reminder.reminderStage === '2-minute' ? 'JOIN NOW!' : reminder.isUrgent ? 'Join Now!' : 'Join'}
                  </Button>
                  
                  <Button
                    onClick={() => handleDismissReminder(reminder)}
                    variant="outline"
                    size="sm"
                    className="text-gray-600"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}