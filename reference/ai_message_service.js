// AI-Powered Message Personalization Service
// Uses OpenAI GPT-4 for dynamic, context-aware message generation

const { OpenAI } = require('openai');

class AIMessageService {
    constructor() {
        // OpenAI client is pre-configured via environment variables
        this.client = new OpenAI();
        this.model = 'gpt-4.1-mini'; // Cost-effective, high-quality model
        
        // Message generation cache
        this.messageCache = new Map();
        
        // A/B testing framework
        this.abTests = new Map();
        
        // Performance tracking
        this.performanceMetrics = {
            totalGenerated: 0,
            averageResponseTime: 0,
            successRate: 0,
            cacheHitRate: 0
        };
    }

    // ==================== CORE MESSAGE GENERATION ====================

    async generatePersonalizedMessage(userProfile, prospectProfile, options = {}) {
        const startTime = Date.now();

        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(userProfile, prospectProfile, options);
            if (this.messageCache.has(cacheKey) && !options.bypassCache) {
                this.performanceMetrics.cacheHitRate++;
                return this.messageCache.get(cacheKey);
            }

            // Build context from profiles
            const context = this.buildMessageContext(userProfile, prospectProfile, options);

            // Select appropriate template
            const template = await this.selectTemplate(userProfile, prospectProfile, options);

            // Generate message using GPT-4
            const message = await this.generateWithGPT(context, template, options);

            // Post-process and enhance
            const enhancedMessage = this.enhanceMessage(message, userProfile, prospectProfile);

            // Track performance
            const responseTime = Date.now() - startTime;
            this.updatePerformanceMetrics(responseTime, true);

            // Cache result
            this.messageCache.set(cacheKey, enhancedMessage);

            return enhancedMessage;

        } catch (error) {
            console.error('Error generating message:', error);
            this.updatePerformanceMetrics(Date.now() - startTime, false);
            
            // Fallback to template-based message
            return this.generateFallbackMessage(userProfile, prospectProfile, options);
        }
    }

    async generateBulkMessages(userProfile, prospects, options = {}) {
        const messages = [];
        const batchSize = options.batchSize || 5;

        for (let i = 0; i < prospects.length; i += batchSize) {
            const batch = prospects.slice(i, i + batchSize);
            const batchPromises = batch.map(prospect =>
                this.generatePersonalizedMessage(userProfile, prospect, options)
            );

            const batchResults = await Promise.all(batchPromises);
            messages.push(...batchResults);

            // Rate limiting
            if (i + batchSize < prospects.length) {
                await this.delay(1000); // 1 second between batches
            }
        }

        return messages;
    }

    // ==================== CONTEXT BUILDING ====================

    buildMessageContext(userProfile, prospectProfile, options) {
        const context = {
            user: {
                name: userProfile.personalInfo?.name || 'User',
                location: userProfile.personalInfo?.location,
                experience: userProfile.founderStage?.experienceLevel,
                technicalSkills: userProfile.technicalSkills?.programmingLanguages || [],
                businessSkills: this.getTopBusinessSkills(userProfile.businessSkills),
                industries: userProfile.startupVision?.industryFocus || [],
                vision: userProfile.startupVision?.problemSolving,
                values: userProfile.coreValues || [],
                personality: userProfile.personalityType?.communicationStyle
            },
            prospect: {
                name: prospectProfile.name,
                location: prospectProfile.location,
                skills: prospectProfile.skills || [],
                expertise: prospectProfile.expertise || [],
                experience: prospectProfile.experience,
                industries: prospectProfile.vision?.industries || prospectProfile.industries || [],
                values: prospectProfile.values || [],
                personality: prospectProfile.personality?.communicationStyle
            },
            compatibility: options.compatibility || {},
            messageType: options.messageType || 'introduction',
            tone: options.tone || this.determineTone(userProfile, prospectProfile),
            length: options.length || 'medium',
            callToAction: options.callToAction || 'meeting'
        };

        return context;
    }

    getTopBusinessSkills(businessSkills) {
        if (!businessSkills) return [];
        
        return Object.entries(businessSkills)
            .filter(([_, score]) => score >= 7)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 3)
            .map(([skill, _]) => skill);
    }

    determineTone(userProfile, prospectProfile) {
        const userStyle = userProfile.personalityType?.communicationStyle;
        const prospectStyle = prospectProfile.personality?.communicationStyle;

        // Match tone to prospect's communication style
        const toneMap = {
            analytical: 'professional and data-driven',
            direct: 'concise and straightforward',
            diplomatic: 'warm and collaborative',
            enthusiastic: 'energetic and inspiring'
        };

        return toneMap[prospectStyle] || toneMap[userStyle] || 'professional and friendly';
    }

    // ==================== TEMPLATE SELECTION ====================

    async selectTemplate(userProfile, prospectProfile, options) {
        const messageType = options.messageType || 'introduction';
        
        const templates = {
            introduction: {
                name: 'Co-Founder Introduction',
                structure: [
                    'greeting',
                    'common_ground',
                    'value_proposition',
                    'compatibility_highlight',
                    'call_to_action'
                ],
                maxLength: 200
            },
            follow_up: {
                name: 'Follow-Up Message',
                structure: [
                    'reference_previous',
                    'additional_value',
                    'urgency',
                    'call_to_action'
                ],
                maxLength: 150
            },
            pitch: {
                name: 'Startup Pitch',
                structure: [
                    'hook',
                    'problem',
                    'solution',
                    'traction',
                    'ask'
                ],
                maxLength: 250
            },
            collaboration: {
                name: 'Collaboration Proposal',
                structure: [
                    'greeting',
                    'shared_vision',
                    'complementary_skills',
                    'specific_opportunity',
                    'next_steps'
                ],
                maxLength: 220
            }
        };

        return templates[messageType] || templates.introduction;
    }

    // ==================== GPT-4 GENERATION ====================

    async generateWithGPT(context, template, options) {
        const systemPrompt = this.buildSystemPrompt(template, options);
        const userPrompt = this.buildUserPrompt(context, template);

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: template.maxLength || 200,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            });

            const generatedMessage = response.choices[0].message.content.trim();

            return {
                content: generatedMessage,
                template: template.name,
                model: this.model,
                tokensUsed: response.usage.total_tokens,
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('GPT generation error:', error);
            throw error;
        }
    }

    buildSystemPrompt(template, options) {
        return `You are an expert co-founder matchmaker and communication specialist. Your role is to craft personalized, compelling messages that help entrepreneurs connect with potential co-founders.

Guidelines:
- Write in a ${options.tone || 'professional and friendly'} tone
- Be authentic and genuine, avoid generic templates
- Highlight specific compatibility factors and shared interests
- Keep the message concise (${template.maxLength} words max)
- Focus on mutual value and collaboration opportunities
- Include a clear, actionable next step
- Avoid overly salesy or pushy language
- Personalize based on the specific profiles provided

Message Type: ${template.name}
Structure: ${template.structure.join(' → ')}`;
    }

    buildUserPrompt(context, template) {
        const { user, prospect, compatibility, messageType, callToAction } = context;

        let prompt = `Generate a personalized ${messageType} message for the following scenario:\n\n`;

        // User context
        prompt += `SENDER (User):\n`;
        prompt += `- Name: ${user.name}\n`;
        prompt += `- Location: ${user.location || 'Not specified'}\n`;
        prompt += `- Experience: ${user.experience || 'Entrepreneur'}\n`;
        prompt += `- Technical Skills: ${user.technicalSkills.join(', ') || 'Various'}\n`;
        prompt += `- Business Strengths: ${user.businessSkills.join(', ') || 'Various'}\n`;
        prompt += `- Industry Focus: ${user.industries.join(', ') || 'Multiple industries'}\n`;
        prompt += `- Vision: ${user.vision || 'Building innovative solutions'}\n`;
        prompt += `- Core Values: ${user.values.join(', ') || 'Innovation, Growth'}\n\n`;

        // Prospect context
        prompt += `RECIPIENT (Prospect):\n`;
        prompt += `- Name: ${prospect.name}\n`;
        prompt += `- Location: ${prospect.location || 'Not specified'}\n`;
        prompt += `- Skills: ${prospect.skills.join(', ') || 'Various'}\n`;
        prompt += `- Expertise: ${prospect.expertise.join(', ') || 'Various'}\n`;
        prompt += `- Experience: ${prospect.experience || 'Experienced'}\n`;
        prompt += `- Industries: ${prospect.industries.join(', ') || 'Multiple'}\n`;
        prompt += `- Values: ${prospect.values.join(', ') || 'Not specified'}\n\n`;

        // Compatibility insights
        if (compatibility.overallScore) {
            prompt += `COMPATIBILITY INSIGHTS:\n`;
            prompt += `- Overall Compatibility: ${Math.round(compatibility.overallScore * 100)}%\n`;
            
            if (compatibility.breakdown) {
                const topStrengths = Object.entries(compatibility.breakdown)
                    .sort(([_, a], [__, b]) => b - a)
                    .slice(0, 2)
                    .map(([dim, score]) => `${dim} (${Math.round(score * 100)}%)`)
                    .join(', ');
                prompt += `- Top Compatibility Areas: ${topStrengths}\n`;
            }

            if (compatibility.reasoning) {
                prompt += `- Key Insights: ${compatibility.reasoning.split('\n')[0]}\n`;
            }
            prompt += `\n`;
        }

        // Instructions
        prompt += `INSTRUCTIONS:\n`;
        prompt += `Write a compelling message that:\n`;
        prompt += `1. Establishes a genuine connection based on shared interests/values\n`;
        prompt += `2. Highlights specific compatibility factors (skills, vision, values)\n`;
        prompt += `3. Demonstrates understanding of the prospect's background\n`;
        prompt += `4. Proposes a clear next step: ${callToAction}\n`;
        prompt += `5. Feels personal and authentic, not template-based\n\n`;

        prompt += `Generate the message now:`;

        return prompt;
    }

    // ==================== MESSAGE ENHANCEMENT ====================

    enhanceMessage(message, userProfile, prospectProfile) {
        const enhanced = { ...message };

        // Add subject line
        enhanced.subject = this.generateSubjectLine(userProfile, prospectProfile, message.content);

        // Add personalization tags
        enhanced.personalization = {
            userName: userProfile.personalInfo?.name,
            prospectName: prospectProfile.name,
            sharedIndustries: this.findSharedIndustries(userProfile, prospectProfile),
            sharedValues: this.findSharedValues(userProfile, prospectProfile),
            complementarySkills: this.findComplementarySkills(userProfile, prospectProfile)
        };

        // Add metadata
        enhanced.metadata = {
            wordCount: message.content.split(' ').length,
            readingTime: Math.ceil(message.content.split(' ').length / 200), // minutes
            personalityMatch: this.calculatePersonalityMatch(userProfile, prospectProfile),
            recommendedSendTime: this.recommendSendTime(prospectProfile)
        };

        return enhanced;
    }

    generateSubjectLine(userProfile, prospectProfile, messageContent) {
        const subjects = [
            `${userProfile.personalInfo?.name} + ${prospectProfile.name}: Co-founder opportunity`,
            `Potential co-founder match in ${prospectProfile.industries?.[0] || 'your industry'}`,
            `Let's build something amazing together`,
            `Co-founder collaboration opportunity`,
            `${prospectProfile.name}, I think we'd make great co-founders`
        ];

        // Select based on message content sentiment
        return subjects[Math.floor(Math.random() * subjects.length)];
    }

    findSharedIndustries(userProfile, prospectProfile) {
        const userIndustries = new Set(userProfile.startupVision?.industryFocus || []);
        const prospectIndustries = new Set(prospectProfile.vision?.industries || prospectProfile.industries || []);
        
        return [...userIndustries].filter(i => prospectIndustries.has(i));
    }

    findSharedValues(userProfile, prospectProfile) {
        const userValues = new Set(userProfile.coreValues || []);
        const prospectValues = new Set(prospectProfile.values || []);
        
        return [...userValues].filter(v => prospectValues.has(v));
    }

    findComplementarySkills(userProfile, prospectProfile) {
        const userSkills = new Set([
            ...(userProfile.technicalSkills?.programmingLanguages || []),
            ...(this.getTopBusinessSkills(userProfile.businessSkills))
        ]);
        
        const prospectSkills = new Set([
            ...(prospectProfile.skills || []),
            ...(prospectProfile.expertise || [])
        ]);

        // Skills prospect has that user doesn't
        return [...prospectSkills].filter(s => !userSkills.has(s));
    }

    calculatePersonalityMatch(userProfile, prospectProfile) {
        const userStyle = userProfile.personalityType?.communicationStyle;
        const prospectStyle = prospectProfile.personality?.communicationStyle;

        if (!userStyle || !prospectStyle) return 'unknown';

        const compatibilityMatrix = {
            analytical: ['analytical', 'direct'],
            direct: ['direct', 'analytical'],
            diplomatic: ['diplomatic', 'enthusiastic'],
            enthusiastic: ['enthusiastic', 'diplomatic']
        };

        return compatibilityMatrix[userStyle]?.includes(prospectStyle) ? 'high' : 'moderate';
    }

    recommendSendTime(prospectProfile) {
        // Recommend send time based on location timezone
        const location = prospectProfile.location || '';
        
        // Simple heuristic: morning hours in prospect's timezone
        if (location.includes('Pacific') || location.includes('San Francisco') || location.includes('Los Angeles')) {
            return '9:00 AM PST';
        } else if (location.includes('Eastern') || location.includes('New York') || location.includes('Boston')) {
            return '9:00 AM EST';
        } else {
            return '9:00 AM local time';
        }
    }

    // ==================== FALLBACK GENERATION ====================

    generateFallbackMessage(userProfile, prospectProfile, options) {
        const userName = userProfile.personalInfo?.name || 'I';
        const prospectName = prospectProfile.name;
        const sharedIndustries = this.findSharedIndustries(userProfile, prospectProfile);
        const industry = sharedIndustries[0] || prospectProfile.industries?.[0] || 'tech';

        const content = `Hi ${prospectName},

I came across your profile and was impressed by your experience in ${industry}. I'm ${userName}, and I'm working on building an innovative solution in this space.

I noticed we share similar interests and complementary skills. I'd love to explore the possibility of working together as co-founders.

Would you be open to a quick call to discuss potential collaboration?

Best regards,
${userName}`;

        return {
            content,
            subject: `Co-founder opportunity in ${industry}`,
            template: 'Fallback Template',
            model: 'fallback',
            tokensUsed: 0,
            generatedAt: new Date(),
            personalization: {
                userName,
                prospectName,
                sharedIndustries: [],
                sharedValues: [],
                complementarySkills: []
            },
            metadata: {
                wordCount: content.split(' ').length,
                readingTime: 1,
                personalityMatch: 'unknown',
                recommendedSendTime: '9:00 AM local time'
            }
        };
    }

    // ==================== A/B TESTING ====================

    async generateABVariants(userProfile, prospectProfile, options = {}) {
        const variantCount = options.variantCount || 2;
        const variants = [];

        // Generate variants with different tones/styles
        const tones = ['professional and friendly', 'concise and direct', 'warm and collaborative'];
        const temperatures = [0.6, 0.7, 0.8];

        for (let i = 0; i < Math.min(variantCount, 3); i++) {
            const variantOptions = {
                ...options,
                tone: tones[i],
                temperature: temperatures[i],
                bypassCache: true
            };

            const variant = await this.generatePersonalizedMessage(
                userProfile,
                prospectProfile,
                variantOptions
            );

            variants.push({
                id: `variant_${i + 1}`,
                ...variant,
                variantSettings: {
                    tone: tones[i],
                    temperature: temperatures[i]
                }
            });
        }

        // Create A/B test
        const testId = this.createABTest(userProfile.userId, prospectProfile.id, variants);

        return {
            testId,
            variants
        };
    }

    createABTest(userId, prospectId, variants) {
        const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.abTests.set(testId, {
            userId,
            prospectId,
            variants: variants.map(v => ({
                id: v.id,
                content: v.content,
                sent: false,
                opened: false,
                replied: false,
                sentAt: null
            })),
            createdAt: new Date(),
            status: 'active'
        });

        return testId;
    }

    recordABTestResult(testId, variantId, event, timestamp = new Date()) {
        const test = this.abTests.get(testId);
        if (!test) return;

        const variant = test.variants.find(v => v.id === variantId);
        if (!variant) return;

        variant[event] = true;
        variant[`${event}At`] = timestamp;

        this.abTests.set(testId, test);
    }

    getABTestResults(testId) {
        const test = this.abTests.get(testId);
        if (!test) return null;

        const results = test.variants.map(v => ({
            id: v.id,
            sent: v.sent,
            opened: v.opened,
            replied: v.replied,
            openRate: v.sent && v.opened ? 100 : 0,
            replyRate: v.sent && v.replied ? 100 : 0
        }));

        return {
            testId,
            status: test.status,
            results,
            winner: this.determineABWinner(results)
        };
    }

    determineABWinner(results) {
        // Winner is variant with highest reply rate, then open rate
        const sorted = results.sort((a, b) => {
            if (b.replyRate !== a.replyRate) return b.replyRate - a.replyRate;
            return b.openRate - a.openRate;
        });

        return sorted[0]?.id || null;
    }

    // ==================== PERFORMANCE TRACKING ====================

    updatePerformanceMetrics(responseTime, success) {
        this.performanceMetrics.totalGenerated++;
        
        const currentAvg = this.performanceMetrics.averageResponseTime;
        const count = this.performanceMetrics.totalGenerated;
        this.performanceMetrics.averageResponseTime = 
            (currentAvg * (count - 1) + responseTime) / count;

        if (success) {
            const currentSuccess = this.performanceMetrics.successRate;
            this.performanceMetrics.successRate = 
                (currentSuccess * (count - 1) + 100) / count;
        } else {
            const currentSuccess = this.performanceMetrics.successRate;
            this.performanceMetrics.successRate = 
                (currentSuccess * (count - 1)) / count;
        }
    }

    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.messageCache.size,
            activeABTests: this.abTests.size
        };
    }

    // ==================== UTILITIES ====================

    generateCacheKey(userProfile, prospectProfile, options) {
        const key = `${userProfile.userId}_${prospectProfile.id}_${options.messageType || 'intro'}_${options.tone || 'default'}`;
        return key;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearCache() {
        this.messageCache.clear();
    }
}

module.exports = AIMessageService;
