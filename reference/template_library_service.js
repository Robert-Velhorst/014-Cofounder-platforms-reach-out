// Template Library and Management System
// Comprehensive message templates with performance tracking

class TemplateLibraryService {
    constructor() {
        this.templates = new Map();
        this.categories = new Set();
        this.performanceData = new Map();
        
        // Initialize with default templates
        this.initializeDefaultTemplates();
    }

    // ==================== INITIALIZATION ====================

    initializeDefaultTemplates() {
        const defaultTemplates = [
            // Introduction Templates
            {
                name: 'Professional Introduction',
                category: 'introduction',
                industry: 'general',
                personalityMatch: 'analytical',
                tone: 'professional',
                content: `Hi {{prospectName}},

I came across your profile and was impressed by your experience in {{industry}}. I'm {{userName}}, currently working on {{userVision}}.

I noticed we share similar interests in {{sharedIndustries}} and have complementary skills - your {{prospectSkills}} would pair well with my {{userSkills}}.

Would you be open to a brief call to explore potential collaboration opportunities?

Best regards,
{{userName}}`,
                variables: ['prospectName', 'industry', 'userName', 'userVision', 'sharedIndustries', 'prospectSkills', 'userSkills'],
                estimatedLength: 150,
                successRate: 0.42
            },
            {
                name: 'Warm Introduction',
                category: 'introduction',
                industry: 'general',
                personalityMatch: 'enthusiastic',
                tone: 'friendly',
                content: `Hey {{prospectName}}!

I just discovered your profile and I'm genuinely excited about what you're working on in {{industry}}! 🚀

I'm {{userName}}, and I'm building {{userVision}}. When I saw that we both care about {{sharedValues}}, I knew I had to reach out.

I'd love to grab a virtual coffee and chat about how we might work together. What do you say?

Cheers,
{{userName}}`,
                variables: ['prospectName', 'industry', 'userName', 'userVision', 'sharedValues'],
                estimatedLength: 130,
                successRate: 0.38
            },
            {
                name: 'Value-First Introduction',
                category: 'introduction',
                industry: 'general',
                personalityMatch: 'direct',
                tone: 'direct',
                content: `{{prospectName}},

I see you're building in {{industry}}. I'm {{userName}}, working on {{userVision}}.

Here's why I'm reaching out:
• Your {{prospectSkills}} + my {{userSkills}} = powerful combination
• We share the same vision for {{sharedIndustries}}
• I believe we could accelerate each other's progress

15-minute call this week to explore?

{{userName}}`,
                variables: ['prospectName', 'industry', 'userName', 'userVision', 'prospectSkills', 'userSkills', 'sharedIndustries'],
                estimatedLength: 120,
                successRate: 0.45
            },

            // Follow-Up Templates
            {
                name: 'Gentle Follow-Up',
                category: 'follow_up',
                industry: 'general',
                personalityMatch: 'diplomatic',
                tone: 'polite',
                content: `Hi {{prospectName}},

I wanted to follow up on my previous message about potential collaboration.

I understand you're busy, but I genuinely believe our complementary skills in {{industry}} could lead to something special.

If you're interested, I'd love to share more about what I'm building and hear about your journey.

No pressure - just let me know if you'd like to connect.

Best,
{{userName}}`,
                variables: ['prospectName', 'industry', 'userName'],
                estimatedLength: 110,
                successRate: 0.28
            },
            {
                name: 'Value-Add Follow-Up',
                category: 'follow_up',
                industry: 'general',
                personalityMatch: 'analytical',
                tone: 'professional',
                content: `{{prospectName}},

Following up on my earlier message. Since then, I've been thinking about the {{industry}} space and wanted to share a relevant insight:

{{valueAddInsight}}

This aligns with what you're doing, and I think we could explore this together.

Still interested in that call?

{{userName}}`,
                variables: ['prospectName', 'industry', 'valueAddInsight', 'userName'],
                estimatedLength: 100,
                successRate: 0.35
            },

            // Pitch Templates
            {
                name: 'Problem-Solution Pitch',
                category: 'pitch',
                industry: 'general',
                personalityMatch: 'analytical',
                tone: 'professional',
                content: `Hi {{prospectName}},

**The Problem:** {{problemStatement}}

**Our Solution:** {{solutionStatement}}

**Why You:** Your experience in {{prospectExpertise}} is exactly what we need to scale this.

**The Opportunity:** {{marketOpportunity}}

I'd love to discuss how we could build this together as co-founders.

Interested in learning more?

{{userName}}`,
                variables: ['prospectName', 'problemStatement', 'solutionStatement', 'prospectExpertise', 'marketOpportunity', 'userName'],
                estimatedLength: 140,
                successRate: 0.32
            },
            {
                name: 'Vision-Driven Pitch',
                category: 'pitch',
                industry: 'general',
                personalityMatch: 'enthusiastic',
                tone: 'inspiring',
                content: `{{prospectName}},

Imagine a world where {{visionStatement}}.

That's what I'm building, and I need a co-founder who shares this vision.

Your background in {{prospectExpertise}} and passion for {{sharedValues}} makes you the perfect partner for this journey.

Together, we could:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

Ready to change the world?

{{userName}}`,
                variables: ['prospectName', 'visionStatement', 'prospectExpertise', 'sharedValues', 'benefit1', 'benefit2', 'benefit3', 'userName'],
                estimatedLength: 150,
                successRate: 0.29
            },

            // Collaboration Templates
            {
                name: 'Specific Collaboration Proposal',
                category: 'collaboration',
                industry: 'general',
                personalityMatch: 'direct',
                tone: 'professional',
                content: `{{prospectName}},

I have a specific collaboration opportunity in mind:

**Project:** {{projectName}}
**Your Role:** {{proposedRole}}
**Timeline:** {{timeline}}
**Equity Split:** {{equitySplit}}

Your {{prospectSkills}} would be crucial for {{specificContribution}}.

I've already:
• {{traction1}}
• {{traction2}}

Interested in discussing the details?

{{userName}}`,
                variables: ['prospectName', 'projectName', 'proposedRole', 'timeline', 'equitySplit', 'prospectSkills', 'specificContribution', 'traction1', 'traction2', 'userName'],
                estimatedLength: 140,
                successRate: 0.41
            },
            {
                name: 'Exploratory Collaboration',
                category: 'collaboration',
                industry: 'general',
                personalityMatch: 'diplomatic',
                tone: 'friendly',
                content: `Hi {{prospectName}},

I've been following your work in {{industry}} and I'm impressed by {{specificAccomplishment}}.

I'm exploring the idea of {{collaborationIdea}}, and I think your perspective would be invaluable.

No commitments - just curious if you'd be open to brainstorming together?

We might discover something exciting.

{{userName}}`,
                variables: ['prospectName', 'industry', 'specificAccomplishment', 'collaborationIdea', 'userName'],
                estimatedLength: 110,
                successRate: 0.36
            },

            // Industry-Specific Templates
            {
                name: 'SaaS Co-Founder Outreach',
                category: 'introduction',
                industry: 'SaaS',
                personalityMatch: 'analytical',
                tone: 'professional',
                content: `Hi {{prospectName}},

I'm building a SaaS platform for {{targetMarket}} that solves {{problemStatement}}.

Current traction:
• {{mrr}} MRR
• {{users}} users
• {{growthRate}}% monthly growth

I need a technical co-founder who understands {{technicalRequirement}}. Your experience with {{prospectSkills}} is exactly what I'm looking for.

Interested in scaling this together?

{{userName}}`,
                variables: ['prospectName', 'targetMarket', 'problemStatement', 'mrr', 'users', 'growthRate', 'technicalRequirement', 'prospectSkills', 'userName'],
                estimatedLength: 130,
                successRate: 0.47
            },
            {
                name: 'AI/ML Startup Outreach',
                category: 'introduction',
                industry: 'AI/ML',
                personalityMatch: 'analytical',
                tone: 'technical',
                content: `{{prospectName}},

I'm working on an AI solution for {{useCase}} using {{technology}}.

The model achieves {{metricValue}} on {{metric}}, but I need a co-founder with {{prospectExpertise}} to scale this commercially.

Your work on {{prospectProject}} caught my attention. Would you be interested in applying your expertise to {{industry}}?

Let's talk.

{{userName}}`,
                variables: ['prospectName', 'useCase', 'technology', 'metricValue', 'metric', 'prospectExpertise', 'prospectProject', 'industry', 'userName'],
                estimatedLength: 120,
                successRate: 0.44
            },
            {
                name: 'E-commerce Co-Founder Pitch',
                category: 'pitch',
                industry: 'E-commerce',
                personalityMatch: 'enthusiastic',
                tone: 'energetic',
                content: `Hey {{prospectName}}!

I'm launching an e-commerce brand in the {{niche}} space with a unique angle: {{uniqueValue}}.

Market size: {{marketSize}}
Target customers: {{targetCustomers}}
Initial investment: {{investment}}

I need a co-founder who can handle {{prospectRole}} while I focus on {{userRole}}.

Your experience with {{prospectSkills}} makes you perfect for this.

Ready to build something profitable together?

{{userName}}`,
                variables: ['prospectName', 'niche', 'uniqueValue', 'marketSize', 'targetCustomers', 'investment', 'prospectRole', 'userRole', 'prospectSkills', 'userName'],
                estimatedLength: 140,
                successRate: 0.39
            }
        ];

        // Add all default templates
        defaultTemplates.forEach(template => {
            this.addTemplate(template);
        });

        console.log(`✅ Initialized ${defaultTemplates.length} default templates`);
    }

    // ==================== TEMPLATE MANAGEMENT ====================

    addTemplate(templateData) {
        const template = {
            id: this.generateTemplateId(),
            ...templateData,
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
            successRate: templateData.successRate || 0,
            isPublic: templateData.isPublic !== false,
            createdBy: templateData.createdBy || 'system'
        };

        this.templates.set(template.id, template);
        this.categories.add(template.category);

        return template;
    }

    getTemplate(templateId) {
        return this.templates.get(templateId);
    }

    getAllTemplates(filters = {}) {
        let templates = Array.from(this.templates.values());

        // Apply filters
        if (filters.category) {
            templates = templates.filter(t => t.category === filters.category);
        }

        if (filters.industry) {
            templates = templates.filter(t => 
                t.industry === filters.industry || t.industry === 'general'
            );
        }

        if (filters.personalityMatch) {
            templates = templates.filter(t => t.personalityMatch === filters.personalityMatch);
        }

        if (filters.tone) {
            templates = templates.filter(t => t.tone === filters.tone);
        }

        if (filters.minSuccessRate) {
            templates = templates.filter(t => t.successRate >= filters.minSuccessRate);
        }

        // Sort by success rate
        templates.sort((a, b) => b.successRate - a.successRate);

        return templates;
    }

    getTemplatesByCategory(category) {
        return this.getAllTemplates({ category });
    }

    getRecommendedTemplates(userProfile, prospectProfile, count = 3) {
        const filters = {
            industry: prospectProfile.industries?.[0] || 'general',
            personalityMatch: prospectProfile.personality?.communicationStyle
        };

        const templates = this.getAllTemplates(filters);
        return templates.slice(0, count);
    }

    updateTemplate(templateId, updates) {
        const template = this.templates.get(templateId);
        if (!template) return null;

        Object.assign(template, updates, { updatedAt: new Date() });
        this.templates.set(templateId, template);

        return template;
    }

    deleteTemplate(templateId) {
        return this.templates.delete(templateId);
    }

    // ==================== TEMPLATE RENDERING ====================

    renderTemplate(templateId, variables) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        let rendered = template.content;

        // Replace all variables
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, value || `[${key}]`);
        }

        // Check for unreplaced variables
        const unreplaced = rendered.match(/{{(\w+)}}/g);
        if (unreplaced) {
            console.warn(`Unreplaced variables in template ${templateId}:`, unreplaced);
        }

        // Update usage count
        template.usageCount++;
        this.templates.set(templateId, template);

        return {
            templateId,
            templateName: template.name,
            content: rendered,
            category: template.category,
            estimatedLength: template.estimatedLength,
            renderedAt: new Date()
        };
    }

    renderTemplateWithProfiles(templateId, userProfile, prospectProfile, additionalVars = {}) {
        const variables = this.extractVariablesFromProfiles(userProfile, prospectProfile);
        Object.assign(variables, additionalVars);

        return this.renderTemplate(templateId, variables);
    }

    extractVariablesFromProfiles(userProfile, prospectProfile) {
        const variables = {
            // User variables
            userName: userProfile.personalInfo?.name || 'User',
            userEmail: userProfile.personalInfo?.email,
            userLocation: userProfile.personalInfo?.location,
            userSkills: (userProfile.technicalSkills?.programmingLanguages || []).slice(0, 2).join(', '),
            userVision: userProfile.startupVision?.problemSolving || 'an innovative solution',
            userRole: this.inferUserRole(userProfile),

            // Prospect variables
            prospectName: prospectProfile.name,
            prospectEmail: prospectProfile.email,
            prospectLocation: prospectProfile.location,
            prospectSkills: (prospectProfile.skills || []).slice(0, 2).join(', '),
            prospectExpertise: (prospectProfile.expertise || []).join(', '),
            prospectRole: this.inferProspectRole(prospectProfile),

            // Shared variables
            industry: prospectProfile.industries?.[0] || 'tech',
            sharedIndustries: this.findSharedIndustries(userProfile, prospectProfile).join(', ') || 'technology',
            sharedValues: this.findSharedValues(userProfile, prospectProfile).join(', ') || 'innovation',

            // Placeholders for custom variables
            problemStatement: '[Describe the problem you are solving]',
            solutionStatement: '[Describe your solution]',
            marketOpportunity: '[Describe the market opportunity]',
            visionStatement: '[Describe your vision]',
            projectName: '[Project name]',
            proposedRole: '[Proposed role]',
            timeline: '[Timeline]',
            equitySplit: '[Equity split]',
            specificContribution: '[Specific contribution needed]',
            traction1: '[Traction point 1]',
            traction2: '[Traction point 2]'
        };

        return variables;
    }

    inferUserRole(userProfile) {
        const technicalSkills = userProfile.technicalSkills?.programmingLanguages || [];
        const businessSkills = userProfile.businessSkills || {};

        if (technicalSkills.length > 0) {
            return 'technical development';
        } else if (businessSkills.marketing >= 7 || businessSkills.sales >= 7) {
            return 'business development';
        } else {
            return 'product strategy';
        }
    }

    inferProspectRole(prospectProfile) {
        const skills = prospectProfile.skills || [];
        const expertise = prospectProfile.expertise || [];

        const technicalKeywords = ['programming', 'development', 'engineering', 'technical'];
        const businessKeywords = ['marketing', 'sales', 'business', 'strategy'];

        const isTechnical = [...skills, ...expertise].some(s =>
            technicalKeywords.some(k => s.toLowerCase().includes(k))
        );

        const isBusiness = [...skills, ...expertise].some(s =>
            businessKeywords.some(k => s.toLowerCase().includes(k))
        );

        if (isTechnical) return 'technical development';
        if (isBusiness) return 'business development';
        return 'operations';
    }

    findSharedIndustries(userProfile, prospectProfile) {
        const userIndustries = new Set(userProfile.startupVision?.industryFocus || []);
        const prospectIndustries = new Set(prospectProfile.industries || []);
        return [...userIndustries].filter(i => prospectIndustries.has(i));
    }

    findSharedValues(userProfile, prospectProfile) {
        const userValues = new Set(userProfile.coreValues || []);
        const prospectValues = new Set(prospectProfile.values || []);
        return [...userValues].filter(v => prospectValues.has(v));
    }

    // ==================== PERFORMANCE TRACKING ====================

    recordTemplatePerformance(templateId, event, metadata = {}) {
        const template = this.getTemplate(templateId);
        if (!template) return;

        if (!this.performanceData.has(templateId)) {
            this.performanceData.set(templateId, {
                sent: 0,
                opened: 0,
                replied: 0,
                converted: 0,
                events: []
            });
        }

        const performance = this.performanceData.get(templateId);
        performance[event]++;
        performance.events.push({
            event,
            timestamp: new Date(),
            ...metadata
        });

        // Update success rate
        if (event === 'replied' || event === 'converted') {
            const successRate = (performance.replied + performance.converted) / performance.sent;
            template.successRate = successRate;
            this.templates.set(templateId, template);
        }

        this.performanceData.set(templateId, performance);
    }

    getTemplatePerformance(templateId) {
        const template = this.getTemplate(templateId);
        const performance = this.performanceData.get(templateId);

        if (!template) return null;

        return {
            templateId,
            templateName: template.name,
            usageCount: template.usageCount,
            successRate: template.successRate,
            performance: performance || {
                sent: 0,
                opened: 0,
                replied: 0,
                converted: 0
            },
            openRate: performance ? (performance.opened / performance.sent) * 100 : 0,
            replyRate: performance ? (performance.replied / performance.sent) * 100 : 0,
            conversionRate: performance ? (performance.converted / performance.sent) * 100 : 0
        };
    }

    getTopPerformingTemplates(count = 10) {
        const templates = Array.from(this.templates.values());
        return templates
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, count)
            .map(t => this.getTemplatePerformance(t.id));
    }

    // ==================== ANALYTICS ====================

    getLibraryStats() {
        const templates = Array.from(this.templates.values());

        return {
            totalTemplates: templates.length,
            categories: Array.from(this.categories),
            averageSuccessRate: templates.reduce((sum, t) => sum + t.successRate, 0) / templates.length,
            totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
            byCategory: this.getStatsByCategory(),
            byIndustry: this.getStatsByIndustry(),
            topPerforming: this.getTopPerformingTemplates(5)
        };
    }

    getStatsByCategory() {
        const stats = {};

        for (const category of this.categories) {
            const templates = this.getTemplatesByCategory(category);
            stats[category] = {
                count: templates.length,
                averageSuccessRate: templates.reduce((sum, t) => sum + t.successRate, 0) / templates.length,
                totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0)
            };
        }

        return stats;
    }

    getStatsByIndustry() {
        const stats = {};
        const templates = Array.from(this.templates.values());

        for (const template of templates) {
            if (!stats[template.industry]) {
                stats[template.industry] = {
                    count: 0,
                    totalSuccessRate: 0,
                    totalUsage: 0
                };
            }

            stats[template.industry].count++;
            stats[template.industry].totalSuccessRate += template.successRate;
            stats[template.industry].totalUsage += template.usageCount;
        }

        // Calculate averages
        for (const industry in stats) {
            stats[industry].averageSuccessRate = 
                stats[industry].totalSuccessRate / stats[industry].count;
        }

        return stats;
    }

    // ==================== UTILITIES ====================

    generateTemplateId() {
        return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCategories() {
        return Array.from(this.categories);
    }

    searchTemplates(query) {
        const templates = Array.from(this.templates.values());
        const lowerQuery = query.toLowerCase();

        return templates.filter(t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.category.toLowerCase().includes(lowerQuery) ||
            t.industry.toLowerCase().includes(lowerQuery) ||
            t.content.toLowerCase().includes(lowerQuery)
        );
    }
}

module.exports = TemplateLibraryService;
