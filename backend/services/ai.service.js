// AI Service for Chatbot - Supports Google Gemini
import axios from 'axios';

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'gemini';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    console.log('🤖 AI Service initialized:');
    console.log('   Provider:', this.provider);
    console.log('   API Key:', this.geminiApiKey ? `${this.geminiApiKey.substring(0, 15)}...` : 'NOT SET');
    
    // System context about Siksha Mantra
    this.systemContext = `You are a helpful customer support assistant for Siksha Mantra, an educational platform that connects students and teachers.

Platform Features:
- Students can post learning requests
- Teachers can offer help and make offers
- Real-time video meetings with whiteboard and screen sharing
- Course material upload and download (max 10MB)
- Chat messaging between students and teachers
- Appointment scheduling and reminders
- Admin panel for platform management

Key Information:
- Registration: Students and teachers can register with email verification
- Login: Use registered email and password
- Courses: Teachers upload, students download (PDF, DOC, PPT, TXT)
- Meetings: Video calls with WebRTC, whiteboard, screen sharing
- Admin credentials: admin@sikshamantra.com / admin123456
- Support email: support@sikshamantra.com

Be helpful, concise, and friendly. Provide step-by-step instructions when needed.`;
  }

  // Get response from Google Gemini
  async getGeminiResponse(userMessage, conversationHistory = []) {
    try {
      if (!this.geminiApiKey || this.geminiApiKey === 'your_gemini_api_key_here') {
        throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env file');
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
      
      // Build conversation context
      let prompt = this.systemContext + '\n\n';
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += 'Previous conversation:\n';
        conversationHistory.forEach(msg => {
          prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        prompt += '\n';
      }
      
      prompt += `User: ${userMessage}\nAssistant:`;

      const response = await axios.post(url, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      });

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Main method to get AI response
  async getResponse(userMessage, conversationHistory = []) {
    try {
      return await this.getGeminiResponse(userMessage, conversationHistory);
    } catch (error) {
      console.error('AI Service Error:', error.message);
      // Fallback to basic response
      return "I'm having trouble connecting to the AI service right now. Please try again or contact support at support@sikshamantra.com";
    }
  }

  // Check if AI service is configured
  isConfigured() {
    return !!(this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key_here');
  }
}

// Don't instantiate immediately - let it be instantiated after dotenv loads
let instance = null;

export default {
  getInstance() {
    if (!instance) {
      instance = new AIService();
    }
    return instance;
  },
  // For backward compatibility, expose methods directly
  getResponse(...args) {
    return this.getInstance().getResponse(...args);
  },
  isConfigured() {
    return this.getInstance().isConfigured();
  }
};
