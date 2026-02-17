// Chatbot Routes
import express from 'express';
import { getChatbotResponse, clearChatHistory, getChatbotStatus } from '../controllers/chatbot.controller.js';

const router = express.Router();

// Get chatbot response
router.post('/message', getChatbotResponse);

// Clear chat history
router.post('/clear', clearChatHistory);

// Check chatbot status
router.get('/status', getChatbotStatus);

export default router;
