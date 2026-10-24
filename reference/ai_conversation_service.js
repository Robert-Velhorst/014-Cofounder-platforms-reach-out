// Advanced AI Conversation Service
// GPT-4 powered conversations with voice input/output and context management

const OpenAI = require('openai');
const EventEmitter = require('events');

class AIConversationService extends EventEmitter {
  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.conversations = new Map();
    this.contextWindow = 10; // Last 10 messages
  }

  // Create new conversation
  async createConversation(userId, type = 'ai_assistant') {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation = {
      id: conversationId,
      userId,
      type,
      messages: [],
      context: {
        currentTopic: null,
        referencedMatches: [],
        suggestedActions: [],
        userProfile: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  // Get conversation
  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  // Send message and get AI response
  async sendMessage(conversationId, userMessage, options = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Add user message
    const userMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(userMsg);

    // Prepare context for GPT-4
    const systemPrompt = this.buildSystemPrompt(conversation, options);
    const conversationHistory = this.buildConversationHistory(conversation);

    try {
      // Call GPT-4 with streaming
      const stream = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true,
        functions: this.getFunctionDefinitions(),
        function_call: 'auto',
      });

      // Stream response
      let assistantMessage = '';
      let functionCall = null;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          assistantMessage += delta.content;
          this.emit('message_chunk', {
            conversationId,
            chunk: delta.content,
          });
        }

        if (delta?.function_call) {
          if (!functionCall) {
            functionCall = {
              name: delta.function_call.name || '',
              arguments: delta.function_call.arguments || '',
            };
          } else {
            functionCall.arguments += delta.function_call.arguments || '';
          }
        }
      }

      // Handle function call if present
      let actions = [];
      if (functionCall) {
        actions = await this.handleFunctionCall(functionCall, conversation);
      }

      // Add assistant message
      const assistantMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
        actions,
      };
      conversation.messages.push(assistantMsg);

      // Update context
      await this.updateContext(conversation, userMessage, assistantMessage);

      conversation.updatedAt = new Date().toISOString();

      return assistantMsg;
    } catch (error) {
      console.error('Error in AI conversation:', error);
      throw error;
    }
  }

  // Build system prompt based on conversation type and context
  buildSystemPrompt(conversation, options) {
    const basePrompt = `You are an AI assistant for the Co-Founder Discovery Platform, helping entrepreneurs find and connect with their perfect co-founder.

Your role is to:
1. Provide expert advice on co-founder discovery and partnership
2. Help users understand compatibility scores and match recommendations
3. Guide users through the partnership formation process
4. Answer questions about equity splits, agreements, and best practices
5. Analyze conversations and provide insights
6. Suggest next steps and actions

Current context:
- User ID: ${conversation.userId}
- Conversation type: ${conversation.type}
- Current topic: ${conversation.context.currentTopic || 'general'}
${conversation.context.userProfile ? `- User profile: ${JSON.stringify(conversation.context.userProfile, null, 2)}` : ''}
${conversation.context.referencedMatches.length > 0 ? `- Referenced matches: ${conversation.context.referencedMatches.map(m => m.name).join(', ')}` : ''}

Tone: Professional, friendly, supportive, and encouraging
Style: Clear, concise, actionable advice
Format: Use markdown for formatting when appropriate

When suggesting actions, use function calls to trigger platform features.`;

    return basePrompt;
  }

  // Build conversation history for context
  buildConversationHistory(conversation) {
    const recentMessages = conversation.messages.slice(-this.contextWindow);
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  // Define available functions for GPT-4 to call
  getFunctionDefinitions() {
    return [
      {
        name: 'run_discovery',
        description: 'Run one-click co-founder discovery to find matches',
        parameters: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              description: 'Optional filters for discovery',
              properties: {
                location: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } },
                industry: { type: 'string' },
              },
            },
          },
        },
      },
      {
        name: 'view_match_details',
        description: 'View detailed information about a specific match',
        parameters: {
          type: 'object',
          properties: {
            matchId: {
              type: 'string',
              description: 'The ID of the match to view',
            },
          },
          required: ['matchId'],
        },
      },
      {
        name: 'send_message',
        description: 'Send a message to a prospect',
        parameters: {
          type: 'object',
          properties: {
            prospectId: {
              type: 'string',
              description: 'The ID of the prospect to message',
            },
            message: {
              type: 'string',
              description: 'The message content',
            },
          },
          required: ['prospectId', 'message'],
        },
      },
      {
        name: 'schedule_call',
        description: 'Schedule a video call with a prospect',
        parameters: {
          type: 'object',
          properties: {
            prospectId: {
              type: 'string',
              description: 'The ID of the prospect',
            },
            dateTime: {
              type: 'string',
              description: 'ISO 8601 date-time string',
            },
            platform: {
              type: 'string',
              enum: ['zoom', 'meet', 'native'],
              description: 'Video call platform',
            },
          },
          required: ['prospectId', 'dateTime'],
        },
      },
      {
        name: 'calculate_equity',
        description: 'Open the equity calculator or calculate equity split',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['open', 'calculate'],
              description: 'Action to perform',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'create_campaign',
        description: 'Create an automated outreach campaign',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Campaign name',
            },
            type: {
              type: 'string',
              enum: ['introduction', 'follow_up', 'reengagement'],
              description: 'Campaign type',
            },
          },
          required: ['name', 'type'],
        },
      },
    ];
  }

  // Handle function calls from GPT-4
  async handleFunctionCall(functionCall, conversation) {
    const { name, arguments: argsStr } = functionCall;
    const args = JSON.parse(argsStr);

    const actions = [];

    switch (name) {
      case 'run_discovery':
        actions.push({
          type: 'run_discovery',
          label: 'Find Co-Founders',
          data: args.filters || {},
        });
        break;

      case 'view_match_details':
        actions.push({
          type: 'view_match',
          label: 'View Match Details',
          data: { matchId: args.matchId },
        });
        break;

      case 'send_message':
        actions.push({
          type: 'send_message',
          label: 'Send Message',
          data: {
            prospectId: args.prospectId,
            message: args.message,
          },
        });
        break;

      case 'schedule_call':
        actions.push({
          type: 'schedule_call',
          label: 'Schedule Call',
          data: {
            prospectId: args.prospectId,
            dateTime: args.dateTime,
            platform: args.platform || 'zoom',
          },
        });
        break;

      case 'calculate_equity':
        actions.push({
          type: 'open_equity_calculator',
          label: 'Open Equity Calculator',
          data: {},
        });
        break;

      case 'create_campaign':
        actions.push({
          type: 'create_campaign',
          label: 'Create Campaign',
          data: {
            name: args.name,
            type: args.type,
          },
        });
        break;
    }

    return actions;
  }

  // Update conversation context based on messages
  async updateContext(conversation, userMessage, assistantMessage) {
    // Simple topic detection (can be enhanced with embeddings)
    const topics = {
      equity: ['equity', 'split', 'shares', 'ownership', 'slicing pie'],
      matching: ['find', 'match', 'discover', 'search', 'compatible'],
      messaging: ['message', 'contact', 'reach out', 'email'],
      video: ['call', 'video', 'zoom', 'meet', 'schedule'],
      campaign: ['campaign', 'automate', 'outreach', 'sequence'],
      advice: ['should', 'how', 'what', 'why', 'advice', 'help'],
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        conversation.context.currentTopic = topic;
        break;
      }
    }
  }

  // Voice input: transcribe audio to text
  async transcribeAudio(audioBuffer, options = {}) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        language: options.language || 'en',
        response_format: 'json',
      });

      return response.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  // Voice output: convert text to speech
  async synthesizeSpeech(text, options = {}) {
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: options.voice || 'alloy', // alloy, echo, fable, onyx, nova, shimmer
        input: text,
        speed: options.speed || 1.0,
      });

      return response.body; // Returns audio stream
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  // Voice conversation: transcribe, process, and synthesize
  async handleVoiceMessage(conversationId, audioBuffer, options = {}) {
    // Transcribe audio to text
    const transcribedText = await this.transcribeAudio(audioBuffer, options);

    // Process message through AI
    const response = await this.sendMessage(conversationId, transcribedText, options);

    // Synthesize response to speech
    const audioResponse = await this.synthesizeSpeech(response.content, options);

    return {
      transcription: transcribedText,
      response: response,
      audio: audioResponse,
    };
  }

  // Analyze conversation for insights
  async analyzeConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = conversation.messages.map(m => m.content).join('\n\n');

    const analysis = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze this conversation between a user and an AI assistant about co-founder discovery. Provide insights on:
1. User's main concerns and questions
2. User's readiness for co-founder partnership
3. Compatibility signals mentioned
4. Next recommended actions
5. Potential red flags or concerns

Format the analysis as JSON with these keys: concerns, readiness, compatibilitySignals, recommendedActions, redFlags.`,
        },
        {
          role: 'user',
          content: messages,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(analysis.choices[0].message.content);
  }

  // Get conversation summary
  async summarizeConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const summary = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation in 2-3 sentences, highlighting the main topics discussed and key outcomes.',
        },
        {
          role: 'user',
          content: messages,
        },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return summary.choices[0].message.content;
  }

  // Delete conversation
  deleteConversation(conversationId) {
    return this.conversations.delete(conversationId);
  }

  // Get all conversations for a user
  getUserConversations(userId) {
    const userConversations = [];
    for (const [id, conv] of this.conversations.entries()) {
      if (conv.userId === userId) {
        userConversations.push(conv);
      }
    }
    return userConversations;
  }
}

module.exports = AIConversationService;

// Example usage:
if (require.main === module) {
  const service = new AIConversationService();

  async function demo() {
    // Create conversation
    const conversation = await service.createConversation('user_123');
    console.log('Created conversation:', conversation.id);

    // Listen for streaming chunks
    service.on('message_chunk', ({ conversationId, chunk }) => {
      process.stdout.write(chunk);
    });

    // Send message
    const response = await service.sendMessage(
      conversation.id,
      'How should I split equity with my co-founder?'
    );
    console.log('\n\nResponse:', response);

    // Analyze conversation
    const analysis = await service.analyzeConversation(conversation.id);
    console.log('\nAnalysis:', JSON.stringify(analysis, null, 2));

    // Summarize conversation
    const summary = await service.summarizeConversation(conversation.id);
    console.log('\nSummary:', summary);
  }

  demo().catch(console.error);
}
