// Meeting Summary Service using Google Gemini AI
import aiService from './ai.service.js';
import MeetingSummary from '../models/meetingSummary.model.js';
import sendEmail from '../utility/sendEmail.js';

class MeetingSummaryService {
  // Generate AI summary from meeting data
  async generateSummary(meetingData) {
    try {
      console.log('🤖 Generating AI summary...');
      console.log('   Meeting subject:', meetingData.subject);
      console.log('   Duration:', meetingData.duration, 'minutes');
      console.log('   Chat messages:', meetingData.chatMessages?.length || 0);
      
      // Build prompt for AI
      const prompt = this.buildSummaryPrompt(meetingData);
      
      console.log('📝 Prompt built, sending to AI service...');
      
      // Get AI response WITHOUT system context (for summary generation)
      const aiResponse = await aiService.getResponse(prompt, [], {
        useSystemContext: false,  // Don't use chatbot system context
        temperature: 0.5,          // Lower temperature for more consistent formatting
        maxOutputTokens: 2000,     // Higher limit for detailed summaries
        topP: 0.9,
        topK: 40
      });
      
      console.log('✅ AI response received, length:', aiResponse?.length || 0);
      
      // Parse AI response into structured format
      const parsedSummary = this.parseAIResponse(aiResponse);
      
      console.log('✅ AI summary parsed successfully');
      console.log('   Summary length:', parsedSummary.summary?.length || 0);
      console.log('   Key topics:', parsedSummary.keyTopics?.length || 0);
      console.log('   Important points:', parsedSummary.importantPoints?.length || 0);
      
      return parsedSummary;
    } catch (error) {
      console.error('❌ Error generating AI summary:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  // Build comprehensive prompt for AI
  buildSummaryPrompt(meetingData) {
    const { duration, chatMessages, whiteboardContent, participants, teacher, subject } = meetingData;
    
    let prompt = `You are an educational assistant. Generate a comprehensive summary of an online class.\n\n`;
    
    prompt += `CLASS INFORMATION:\n`;
    prompt += `- Subject: ${subject || 'General'}\n`;
    prompt += `- Duration: ${duration} minutes\n`;
    prompt += `- Teacher: ${teacher}\n`;
    prompt += `- Number of Students: ${participants?.length || 1}\n\n`;
    
    if (chatMessages && chatMessages.length > 0) {
      prompt += `CHAT MESSAGES (${chatMessages.length} messages):\n`;
      chatMessages.slice(0, 20).forEach(msg => {  // Limit to first 20 messages
        prompt += `- ${msg.sender}: ${msg.message}\n`;
      });
      prompt += `\n`;
    }
    
    if (whiteboardContent) {
      prompt += `WHITEBOARD CONTENT:\n${whiteboardContent}\n\n`;
    }
    
    prompt += `Please provide a structured summary in EXACTLY this format:\n\n`;
    prompt += `1. Summary:\n`;
    prompt += `[Write 2-3 sentences summarizing the class]\n\n`;
    
    prompt += `2. Key Topics:\n`;
    prompt += `- [Topic 1]\n`;
    prompt += `- [Topic 2]\n`;
    prompt += `- [Topic 3]\n\n`;
    
    prompt += `3. Important Points:\n`;
    prompt += `- [Point 1]\n`;
    prompt += `- [Point 2]\n`;
    prompt += `- [Point 3]\n\n`;
    
    prompt += `4. Discussion Highlights:\n`;
    prompt += `- [Highlight 1]\n`;
    prompt += `- [Highlight 2]\n\n`;
    
    prompt += `5. Action Items:\n`;
    prompt += `- [Task 1]\n`;
    prompt += `- [Task 2]\n\n`;
    
    prompt += `6. Recommendations:\n`;
    prompt += `- [Recommendation 1]\n`;
    prompt += `- [Recommendation 2]\n\n`;
    
    prompt += `IMPORTANT: Follow the exact format above with numbered sections and bullet points. Be specific and educational.`;
    
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
      console.log('📋 Parsing AI response...');
      console.log('   Response length:', aiResponse?.length || 0);
      console.log('   First 200 chars:', aiResponse?.substring(0, 200));
      
      // More flexible parsing - split by common section markers
      const lines = aiResponse.split('\n');
      let currentSection = '';
      let summaryText = '';
      
      lines.forEach(line => {
        const trimmed = line.trim();
        const lowerLine = trimmed.toLowerCase();
        
        // Detect section headers (more flexible matching)
        if (lowerLine.match(/^(1\.|#|\*\*)?.*summary/i) || lowerLine.includes('overview')) {
          currentSection = 'summary';
          console.log('   Found section: summary');
        } else if (lowerLine.match(/^(2\.|#|\*\*)?.*key topics?/i) || lowerLine.includes('topics covered')) {
          currentSection = 'keyTopics';
          console.log('   Found section: keyTopics');
        } else if (lowerLine.match(/^(3\.|#|\*\*)?.*important points?/i) || lowerLine.includes('key points') || lowerLine.includes('main points')) {
          currentSection = 'importantPoints';
          console.log('   Found section: importantPoints');
        } else if (lowerLine.match(/^(4\.|#|\*\*)?.*discussion/i) || lowerLine.includes('highlights')) {
          currentSection = 'discussionHighlights';
          console.log('   Found section: discussionHighlights');
        } else if (lowerLine.match(/^(5\.|#|\*\*)?.*action items?/i) || lowerLine.includes('homework') || lowerLine.includes('tasks')) {
          currentSection = 'actionItems';
          console.log('   Found section: actionItems');
        } else if (lowerLine.match(/^(6\.|#|\*\*)?.*recommendations?/i) || lowerLine.includes('next steps') || lowerLine.includes('suggestions')) {
          currentSection = 'recommendations';
          console.log('   Found section: recommendations');
        } else if (trimmed && currentSection) {
          // Extract content - handle various bullet formats
          let cleaned = trimmed
            .replace(/^[-*•●○]\s*/, '')  // Remove bullet points
            .replace(/^\d+\.\s*/, '')     // Remove numbered lists
            .replace(/^\*\*|\*\*$/g, '')  // Remove bold markers
            .trim();
          
          // Skip section headers and empty lines
          if (cleaned && !cleaned.match(/^(summary|key topics?|important points?|discussion|action items?|recommendations?):?$/i)) {
            if (currentSection === 'summary') {
              summaryText += cleaned + ' ';
            } else if (Array.isArray(summary[currentSection])) {
              summary[currentSection].push(cleaned);
            }
          }
        }
      });
      
      // Set summary text
      summary.summary = summaryText.trim();
      
      // Fallback: if parsing failed completely, use entire response as summary
      if (!summary.summary && aiResponse) {
        console.log('⚠️ Parsing failed, using entire response as summary');
        summary.summary = aiResponse.substring(0, 1000);
        
        // Try to extract at least some bullet points
        const bulletPoints = aiResponse.match(/[-*•●]\s*(.+)/g);
        if (bulletPoints && bulletPoints.length > 0) {
          summary.keyTopics = bulletPoints.slice(0, 5).map(bp => bp.replace(/^[-*•●]\s*/, '').trim());
        }
      }
      
      console.log('✅ Parsing complete:');
      console.log('   Summary length:', summary.summary?.length || 0);
      console.log('   Key topics:', summary.keyTopics?.length || 0);
      console.log('   Important points:', summary.importantPoints?.length || 0);
      console.log('   Action items:', summary.actionItems?.length || 0);
      
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      summary.summary = aiResponse || 'Failed to generate summary';
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

      console.log('📧 Preparing to send summary emails...');
      console.log('   Summary ID:', summaryId);
      console.log('   Teacher:', summary.teacher?.fullName, summary.teacher?.email);
      console.log('   Students:', summary.students?.map(s => `${s.fullName} (${s.email})`).join(', '));
      
      // Build email content
      const emailContent = this.buildEmailContent(summary);
      
      let emailsSent = 0;
      let emailsFailed = 0;
      
      // Send to teacher
      if (summary.teacher && summary.teacher.email) {
        try {
          await sendEmail({
            to: summary.teacher.email,
            subject: `Class Summary: ${summary.meeting?.topic || 'Online Class'}`,
            html: emailContent
          });
          console.log('✅ Email sent to teacher:', summary.teacher.email);
          emailsSent++;
        } catch (error) {
          console.error('❌ Failed to send email to teacher:', summary.teacher.email);
          console.error('   Error:', error.message);
          emailsFailed++;
        }
      } else {
        console.warn('⚠️ Teacher email not found or invalid');
      }
      
      // Send to students
      if (summary.students && summary.students.length > 0) {
        for (const student of summary.students) {
          if (student && student.email) {
            try {
              await sendEmail({
                to: student.email,
                subject: `Class Summary: ${summary.meeting?.topic || 'Online Class'}`,
                html: emailContent
              });
              console.log('✅ Email sent to student:', student.email);
              emailsSent++;
            } catch (error) {
              console.error('❌ Failed to send email to student:', student.email);
              console.error('   Error:', error.message);
              emailsFailed++;
            }
          } else {
            console.warn('⚠️ Student email not found or invalid:', student);
          }
        }
      } else {
        console.warn('⚠️ No students found for this summary');
      }
      
      console.log(`📊 Email sending complete: ${emailsSent} sent, ${emailsFailed} failed`);
      
      // Mark as sent only if at least one email was sent successfully
      if (emailsSent > 0) {
        summary.emailSent = true;
        summary.emailSentAt = new Date();
        await summary.save();
        console.log('✅ Summary marked as email sent');
      } else {
        console.error('❌ No emails were sent successfully');
        throw new Error(`Failed to send any emails. ${emailsFailed} attempts failed.`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error in sendSummaryEmail:', error.message);
      console.error('   Stack:', error.stack);
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
