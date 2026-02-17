// Simple chatbot engine using pattern matching
import chatbotData from './chatbotData.json';

class ChatbotEngine {
  constructor() {
    this.intents = chatbotData.intents;
    this.faq = chatbotData.faq;
  }

  // Normalize text for better matching
  normalizeText(text) {
    return text.toLowerCase().trim();
  }

  // Calculate similarity score between two strings
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    let matches = 0;

    words1.forEach(word => {
      if (words2.includes(word) && word.length > 2) {
        matches++;
      }
    });

    return matches / Math.max(words1.length, words2.length);
  }

  // Find best matching intent
  findIntent(userMessage) {
    const normalizedMessage = this.normalizeText(userMessage);
    let bestMatch = null;
    let bestScore = 0;

    this.intents.forEach(intent => {
      intent.patterns.forEach(pattern => {
        const normalizedPattern = this.normalizeText(pattern);
        const score = this.calculateSimilarity(normalizedMessage, normalizedPattern);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = intent;
        }
      });
    });

    // Require at least 30% match
    return bestScore > 0.3 ? bestMatch : null;
  }

  // Find best matching FAQ
  findFAQ(userMessage) {
    const normalizedMessage = this.normalizeText(userMessage);
    let bestMatch = null;
    let bestScore = 0;

    this.faq.forEach(item => {
      const normalizedQuestion = this.normalizeText(item.question);
      const score = this.calculateSimilarity(normalizedMessage, normalizedQuestion);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    // Require at least 40% match for FAQ
    return bestScore > 0.4 ? bestMatch : null;
  }

  // Get response for user message
  getResponse(userMessage) {
    // First try to find matching intent
    const intent = this.findIntent(userMessage);
    if (intent) {
      // Return random response from intent
      const responses = intent.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Try FAQ if no intent matched
    const faq = this.findFAQ(userMessage);
    if (faq) {
      return faq.answer;
    }

    // Default fallback response
    return "I'm not sure I understand. Could you rephrase that? You can also contact support at support@sikshamantra.com for more help.";
  }

  // Get suggested questions
  getSuggestions() {
    return [
      "How do I register as a student?",
      "How to upload courses?",
      "How do meetings work?",
      "What is Siksha Mantra?",
      "How to post a request?",
    ];
  }
}

export default new ChatbotEngine();
