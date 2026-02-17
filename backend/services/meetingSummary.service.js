// Meeting Summary Service using Google Gemini AI
import aiService from './ai.service.js';
import MeetingSummary from '../models/meetingSummary.model.js';
import sendEmail from '../utility/sendEmail.js';

class MeetingSummaryService {
  // Generate AI summary from meeting data
  async generateSummary(meetingData) {
    try {
      // Build prompt for AI
      const prompt = this.buildSummaryPrompt(meetingData);
      
      // Get AI response
      const aiResponse = await aiService.getResponse(prompt);
      
      // Parse AI response into structured format
      const parsedSummary = this.parseAIResponse(aiResponse);
      
      return parsedSummary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw error;
    }
  }

  // Build comprehensive prompt for AI
  buildSummaryPrompt(meetingData) {
    const { duration, chatMessages, whiteboardContent, participants, teacher, subject } = meetingData;
    
    let prompt = `Generate a comprehensive summary of an online class with the following details:\n\n`;
    
    prompt += `**Class Information:**\n`;
    prompt += `- Duration: ${duration} minutes\n`;
    prompt += `- Teacher: ${teacher}\n`;
    prompt += `- Number of Students: ${participants.length}\n`;
    if (subject) prompt += `- Subject: ${subject}\n`;
    prompt += `\n`;
    
    if (chatMessages && chatMessages.length > 0) {
      prompt += `**Chat Messages (${chatMessages.length} messages):**\n`;
      chatMessages.forEach(msg => {
        prompt += `- ${msg.sender}: ${msg.message}\n`;
      });
      prompt += `\n`;
    }
    
    if (whiteboardContent) {
      prompt += `**Whiteboard Content:**\n${whiteboardContent}\n\n`;
    }
    
    prompt += `Please provide a structured summary in the following format:\n\n`;
    prompt += `1. **Summary**: Brief overview of the class (2-3 sentences)\n`;
    prompt += `2. **Key Topics**: List 3-5 main topics covered\n`;
    prompt += `3. **Important Points**: List 5-7 key learning points\n`;
    prompt += `4. **Discussion Highlights**: Notable questions or discussions\n`;
    prompt += `5. **Action Items**: Homework or tasks for students\n`;
    prompt += `6. **Recommendations**: Study tips or next steps\n\n`;
    prompt += `Format the response clearly with bullet points and sections.`;
    
    return prompt;
  }

  // Parse AI response into structured format
  parseAIResponse(aiResponse) {
    const summary = {
      summary: '',
      keyTopics: [],
      importantPoints: [],
      actionItems: [],
      discussionHighlights: [],
      recommendations: []
    };

    try {
      // Split response into sections
      const sections = aiResponse.split(/\*\*|\n\n/);
      
      let currentSection = '';
      
      sections.forEach(section => {
        const trimmed = section.trim();
        
        if (trimmed.toLowerCase().includes('summary:')) {
          currentSection = 'summary';
        } else if (trimmed.toLowerCase().includes('key topics')) {
          currentSection = 'keyTopics';
        } else if (trimmed.toLowerCase().includes('important points')) {
          currentSection = 'importantPoints';
        } else if (trimmed.toLowerCase().includes('discussion')) {
          currentSection = 'discussionHighlights';
        } else if (trimmed.toLowerCase().includes('action items')) {
          currentSection = 'actionItems';
        } else if (trimmed.toLowerCase().includes('recommendations')) {
          currentSection = 'recommendations';
        } else if (trimmed && currentSection) {
          // Extract bullet points
          const lines = trimmed.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            const cleaned = line.replace(/^[-*•]\s*/, '').trim();
            if (cleaned) {
              if (currentSection === 'summary') {
                summary.summary += cleaned + ' ';
              } else if (Array.isArray(summary[currentSection])) {
                summary[currentSection].push(cleaned);
              }
            }
          });
        }
      });
      
      // Fallback: if parsing failed, use entire response as summary
      if (!summary.summary && aiResponse) {
        summary.summary = aiResponse.substring(0, 500);
      }
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      summary.summary = aiResponse;
    }
    
    return summary;
  }

  // Create and save meeting summary
  async createMeetingSummary(meetingId, meetingData) {
    try {
      // Generate AI summary
      const aiSummary = await this.generateSummary(meetingData);
      
      // Create summary document
      const summary = await MeetingSummary.create({
        meeting: meetingId,
        teacher: meetingData.teacherId,
        students: meetingData.studentIds || [],
        meetingData: {
          startTime: meetingData.startTime,
          endTime: meetingData.endTime,
          duration: meetingData.duration,
          chatMessages: meetingData.chatMessages || [],
          whiteboardContent: meetingData.whiteboardContent || '',
          participants: meetingData.participants || []
        },
        aiSummary: aiSummary
      });
      
      return summary;
    } catch (error) {
      console.error('Error creating meeting summary:', error);
      throw error;
    }
  }

  // Send summary email to participants
  async sendSummaryEmail(summaryId) {
    try {
      const summary = await MeetingSummary.findById(summaryId)
        .populate('teacher', 'fullName email')
        .populate('students', 'fullName email')
        .populate('meeting', 'topic');
      
      if (!summary) {
        throw new Error('Summary not found');
      }
      
      // Build email content
      const emailContent = this.buildEmailContent(summary);
      
      // Send to teacher
      if (summary.teacher && summary.teacher.email) {
        await sendEmail({
          to: summary.teacher.email,
          subject: `Class Summary: ${summary.meeting?.topic || 'Online Class'}`,
          html: emailContent
        });
      }
      
      // Send to students
      if (summary.students && summary.students.length > 0) {
        for (const student of summary.students) {
          if (student && student.email) {
            await sendEmail({
              to: student.email,
              subject: `Class Summary: ${summary.meeting?.topic || 'Online Class'}`,
              html: emailContent
            });
          }
        }
      }
      
      // Mark as sent
      summary.emailSent = true;
      summary.emailSentAt = new Date();
      await summary.save();
      
      return true;
    } catch (error) {
      console.error('Error sending summary email:', error);
      throw error;
    }
  }

  // Build HTML email content
  buildEmailContent(summary) {
    const { aiSummary, meetingData, meeting, teacher } = summary;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .section-title { color: #667eea; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .badge { display: inline-block; padding: 5px 10px; background: #667eea; color: white; border-radius: 5px; font-size: 12px; margin-right: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📚 Class Summary</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${meeting?.topic || 'Online Class'}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">📊 Class Information</div>
              <p><strong>Teacher:</strong> ${teacher?.fullName || 'N/A'}</p>
              <p><strong>Duration:</strong> ${meetingData.duration} minutes</p>
              <p><strong>Date:</strong> ${new Date(meetingData.startTime).toLocaleDateString()}</p>
              <p><strong>Participants:</strong> ${meetingData.participants.length} students</p>
            </div>
            
            <div class="section">
              <div class="section-title">📝 Summary</div>
              <p>${aiSummary.summary || 'No summary available'}</p>
            </div>
    `;
    
    if (aiSummary.keyTopics && aiSummary.keyTopics.length > 0) {
      html += `
            <div class="section">
              <div class="section-title">🎯 Key Topics Covered</div>
              <ul>
                ${aiSummary.keyTopics.map(topic => `<li>${topic}</li>`).join('')}
              </ul>
            </div>
      `;
    }
    
    if (aiSummary.importantPoints && aiSummary.importantPoints.length > 0) {
      html += `
            <div class="section">
              <div class="section-title">💡 Important Points</div>
              <ul>
                ${aiSummary.importantPoints.map(point => `<li>${point}</li>`).join('')}
              </ul>
            </div>
      `;
    }
    
    if (aiSummary.discussionHighlights && aiSummary.discussionHighlights.length > 0) {
      html += `
            <div class="section">
              <div class="section-title">💬 Discussion Highlights</div>
              <ul>
                ${aiSummary.discussionHighlights.map(highlight => `<li>${highlight}</li>`).join('')}
              </ul>
            </div>
      `;
    }
    
    if (aiSummary.actionItems && aiSummary.actionItems.length > 0) {
      html += `
            <div class="section">
              <div class="section-title">✅ Action Items</div>
              <ul>
                ${aiSummary.actionItems.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
      `;
    }
    
    if (aiSummary.recommendations && aiSummary.recommendations.length > 0) {
      html += `
            <div class="section">
              <div class="section-title">🎓 Recommendations</div>
              <ul>
                ${aiSummary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
      `;
    }
    
    html += `
          </div>
          
          <div class="footer">
            <p>This summary was automatically generated by Siksha Mantra AI</p>
            <p>© ${new Date().getFullYear()} Siksha Mantra. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  // Get summaries for a user
  async getUserSummaries(userId, role) {
    try {
      const query = role === 'teacher' 
        ? { teacher: userId }
        : { students: userId };
      
      const summaries = await MeetingSummary.find(query)
        .populate('teacher', 'fullName email')
        .populate('students', 'fullName email')
        .populate('meeting', 'topic')
        .sort({ createdAt: -1 })
        .limit(50);
      
      return summaries;
    } catch (error) {
      console.error('Error getting user summaries:', error);
      throw error;
    }
  }
}

export default new MeetingSummaryService();
