// Chatbot Controller
import aiService from '../services/ai.service.js';

// Store conversation history in memory (in production, use Redis or database)
const conversationHistory = new Map();

// Maximum messages to keep in history
const MAX_HISTORY = 10;

export const getChatbotResponse = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get or create conversation history for this session
    const history = conversationHistory.get(sessionId) || [];

    // Get AI response
    const response = await aiService.getResponse(message, history);

    // Update conversation history
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    // Keep only last MAX_HISTORY messages
    if (history.length > MAX_HISTORY * 2) {
      history.splice(0, history.length - MAX_HISTORY * 2);
    }

    conversationHistory.set(sessionId, history);

    res.status(200).json({
      success: true,
      data: {
        response,
        sessionId
      }
    });
  } catch (error) {
    console.error('Chatbot Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chatbot response',
      error: error.message
    });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      conversationHistory.delete(sessionId);
    }

    res.status(200).json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('Clear History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
};

export const getChatbotStatus = async (req, res) => {
  try {
    const isConfigured = aiService.isConfigured();
    const provider = process.env.AI_PROVIDER || 'gemini';

    res.status(200).json({
      success: true,
      data: {
        configured: isConfigured,
        provider: provider,
        available: isConfigured
      }
    });
  } catch (error) {
    console.error('Status Check Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check chatbot status'
    });
  }
};
