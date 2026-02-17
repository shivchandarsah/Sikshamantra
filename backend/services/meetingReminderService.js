import { Meeting } from "../models/meeting.model.js";

class MeetingReminderService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start the reminder service
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Check for reminders every minute
    this.intervalId = setInterval(() => {
      this.checkForReminders();
    }, 60 * 1000); // 1 minute

    // Run initial check
    this.checkForReminders();
  }

  /**
   * Stop the reminder service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Check for meetings that need reminders at different intervals
   */
  async checkForReminders() {
    try {
      const now = new Date();
      
      // Check for 15-minute reminders
      await this.checkFifteenMinuteReminders(now);
      
      // Check for 10-minute reminders
      await this.checkTenMinuteReminders(now);
      
      // Check for 5-minute reminders
      await this.checkFiveMinuteReminders(now);
      
      // Check for 2-minute reminders
      await this.checkTwoMinuteReminders(now);
      
    } catch (error) {
      console.error('❌ Error checking for meeting reminders:', error);
    }
  }

  /**
   * Check for 15-minute reminders
   */
  async checkFifteenMinuteReminders(now) {
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const sixteenMinutesFromNow = new Date(now.getTime() + 16 * 60 * 1000);
    
    const meetings = await Meeting.find({
      scheduledTime: {
        $gte: fifteenMinutesFromNow,
        $lte: sixteenMinutesFromNow
      },
      'reminders.fifteenMinute.sent': false,
      status: 'scheduled'
    })
    .populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'teacherId', select: 'fullName email' }
    ]);

    if (meetings.length > 0) {
      
      for (const meeting of meetings) {
        await this.sendMeetingReminder(meeting, '15-minute', 15);
        
        // Mark 15-minute reminder as sent
        await Meeting.findByIdAndUpdate(meeting._id, {
          'reminders.fifteenMinute.sent': true,
          'reminders.fifteenMinute.sentAt': new Date()
        });
      }
    }
  }

  /**
   * Check for 10-minute reminders
   */
  async checkTenMinuteReminders(now) {
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const elevenMinutesFromNow = new Date(now.getTime() + 11 * 60 * 1000);
    
    const meetings = await Meeting.find({
      scheduledTime: {
        $gte: tenMinutesFromNow,
        $lte: elevenMinutesFromNow
      },
      'reminders.tenMinute.sent': false,
      status: 'scheduled'
    })
    .populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'teacherId', select: 'fullName email' }
    ]);

    if (meetings.length > 0) {
      
      for (const meeting of meetings) {
        await this.sendMeetingReminder(meeting, '10-minute', 10);
        
        // Mark 10-minute reminder as sent
        await Meeting.findByIdAndUpdate(meeting._id, {
          'reminders.tenMinute.sent': true,
          'reminders.tenMinute.sentAt': new Date()
        });
      }
    }
  }

  /**
   * Check for 5-minute reminders
   */
  async checkFiveMinuteReminders(now) {
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);
    
    const meetings = await Meeting.find({
      scheduledTime: {
        $gte: fiveMinutesFromNow,
        $lte: sixMinutesFromNow
      },
      'reminders.fiveMinute.sent': false,
      status: 'scheduled'
    })
    .populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'teacherId', select: 'fullName email' }
    ]);

    if (meetings.length > 0) {
      
      for (const meeting of meetings) {
        await this.sendMeetingReminder(meeting, '5-minute', 5);
        
        // Mark 5-minute reminder as sent
        await Meeting.findByIdAndUpdate(meeting._id, {
          'reminders.fiveMinute.sent': true,
          'reminders.fiveMinute.sentAt': new Date()
        });
      }
    }
  }

  /**
   * Check for 2-minute reminders
   */
  async checkTwoMinuteReminders(now) {
    const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);
    const threeMinutesFromNow = new Date(now.getTime() + 3 * 60 * 1000);
    
    const meetings = await Meeting.find({
      scheduledTime: {
        $gte: twoMinutesFromNow,
        $lte: threeMinutesFromNow
      },
      'reminders.twoMinute.sent': false,
      status: 'scheduled'
    })
    .populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'teacherId', select: 'fullName email' }
    ]);

    if (meetings.length > 0) {
      
      for (const meeting of meetings) {
        await this.sendMeetingReminder(meeting, '2-minute', 2);
        
        // Mark 2-minute reminder as sent
        await Meeting.findByIdAndUpdate(meeting._id, {
          'reminders.twoMinute.sent': true,
          'reminders.twoMinute.sentAt': new Date()
        });
      }
    }
  }

  /**
   * Send reminder for a specific meeting
   */
  async sendMeetingReminder(meeting, reminderType, minutesUntilMeeting) {
    try {
      // Import Notification model dynamically to avoid circular dependencies
      const { Notification } = await import("../models/notification.model.js");
      
      const reminderData = {
        type: 'meeting_reminder',
        reminderStage: reminderType,
        meetingId: meeting._id,
        roomId: meeting.roomId,
        meetingUrl: meeting.meetingUrl,
        subject: meeting.subject,
        scheduledTime: meeting.scheduledTime,
        student: {
          id: meeting.studentId._id,
          name: meeting.studentId.fullName,
          email: meeting.studentId.email
        },
        teacher: {
          id: meeting.teacherId._id,
          name: meeting.teacherId.fullName,
          email: meeting.teacherId.email
        },
        minutesUntilMeeting,
        isUrgent: minutesUntilMeeting <= 2 // Mark 2-minute and 5-minute reminders as urgent
      };

      // Create database notifications for both participants
      try {
        // Notification for student
        await Notification.create({
          recipient: meeting.studentId._id,
          sender: meeting.teacherId._id,
          type: "meeting",
          title: `Meeting Reminder - ${minutesUntilMeeting} minutes`,
          message: `Your meeting "${meeting.subject}" with ${meeting.teacherId.fullName} starts in ${minutesUntilMeeting} minutes!`,
          data: {
            meetingId: meeting._id,
            roomId: meeting.roomId,
            meetingUrl: meeting.meetingUrl,
            subject: meeting.subject,
            scheduledTime: meeting.scheduledTime,
            minutesUntilMeeting
          },
          actionUrl: '/meetings'
        });

        // Notification for teacher
        await Notification.create({
          recipient: meeting.teacherId._id,
          sender: meeting.studentId._id,
          type: "meeting",
          title: `Meeting Reminder - ${minutesUntilMeeting} minutes`,
          message: `Your meeting "${meeting.subject}" with ${meeting.studentId.fullName} starts in ${minutesUntilMeeting} minutes!`,
          data: {
            meetingId: meeting._id,
            roomId: meeting.roomId,
            meetingUrl: meeting.meetingUrl,
            subject: meeting.subject,
            scheduledTime: meeting.scheduledTime,
            minutesUntilMeeting
          },
          actionUrl: '/meetings'
        });

        console.log(`✅ Created database notifications for ${reminderType} reminder - Meeting: ${meeting.roomId}`);
      } catch (notificationError) {
        console.error(`❌ Error creating database notifications for ${reminderType}:`, notificationError);
      }

      // Send WebSocket notification to both participants
      if (global.io) {
        // Send to student
        global.io.to(meeting.studentId._id.toString()).emit('meetingReminder', {
          ...reminderData,
          recipientRole: 'student'
        });
        
        // Send to teacher
        global.io.to(meeting.teacherId._id.toString()).emit('meetingReminder', {
          ...reminderData,
          recipientRole: 'teacher'
        });
        
        console.log(`✅ Sent ${reminderType} reminder via WebSocket - Meeting: ${meeting.roomId}`);
      }
      
    } catch (error) {
      console.error(`❌ Error sending ${reminderType} reminder for meeting ${meeting.roomId}:`, error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    };
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats() {
    try {
      const stats = await Meeting.aggregate([
        {
          $match: {
            status: 'scheduled',
            scheduledTime: { $gte: new Date() }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            fifteenMinuteSent: {
              $sum: { $cond: ['$reminders.fifteenMinute.sent', 1, 0] }
            },
            tenMinuteSent: {
              $sum: { $cond: ['$reminders.tenMinute.sent', 1, 0] }
            },
            fiveMinuteSent: {
              $sum: { $cond: ['$reminders.fiveMinute.sent', 1, 0] }
            },
            twoMinuteSent: {
              $sum: { $cond: ['$reminders.twoMinute.sent', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        total: 0,
        fifteenMinuteSent: 0,
        tenMinuteSent: 0,
        fiveMinuteSent: 0,
        twoMinuteSent: 0
      };
    } catch (error) {
      console.error('❌ Error getting reminder stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const meetingReminderService = new MeetingReminderService();

export default meetingReminderService;