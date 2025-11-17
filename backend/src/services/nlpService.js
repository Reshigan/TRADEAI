const EventEmitter = require('events');

/**
 * Natural Language Processing Service
 * Provides text analysis, sentiment analysis, document processing, and chatbot integration
 */

class NLPService extends EventEmitter {
  constructor() {
    super();
    this.models = new Map();
    this.processors = new Map();
    this.documents = new Map();
    this.conversations = new Map();
    this.entities = new Map();
    this.sentimentCache = new Map();
    this.isInitialized = false;

    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing NLP Service...');

      // Initialize NLP models
      this.initializeModels();

      // Setup text processors
      this.setupTextProcessors();

      // Initialize entity recognition
      this.initializeEntityRecognition();

      // Setup chatbot capabilities
      this.setupChatbot();

      this.isInitialized = true;
      console.log('NLP Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NLP Service:', error);
    }
  }

  /**
   * Initialize NLP models
   */
  initializeModels() {
    const models = [
      {
        id: 'sentiment_analyzer',
        name: 'Sentiment Analysis Model',
        type: 'classification',
        description: 'Analyzes sentiment in text (positive, negative, neutral)',
        languages: ['en', 'es', 'fr', 'de'],
        accuracy: 0.89,
        categories: ['positive', 'negative', 'neutral'],
        confidence_threshold: 0.7
      },
      {
        id: 'emotion_detector',
        name: 'Emotion Detection Model',
        type: 'multi_classification',
        description: 'Detects emotions in text',
        languages: ['en'],
        accuracy: 0.82,
        categories: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'],
        confidence_threshold: 0.6
      },
      {
        id: 'intent_classifier',
        name: 'Intent Classification Model',
        type: 'classification',
        description: 'Classifies user intents in customer service contexts',
        languages: ['en'],
        accuracy: 0.91,
        categories: ['complaint', 'inquiry', 'compliment', 'request', 'support'],
        confidence_threshold: 0.8
      },
      {
        id: 'topic_modeler',
        name: 'Topic Modeling',
        type: 'unsupervised',
        description: 'Identifies topics in document collections',
        languages: ['en'],
        algorithm: 'LDA',
        num_topics: 10
      },
      {
        id: 'text_summarizer',
        name: 'Text Summarization Model',
        type: 'generation',
        description: 'Generates summaries of long texts',
        languages: ['en'],
        max_length: 150,
        min_length: 50
      },
      {
        id: 'language_detector',
        name: 'Language Detection Model',
        type: 'classification',
        description: 'Detects the language of input text',
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
        accuracy: 0.95
      }
    ];

    models.forEach((model) => {
      this.models.set(model.id, {
        ...model,
        status: 'loaded',
        lastUsed: null,
        usageCount: 0
      });
    });

    console.log('NLP models initialized:', models.length);
  }

  /**
   * Setup text processors
   */
  setupTextProcessors() {
    const processors = [
      {
        id: 'tokenizer',
        name: 'Text Tokenizer',
        description: 'Splits text into tokens (words, sentences, etc.)',
        operations: ['word_tokenize', 'sentence_tokenize', 'paragraph_tokenize']
      },
      {
        id: 'normalizer',
        name: 'Text Normalizer',
        description: 'Normalizes text (lowercase, remove punctuation, etc.)',
        operations: ['lowercase', 'remove_punctuation', 'remove_numbers', 'remove_stopwords']
      },
      {
        id: 'stemmer',
        name: 'Text Stemmer',
        description: 'Reduces words to their root form',
        algorithms: ['porter', 'snowball', 'lancaster']
      },
      {
        id: 'lemmatizer',
        name: 'Text Lemmatizer',
        description: 'Reduces words to their dictionary form',
        pos_tags: ['noun', 'verb', 'adjective', 'adverb']
      },
      {
        id: 'pos_tagger',
        name: 'Part-of-Speech Tagger',
        description: 'Tags words with their grammatical parts of speech',
        tagset: 'universal'
      },
      {
        id: 'ner_extractor',
        name: 'Named Entity Recognizer',
        description: 'Extracts named entities from text',
        entity_types: ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'MONEY', 'PRODUCT']
      }
    ];

    processors.forEach((processor) => {
      this.processors.set(processor.id, processor);
    });

    console.log('Text processors initialized:', processors.length);
  }

  /**
   * Initialize entity recognition
   */
  initializeEntityRecognition() {
    const entityTypes = [
      {
        type: 'PERSON',
        description: 'Person names',
        examples: ['John Smith', 'Mary Johnson', 'Dr. Brown'],
        patterns: [/\b[A-Z][a-z]+ [A-Z][a-z]+\b/]
      },
      {
        type: 'ORGANIZATION',
        description: 'Company and organization names',
        examples: ['Microsoft', 'United Nations', 'Harvard University'],
        patterns: [/\b[A-Z][a-z]+ (Inc|Corp|LLC|Ltd)\b/]
      },
      {
        type: 'LOCATION',
        description: 'Geographic locations',
        examples: ['New York', 'California', 'Europe'],
        patterns: [/\b[A-Z][a-z]+ (City|State|Country)\b/]
      },
      {
        type: 'DATE',
        description: 'Dates and times',
        examples: ['January 1, 2023', 'next week', 'tomorrow'],
        patterns: [/\b\d{1,2}\/\d{1,2}\/\d{4}\b/, /\b\d{4}-\d{2}-\d{2}\b/]
      },
      {
        type: 'MONEY',
        description: 'Monetary amounts',
        examples: ['$100', '€50', '¥1000'],
        patterns: [/\$\d+(?:,\d{3}){0,3}(?:\.\d{2})?/, /€\d+(?:,\d{3}){0,3}(?:\.\d{2})?/]
      },
      {
        type: 'PRODUCT',
        description: 'Product names',
        examples: ['iPhone', 'Tesla Model S', 'Windows 11'],
        patterns: [/\b[A-Z][a-z]+ \d+\b/]
      }
    ];

    entityTypes.forEach((entityType) => {
      this.entities.set(entityType.type, entityType);
    });

    console.log('Entity types initialized:', entityTypes.length);
  }

  /**
   * Setup chatbot capabilities
   */
  setupChatbot() {
    const intents = [
      {
        intent: 'greeting',
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        responses: [
          'Hello! How can I help you today?',
          'Hi there! What can I do for you?',
          'Greetings! How may I assist you?'
        ]
      },
      {
        intent: 'product_inquiry',
        patterns: ['tell me about', 'what is', 'product information', 'features'],
        responses: [
          'I\'d be happy to help you learn about our products. What specific product are you interested in?',
          'Our products offer various features. Which product would you like to know more about?'
        ]
      },
      {
        intent: 'pricing',
        patterns: ['price', 'cost', 'how much', 'pricing', 'expensive'],
        responses: [
          'I can help you with pricing information. Which product or service are you asking about?',
          'Our pricing varies by product and plan. What specific pricing information do you need?'
        ]
      },
      {
        intent: 'support',
        patterns: ['help', 'support', 'problem', 'issue', 'not working'],
        responses: [
          'I\'m here to help! Can you describe the issue you\'re experiencing?',
          'I\'d be happy to assist with your support request. What seems to be the problem?'
        ]
      },
      {
        intent: 'goodbye',
        patterns: ['bye', 'goodbye', 'see you', 'thanks', 'thank you'],
        responses: [
          'Goodbye! Have a great day!',
          'Thank you for contacting us. Have a wonderful day!',
          'It was my pleasure helping you. Take care!'
        ]
      }
    ];

    this.chatbotIntents = intents;
    console.log('Chatbot intents initialized:', intents.length);
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text, options = {}) {
    const analysisId = this.generateAnalysisId();

    // Check cache first
    const cacheKey = `sentiment_${this.hashText(text)}`;
    if (this.sentimentCache.has(cacheKey)) {
      return this.sentimentCache.get(cacheKey);
    }

    try {
      // Simulate sentiment analysis
      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = this.performSentimentAnalysis(text, options);

      // Cache result
      this.sentimentCache.set(cacheKey, result);

      // Update model usage
      const model = this.models.get('sentiment_analyzer');
      model.lastUsed = new Date();
      model.usageCount++;

      // Emit analysis event
      this.emit('sentiment_analyzed', {
        analysisId,
        sentiment: result.sentiment,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      throw error;
    }
  }

  /**
   * Perform sentiment analysis
   */
  performSentimentAnalysis(text, options) {
    // Simulate sentiment analysis logic
    const words = text.toLowerCase().split(/\s+/);

    // Simple sentiment scoring based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'poor'];

    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });

    // Add some randomness for more realistic results
    positiveScore += Math.random() * 2;
    negativeScore += Math.random() * 2;

    const totalScore = positiveScore + negativeScore;
    let sentiment, confidence;

    if (totalScore === 0) {
      sentiment = 'neutral';
      confidence = 0.5 + Math.random() * 0.3;
    } else if (positiveScore > negativeScore) {
      sentiment = 'positive';
      confidence = Math.min(0.95, 0.6 + (positiveScore / totalScore) * 0.4);
    } else {
      sentiment = 'negative';
      confidence = Math.min(0.95, 0.6 + (negativeScore / totalScore) * 0.4);
    }

    return {
      sentiment,
      confidence,
      scores: {
        positive: positiveScore / Math.max(1, words.length),
        negative: negativeScore / Math.max(1, words.length),
        neutral: 1 - (positiveScore + negativeScore) / Math.max(1, words.length)
      },
      wordCount: words.length,
      language: this.detectLanguage(text)
    };
  }

  /**
   * Detect emotions in text
   */
  async detectEmotions(text, options = {}) {
    try {
      // Simulate emotion detection
      await new Promise((resolve) => setTimeout(resolve, 300));

      const emotions = this.performEmotionDetection(text);

      // Update model usage
      const model = this.models.get('emotion_detector');
      model.lastUsed = new Date();
      model.usageCount++;

      return emotions;

    } catch (error) {
      console.error('Emotion detection failed:', error);
      throw error;
    }
  }

  /**
   * Perform emotion detection
   */
  performEmotionDetection(text) {
    const emotionKeywords = {
      joy: ['happy', 'joyful', 'excited', 'delighted', 'cheerful', 'glad'],
      sadness: ['sad', 'depressed', 'unhappy', 'melancholy', 'sorrowful'],
      anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'rage'],
      fear: ['afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous'],
      surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled']
    };

    const words = text.toLowerCase().split(/\s+/);
    const emotionScores = {};

    // Initialize scores
    Object.keys(emotionKeywords).forEach((emotion) => {
      emotionScores[emotion] = 0;
    });

    // Calculate emotion scores
    words.forEach((word) => {
      Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
        if (keywords.includes(word)) {
          emotionScores[emotion]++;
        }
      });
    });

    // Add some randomness and normalize
    Object.keys(emotionScores).forEach((emotion) => {
      emotionScores[emotion] = (emotionScores[emotion] + Math.random()) / Math.max(1, words.length);
    });

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotionScores)
      .reduce((max, [emotion, score]) => score > max.score ? { emotion, score } : max,
        { emotion: 'neutral', score: 0 });

    return {
      emotions: emotionScores,
      dominantEmotion: dominantEmotion.emotion,
      confidence: Math.min(0.95, dominantEmotion.score * 2 + 0.5),
      wordCount: words.length
    };
  }

  /**
   * Classify intent of text
   */
  async classifyIntent(text, options = {}) {
    try {
      // Simulate intent classification
      await new Promise((resolve) => setTimeout(resolve, 250));

      const intent = this.performIntentClassification(text);

      // Update model usage
      const model = this.models.get('intent_classifier');
      model.lastUsed = new Date();
      model.usageCount++;

      return intent;

    } catch (error) {
      console.error('Intent classification failed:', error);
      throw error;
    }
  }

  /**
   * Perform intent classification
   */
  performIntentClassification(text) {
    const intentKeywords = {
      complaint: ['complaint', 'problem', 'issue', 'wrong', 'broken', 'not working', 'disappointed'],
      inquiry: ['question', 'ask', 'wondering', 'curious', 'information', 'details', 'explain'],
      compliment: ['great', 'excellent', 'amazing', 'wonderful', 'thank you', 'appreciate', 'love'],
      request: ['please', 'can you', 'would you', 'help me', 'need', 'want', 'request'],
      support: ['help', 'support', 'assistance', 'guide', 'how to', 'tutorial', 'stuck']
    };

    const words = text.toLowerCase().split(/\s+/);
    const intentScores = {};

    // Initialize scores
    Object.keys(intentKeywords).forEach((intent) => {
      intentScores[intent] = 0;
    });

    // Calculate intent scores
    words.forEach((word) => {
      Object.entries(intentKeywords).forEach(([intent, keywords]) => {
        keywords.forEach((keyword) => {
          if (text.toLowerCase().includes(keyword)) {
            intentScores[intent]++;
          }
        });
      });
    });

    // Add some randomness
    Object.keys(intentScores).forEach((intent) => {
      intentScores[intent] += Math.random() * 0.5;
    });

    // Find top intent
    const topIntent = Object.entries(intentScores)
      .reduce((max, [intent, score]) => score > max.score ? { intent, score } : max,
        { intent: 'general', score: 0 });

    const confidence = Math.min(0.95, topIntent.score / Math.max(1, words.length) + 0.6);

    return {
      intent: topIntent.intent,
      confidence,
      allScores: intentScores,
      wordCount: words.length
    };
  }

  /**
   * Extract named entities from text
   */
  async extractEntities(text, options = {}) {
    try {
      // Simulate entity extraction
      await new Promise((resolve) => setTimeout(resolve, 400));

      const entities = this.performEntityExtraction(text, options);

      return entities;

    } catch (error) {
      console.error('Entity extraction failed:', error);
      throw error;
    }
  }

  /**
   * Perform entity extraction
   */
  performEntityExtraction(text, options) {
    const extractedEntities = [];

    // Extract entities using patterns
    this.entities.forEach((entityType, type) => {
      entityType.patterns.forEach((pattern) => {
        const matches = text.match(new RegExp(pattern, 'g'));
        if (matches) {
          matches.forEach((match) => {
            extractedEntities.push({
              text: match,
              type,
              confidence: 0.7 + Math.random() * 0.25,
              start: text.indexOf(match),
              end: text.indexOf(match) + match.length
            });
          });
        }
      });
    });

    // Remove duplicates and sort by position
    const uniqueEntities = extractedEntities
      .filter((entity, index, self) =>
        index === self.findIndex((e) => e.text === entity.text && e.type === entity.type))
      .sort((a, b) => a.start - b.start);

    return {
      entities: uniqueEntities,
      entityCount: uniqueEntities.length,
      entityTypes: [...new Set(uniqueEntities.map((e) => e.type))]
    };
  }

  /**
   * Summarize text
   */
  async summarizeText(text, options = {}) {
    try {
      // Simulate text summarization
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const summary = this.performTextSummarization(text, options);

      // Update model usage
      const model = this.models.get('text_summarizer');
      model.lastUsed = new Date();
      model.usageCount++;

      return summary;

    } catch (error) {
      console.error('Text summarization failed:', error);
      throw error;
    }
  }

  /**
   * Perform text summarization
   */
  performTextSummarization(text, options) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const maxLength = options.maxLength || 150;
    const minLength = options.minLength || 50;

    // Simple extractive summarization
    // Score sentences based on word frequency and position
    const wordFreq = this.calculateWordFrequency(text);
    const sentenceScores = sentences.map((sentence, index) => {
      const words = sentence.toLowerCase().split(/\s+/);
      const score = words.reduce((sum, word) => sum + (wordFreq[word] || 0), 0) / words.length;
      const positionScore = 1 - (index / sentences.length) * 0.3; // Earlier sentences get higher score

      return {
        sentence: sentence.trim(),
        score: score * positionScore,
        index
      };
    });

    // Select top sentences
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(sentences.length * 0.3))
      .sort((a, b) => a.index - b.index);

    let summary = topSentences.map((s) => s.sentence).join('. ');

    // Ensure summary length is within bounds
    if (summary.length > maxLength) {
      summary = `${summary.substring(0, maxLength - 3)}...`;
    }

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: summary.length / text.length,
      sentencesUsed: topSentences.length,
      totalSentences: sentences.length
    };
  }

  /**
   * Process document
   */
  async processDocument(documentId, content, options = {}) {
    const processingId = this.generateProcessingId();

    const document = {
      id: documentId,
      processingId,
      content,
      status: 'processing',
      startTime: new Date(),
      endTime: null,
      results: null,
      options
    };

    this.documents.set(documentId, document);

    try {
      // Perform comprehensive document processing
      const results = await this.performDocumentProcessing(content, options);

      document.results = results;
      document.status = 'completed';
      document.endTime = new Date();

      // Emit processing completed event
      this.emit('document_processed', {
        documentId,
        processingId,
        wordCount: results.wordCount,
        sentiment: results.sentiment?.sentiment
      });

      return processingId;

    } catch (error) {
      document.status = 'failed';
      document.endTime = new Date();
      document.error = error.message;

      this.emit('document_processing_failed', {
        documentId,
        processingId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Perform comprehensive document processing
   */
  async performDocumentProcessing(content, options) {
    const results = {
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      sentenceCount: content.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
      paragraphCount: content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    };

    // Language detection
    results.language = this.detectLanguage(content);

    // Sentiment analysis
    if (options.includeSentiment !== false) {
      results.sentiment = await this.analyzeSentiment(content);
    }

    // Emotion detection
    if (options.includeEmotions) {
      results.emotions = await this.detectEmotions(content);
    }

    // Entity extraction
    if (options.includeEntities !== false) {
      results.entities = await this.extractEntities(content);
    }

    // Text summarization
    if (options.includeSummary) {
      results.summary = await this.summarizeText(content, options.summaryOptions);
    }

    // Topic modeling (simplified)
    if (options.includeTopics) {
      results.topics = this.extractTopics(content);
    }

    // Readability analysis
    if (options.includeReadability) {
      results.readability = this.analyzeReadability(content);
    }

    return results;
  }

  /**
   * Chatbot conversation handling
   */
  async processConversation(conversationId, message, options = {}) {
    let conversation = this.conversations.get(conversationId);

    if (!conversation) {
      conversation = {
        id: conversationId,
        messages: [],
        context: {},
        startTime: new Date(),
        lastActivity: new Date()
      };
      this.conversations.set(conversationId, conversation);
    }

    // Add user message
    const userMessage = {
      id: this.generateMessageId(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      processed: false
    };

    conversation.messages.push(userMessage);

    try {
      // Process user message
      const analysis = await this.analyzeMessage(message);
      userMessage.analysis = analysis;
      userMessage.processed = true;

      // Generate bot response
      const botResponse = await this.generateResponse(analysis, conversation.context);

      const botMessage = {
        id: this.generateMessageId(),
        type: 'bot',
        content: botResponse.content,
        confidence: botResponse.confidence,
        intent: analysis.intent,
        timestamp: new Date()
      };

      conversation.messages.push(botMessage);
      conversation.lastActivity = new Date();

      // Update context
      this.updateConversationContext(conversation, analysis, botResponse);

      // Emit conversation event
      this.emit('conversation_processed', {
        conversationId,
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        responseGenerated: true
      });

      return {
        userMessage,
        botMessage,
        analysis
      };

    } catch (error) {
      console.error('Conversation processing failed:', error);
      throw error;
    }
  }

  /**
   * Analyze message for chatbot
   */
  async analyzeMessage(message) {
    const [sentiment, intent, entities] = await Promise.all([
      this.analyzeSentiment(message),
      this.classifyIntent(message),
      this.extractEntities(message)
    ]);

    return {
      sentiment: sentiment.sentiment,
      sentimentConfidence: sentiment.confidence,
      intent: intent.intent,
      intentConfidence: intent.confidence,
      entities: entities.entities,
      wordCount: message.split(/\s+/).length
    };
  }

  /**
   * Generate chatbot response
   */
  async generateResponse(analysis, context) {
    // Find matching intent
    const matchingIntent = this.chatbotIntents.find((intent) =>
      intent.intent === analysis.intent);

    let response;
    let confidence = 0.8;

    if (matchingIntent) {
      // Select random response from intent
      const responses = matchingIntent.responses;
      response = responses[Math.floor(Math.random() * responses.length)];
      confidence = analysis.intentConfidence;
    } else {
      // Default response
      response = "I understand you're trying to communicate with me. Could you please rephrase your question or let me know how I can help you?";
      confidence = 0.5;
    }

    // Personalize response based on sentiment
    if (analysis.sentiment === 'negative' && analysis.sentimentConfidence > 0.7) {
      response = `I understand you might be frustrated. ${response}`;
    } else if (analysis.sentiment === 'positive' && analysis.sentimentConfidence > 0.7) {
      response = `I'm glad to help! ${response}`;
    }

    return {
      content: response,
      confidence,
      intent: analysis.intent
    };
  }

  /**
   * Update conversation context
   */
  updateConversationContext(conversation, analysis, response) {
    // Update context with recent intents and entities
    if (!conversation.context.recentIntents) {
      conversation.context.recentIntents = [];
    }

    conversation.context.recentIntents.push(analysis.intent);
    conversation.context.recentIntents = conversation.context.recentIntents.slice(-5); // Keep last 5

    if (analysis.entities.length > 0) {
      if (!conversation.context.entities) {
        conversation.context.entities = [];
      }
      conversation.context.entities.push(...analysis.entities);
    }

    // Update sentiment trend
    if (!conversation.context.sentimentHistory) {
      conversation.context.sentimentHistory = [];
    }
    conversation.context.sentimentHistory.push({
      sentiment: analysis.sentiment,
      confidence: analysis.sentimentConfidence,
      timestamp: new Date()
    });
    conversation.context.sentimentHistory = conversation.context.sentimentHistory.slice(-10);
  }

  // Utility methods
  detectLanguage(text) {
    // Simple language detection based on common words
    const languagePatterns = {
      en: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'],
      es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se'],
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
      de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
    };

    const words = text.toLowerCase().split(/\s+/);
    const scores = {};

    Object.entries(languagePatterns).forEach(([lang, patterns]) => {
      scores[lang] = patterns.reduce((score, pattern) => {
        return score + words.filter((word) => word === pattern).length;
      }, 0);
    });

    const detectedLang = Object.entries(scores)
      .reduce((max, [lang, score]) => score > max.score ? { lang, score } : max,
        { lang: 'en', score: 0 });

    return detectedLang.lang;
  }

  calculateWordFrequency(text) {
    const words = text.toLowerCase().split(/\s+/);
    const frequency = {};

    words.forEach((word) => {
      word = word.replace(/[^\w]/g, ''); // Remove punctuation
      if (word.length > 2) { // Ignore very short words
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return frequency;
  }

  extractTopics(text) {
    // Simplified topic extraction
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const wordFreq = this.calculateWordFrequency(text);

    // Get top words as topics
    const topWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, freq]) => ({ word, frequency: freq }));

    return {
      topics: topWords,
      topicCount: topWords.length,
      method: 'frequency_based'
    };
  }

  analyzeReadability(text) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    let readingLevel;
    if (fleschScore >= 90) readingLevel = 'Very Easy';
    else if (fleschScore >= 80) readingLevel = 'Easy';
    else if (fleschScore >= 70) readingLevel = 'Fairly Easy';
    else if (fleschScore >= 60) readingLevel = 'Standard';
    else if (fleschScore >= 50) readingLevel = 'Fairly Difficult';
    else if (fleschScore >= 30) readingLevel = 'Difficult';
    else readingLevel = 'Very Difficult';

    return {
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      readingLevel,
      avgWordsPerSentence,
      avgSyllablesPerWord,
      totalWords: words.length,
      totalSentences: sentences.length
    };
  }

  countSyllables(word) {
    // Simple syllable counting
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent e
    if (word.endsWith('e')) count--;

    return Math.max(1, count);
  }

  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  generateAnalysisId() {
    return `nlp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateProcessingId() {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getModels() {
    return Array.from(this.models.values());
  }

  getProcessors() {
    return Array.from(this.processors.values());
  }

  getEntityTypes() {
    return Array.from(this.entities.values());
  }

  getDocuments(filters = {}) {
    let documents = Array.from(this.documents.values());

    if (filters.status) {
      documents = documents.filter((doc) => doc.status === filters.status);
    }

    return documents.sort((a, b) => b.startTime - a.startTime);
  }

  getDocument(documentId) {
    return this.documents.get(documentId);
  }

  getConversations(filters = {}) {
    let conversations = Array.from(this.conversations.values());

    if (filters.active) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      conversations = conversations.filter((conv) => conv.lastActivity > cutoff);
    }

    return conversations.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  async batchProcess(texts, operations = ['sentiment']) {
    const results = [];

    for (const text of texts) {
      const result = { text, results: {} };

      for (const operation of operations) {
        switch (operation) {
          case 'sentiment':
            result.results.sentiment = await this.analyzeSentiment(text);
            break;
          case 'emotions':
            result.results.emotions = await this.detectEmotions(text);
            break;
          case 'intent':
            result.results.intent = await this.classifyIntent(text);
            break;
          case 'entities':
            result.results.entities = await this.extractEntities(text);
            break;
          case 'summary':
            result.results.summary = await this.summarizeText(text);
            break;
        }
      }

      results.push(result);
    }

    return results;
  }

  clearCache() {
    this.sentimentCache.clear();
    console.log('NLP cache cleared');
  }

  getStats() {
    return {
      modelsLoaded: this.models.size,
      documentsProcessed: this.documents.size,
      activeConversations: Array.from(this.conversations.values())
        .filter((conv) => conv.lastActivity > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
      cacheSize: this.sentimentCache.size,
      totalMessages: Array.from(this.conversations.values())
        .reduce((total, conv) => total + conv.messages.length, 0)
    };
  }
}

module.exports = NLPService;
