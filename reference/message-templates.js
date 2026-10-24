// Message Template System for StartHawk Outreach
// This module provides comprehensive message templating and personalization capabilities

class MessageTemplateSystem {
  constructor() {
    this.templates = new Map();
    this.variables = new Map();
    this.analytics = new Map();
    
    // Initialize with default templates
    this.initializeDefaultTemplates();
    this.initializeVariables();
  }
  
  initializeDefaultTemplates() {
    // Initial Outreach Templates
    this.addTemplate('initial_outreach_general', {
      name: 'Initial Outreach - General',
      category: 'initial',
      subject: 'Partnership Opportunity - {{IDEA_TITLE}}',
      body: `Hi {{NAME}},

I came across your profile on StartHawk and was impressed by {{SPECIFIC_DETAIL}}. Your background in {{THEIR_SKILLS}} caught my attention, and I believe there could be great synergy with my {{MY_ROLE}} experience.

I'm working on {{MY_IDEA}} and think your expertise would be invaluable. The project involves {{PROJECT_DESCRIPTION}} and I'm looking for someone with your skill set to join as a co-founder.

Would you be interested in a brief call to explore potential collaboration?

Best regards,
{{MY_NAME}}`,
      variables: ['NAME', 'SPECIFIC_DETAIL', 'THEIR_SKILLS', 'MY_ROLE', 'MY_IDEA', 'PROJECT_DESCRIPTION', 'MY_NAME'],
      successRate: 0.18,
      responseRate: 0.25,
      usageCount: 0
    });
    
    this.addTemplate('technical_cofounder', {
      name: 'Technical Co-founder Outreach',
      category: 'technical',
      subject: 'Technical Co-founder Opportunity - {{STARTUP_NAME}}',
      body: `Hello {{NAME}},

I'm reaching out because your development expertise in {{TECH_SKILLS}} aligns perfectly with what I'm looking for in a technical co-founder.

I'm building {{STARTUP_NAME}}, {{STARTUP_DESCRIPTION}}. The technical stack involves {{TECH_STACK}} which matches your background perfectly.

What I'm offering:
• {{EQUITY_PERCENTAGE}}% equity as co-founder
• {{TIME_COMMITMENT}} time commitment initially
• Opportunity to lead technical development
• {{ADDITIONAL_BENEFITS}}

Your profile shows exactly the kind of technical leadership we need. Would you be open to a conversation about this opportunity?

Looking forward to hearing from you,
{{MY_NAME}}
{{MY_TITLE}}`,
      variables: ['NAME', 'TECH_SKILLS', 'STARTUP_NAME', 'STARTUP_DESCRIPTION', 'TECH_STACK', 'EQUITY_PERCENTAGE', 'TIME_COMMITMENT', 'ADDITIONAL_BENEFITS', 'MY_NAME', 'MY_TITLE'],
      successRate: 0.22,
      responseRate: 0.31,
      usageCount: 0
    });
    
    this.addTemplate('business_cofounder', {
      name: 'Business Co-founder Outreach',
      category: 'business',
      subject: 'Business Partnership Opportunity',
      body: `Hi {{NAME}},

Your experience in {{BUSINESS_AREA}} and track record with {{SPECIFIC_ACHIEVEMENT}} makes you an ideal candidate for a business co-founder role I'm looking to fill.

I've developed {{PRODUCT_DESCRIPTION}} and need someone with your business acumen to help scale it. The opportunity includes:

• Leading {{BUSINESS_FUNCTIONS}}
• {{EQUITY_OFFER}} equity stake
• {{REVENUE_POTENTIAL}} revenue potential
• Flexible {{TIME_COMMITMENT}} schedule

Your background in {{THEIR_EXPERIENCE}} would be instrumental in achieving our goals of {{BUSINESS_GOALS}}.

Are you currently exploring new opportunities? I'd love to discuss this further.

Best,
{{MY_NAME}}`,
      variables: ['NAME', 'BUSINESS_AREA', 'SPECIFIC_ACHIEVEMENT', 'PRODUCT_DESCRIPTION', 'BUSINESS_FUNCTIONS', 'EQUITY_OFFER', 'REVENUE_POTENTIAL', 'TIME_COMMITMENT', 'THEIR_EXPERIENCE', 'BUSINESS_GOALS', 'MY_NAME'],
      successRate: 0.16,
      responseRate: 0.28,
      usageCount: 0
    });
    
    this.addTemplate('idea_collaboration', {
      name: 'Idea Collaboration',
      category: 'collaboration',
      subject: 'Love your {{THEIR_IDEA}} idea - Collaboration opportunity',
      body: `Hi {{NAME}},

I saw your startup idea about {{THEIR_IDEA}} on StartHawk and I'm genuinely excited about the concept. {{SPECIFIC_PRAISE}}.

I have a background in {{MY_EXPERTISE}} and have been working on something complementary in the {{RELATED_FIELD}} space. I think there might be an opportunity for us to collaborate or even merge our efforts.

My experience includes:
• {{EXPERIENCE_1}}
• {{EXPERIENCE_2}}
• {{EXPERIENCE_3}}

I'd love to learn more about your vision and share what I've been working on. Perhaps we can find a way to combine our strengths?

Would you be open to a conversation?

{{MY_NAME}}
{{MY_CONTACT}}`,
      variables: ['NAME', 'THEIR_IDEA', 'SPECIFIC_PRAISE', 'MY_EXPERTISE', 'RELATED_FIELD', 'EXPERIENCE_1', 'EXPERIENCE_2', 'EXPERIENCE_3', 'MY_NAME', 'MY_CONTACT'],
      successRate: 0.24,
      responseRate: 0.35,
      usageCount: 0
    });
    
    this.addTemplate('skill_exchange', {
      name: 'Skill Exchange Partnership',
      category: 'exchange',
      subject: 'Skill Exchange Opportunity - {{MY_SKILL}} for {{THEIR_SKILL}}',
      body: `Hello {{NAME}},

I noticed on your StartHawk profile that you're looking for someone with {{MY_SKILL}} expertise, while you have strong {{THEIR_SKILL}} skills. This seems like a perfect opportunity for collaboration!

I'm {{MY_BACKGROUND}} and have been looking for someone with your {{THEIR_SKILL}} background to partner with on {{PROJECT_TYPE}} projects.

What I bring:
• {{MY_SKILL_DETAILS}}
• {{MY_EXPERIENCE}}
• {{MY_RESOURCES}}

What I'm looking for:
• {{THEIR_SKILL_NEEDS}}
• {{COLLABORATION_TYPE}}
• {{TIME_FRAME}}

Your profile suggests we could create something great together. Interested in exploring this?

{{MY_NAME}}`,
      variables: ['NAME', 'MY_SKILL', 'THEIR_SKILL', 'MY_BACKGROUND', 'PROJECT_TYPE', 'MY_SKILL_DETAILS', 'MY_EXPERIENCE', 'MY_RESOURCES', 'THEIR_SKILL_NEEDS', 'COLLABORATION_TYPE', 'TIME_FRAME', 'MY_NAME'],
      successRate: 0.20,
      responseRate: 0.29,
      usageCount: 0
    });
    
    // Follow-up Templates
    this.addTemplate('follow_up_1', {
      name: 'First Follow-up',
      category: 'followup',
      subject: 'Re: {{ORIGINAL_SUBJECT}}',
      body: `Hi {{NAME}},

I wanted to follow up on my message from {{DAYS_AGO}} days ago about {{OPPORTUNITY_BRIEF}}.

I understand you're probably busy, but I wanted to make sure you saw my message. The opportunity I mentioned could be a great fit given your background in {{THEIR_EXPERTISE}}.

If you're not interested, no worries at all - just let me know and I won't follow up again.

If you are interested but just haven't had time to respond, would a quick 15-minute call work better for you?

Thanks,
{{MY_NAME}}`,
      variables: ['NAME', 'ORIGINAL_SUBJECT', 'DAYS_AGO', 'OPPORTUNITY_BRIEF', 'THEIR_EXPERTISE', 'MY_NAME'],
      successRate: 0.12,
      responseRate: 0.18,
      usageCount: 0
    });
    
    this.addTemplate('follow_up_final', {
      name: 'Final Follow-up',
      category: 'followup',
      subject: 'Final follow-up - {{OPPORTUNITY_TYPE}}',
      body: `Hi {{NAME}},

This will be my final message about the {{OPPORTUNITY_TYPE}} opportunity I mentioned.

I completely understand if you're not interested or if the timing isn't right. I just wanted to give it one last try because I genuinely think we could create something amazing together.

If you change your mind in the future, feel free to reach out. I'll be here.

Wishing you all the best with your ventures,
{{MY_NAME}}`,
      variables: ['NAME', 'OPPORTUNITY_TYPE', 'MY_NAME'],
      successRate: 0.08,
      responseRate: 0.15,
      usageCount: 0
    });
  }
  
  initializeVariables() {
    // Personal variables
    this.addVariable('MY_NAME', {
      description: 'Your full name',
      category: 'personal',
      required: true,
      defaultValue: ''
    });
    
    this.addVariable('MY_TITLE', {
      description: 'Your professional title',
      category: 'personal',
      required: false,
      defaultValue: 'Entrepreneur'
    });
    
    this.addVariable('MY_CONTACT', {
      description: 'Your contact information',
      category: 'personal',
      required: false,
      defaultValue: ''
    });
    
    // Project variables
    this.addVariable('MY_IDEA', {
      description: 'Brief description of your startup idea',
      category: 'project',
      required: true,
      defaultValue: ''
    });
    
    this.addVariable('STARTUP_NAME', {
      description: 'Name of your startup',
      category: 'project',
      required: false,
      defaultValue: ''
    });
    
    this.addVariable('STARTUP_DESCRIPTION', {
      description: 'Detailed description of your startup',
      category: 'project',
      required: false,
      defaultValue: ''
    });
    
    // Recipient variables (auto-populated from profile)
    this.addVariable('NAME', {
      description: 'Recipient\'s name',
      category: 'recipient',
      required: true,
      autoPopulate: true,
      source: 'profile.name'
    });
    
    this.addVariable('THEIR_SKILLS', {
      description: 'Recipient\'s skills',
      category: 'recipient',
      required: false,
      autoPopulate: true,
      source: 'profile.has_skills'
    });
    
    this.addVariable('THEIR_IDEA', {
      description: 'Recipient\'s startup idea',
      category: 'recipient',
      required: false,
      autoPopulate: true,
      source: 'profile.idea_title'
    });
  }
  
  // Template Management
  addTemplate(id, template) {
    this.templates.set(id, {
      id,
      ...template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  getTemplate(id) {
    return this.templates.get(id);
  }
  
  getAllTemplates() {
    return Array.from(this.templates.values());
  }
  
  getTemplatesByCategory(category) {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }
  
  updateTemplate(id, updates) {
    const template = this.templates.get(id);
    if (template) {
      this.templates.set(id, {
        ...template,
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  }
  
  deleteTemplate(id) {
    return this.templates.delete(id);
  }
  
  // Variable Management
  addVariable(name, config) {
    this.variables.set(name, {
      name,
      ...config
    });
  }
  
  getVariable(name) {
    return this.variables.get(name);
  }
  
  getAllVariables() {
    return Array.from(this.variables.values());
  }
  
  getVariablesByCategory(category) {
    return Array.from(this.variables.values()).filter(variable => variable.category === category);
  }
  
  // Message Generation
  generateMessage(templateId, variables = {}, profile = null) {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      // Auto-populate variables from profile if available
      const allVariables = { ...variables };
      if (profile) {
        allVariables.NAME = profile.name || '';
        allVariables.THEIR_SKILLS = (profile.has_skills || []).join(', ');
        allVariables.THEIR_IDEA = profile.idea_title || '';
        allVariables.THEIR_EXPERIENCE = profile.about_text || '';
        allVariables.LOCATION = profile.location_country || '';
      }
      
      // Generate subject and body
      const subject = this.replaceVariables(template.subject, allVariables);
      const body = this.replaceVariables(template.body, allVariables);
      
      // Update usage statistics
      this.updateTemplateUsage(templateId);
      
      return {
        templateId,
        subject,
        body,
        variables: allVariables,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating message:', error);
      throw error;
    }
  }
  
  replaceVariables(text, variables) {
    let result = text;
    
    // Replace all variables in the format {{VARIABLE_NAME}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, variables[key] || `[${key}]`);
    });
    
    return result;
  }
  
  // Personalization
  personalizeMessage(templateId, profile, userPreferences = {}) {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      // Generate personalized variables based on profile analysis
      const personalizedVariables = this.generatePersonalizedVariables(profile, userPreferences);
      
      // Generate the message
      const message = this.generateMessage(templateId, personalizedVariables, profile);
      
      // Add personalization score
      message.personalizationScore = this.calculatePersonalizationScore(message, profile);
      
      return message;
    } catch (error) {
      console.error('Error personalizing message:', error);
      throw error;
    }
  }
  
  generatePersonalizedVariables(profile, userPreferences) {
    const variables = {};
    
    // Analyze profile for personalization opportunities
    if (profile.has_skills && profile.has_skills.length > 0) {
      variables.SPECIFIC_DETAIL = `your expertise in ${profile.has_skills[0]}`;
      variables.THEIR_SKILLS = profile.has_skills.join(', ');
    }
    
    if (profile.idea_title) {
      variables.SPECIFIC_PRAISE = `The concept has real potential in today's market`;
    }
    
    if (profile.location_country) {
      variables.LOCATION_REFERENCE = profile.location_country === 'United States' ? 
        'being in the same country' : `your perspective from ${profile.location_country}`;
    }
    
    // Add user preferences
    Object.assign(variables, userPreferences);
    
    return variables;
  }
  
  calculatePersonalizationScore(message, profile) {
    let score = 0;
    const maxScore = 100;
    
    // Check for personalized elements
    if (message.body.includes(profile.name)) score += 20;
    if (profile.has_skills && profile.has_skills.some(skill => message.body.includes(skill))) score += 25;
    if (profile.idea_title && message.body.includes(profile.idea_title)) score += 25;
    if (profile.location_country && message.body.includes(profile.location_country)) score += 15;
    if (message.body.length > 200) score += 15; // Detailed message
    
    return Math.min(score, maxScore);
  }
  
  // A/B Testing
  createABTest(name, templateIds, splitPercentage = 50) {
    const testId = this.generateTestId();
    const test = {
      id: testId,
      name,
      templateIds,
      splitPercentage,
      status: 'active',
      results: {
        templateA: { sent: 0, responses: 0, responseRate: 0 },
        templateB: { sent: 0, responses: 0, responseRate: 0 }
      },
      createdAt: new Date().toISOString()
    };
    
    // Store test (in a real implementation, this would be in a database)
    this.analytics.set(testId, test);
    
    return test;
  }
  
  getABTestTemplate(testId) {
    const test = this.analytics.get(testId);
    if (!test || test.status !== 'active') {
      return null;
    }
    
    // Simple random selection based on split percentage
    const useTemplateA = Math.random() * 100 < test.splitPercentage;
    return useTemplateA ? test.templateIds[0] : test.templateIds[1];
  }
  
  recordABTestResult(testId, templateId, sent = false, response = false) {
    const test = this.analytics.get(testId);
    if (!test) return;
    
    const isTemplateA = templateId === test.templateIds[0];
    const resultKey = isTemplateA ? 'templateA' : 'templateB';
    
    if (sent) {
      test.results[resultKey].sent++;
    }
    
    if (response) {
      test.results[resultKey].responses++;
    }
    
    // Update response rate
    if (test.results[resultKey].sent > 0) {
      test.results[resultKey].responseRate = 
        test.results[resultKey].responses / test.results[resultKey].sent;
    }
    
    this.analytics.set(testId, test);
  }
  
  // Analytics and Optimization
  updateTemplateUsage(templateId) {
    const template = this.getTemplate(templateId);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      this.templates.set(templateId, template);
    }
  }
  
  recordTemplateResponse(templateId, wasSuccessful = false) {
    const template = this.getTemplate(templateId);
    if (template) {
      template.totalResponses = (template.totalResponses || 0) + 1;
      if (wasSuccessful) {
        template.successfulResponses = (template.successfulResponses || 0) + 1;
      }
      
      // Update success rate
      template.successRate = template.successfulResponses / template.totalResponses;
      
      this.templates.set(templateId, template);
    }
  }
  
  getTemplateAnalytics(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) return null;
    
    return {
      templateId,
      name: template.name,
      usageCount: template.usageCount || 0,
      totalResponses: template.totalResponses || 0,
      successfulResponses: template.successfulResponses || 0,
      successRate: template.successRate || 0,
      responseRate: template.responseRate || 0,
      lastUsed: template.lastUsed || null
    };
  }
  
  getTopPerformingTemplates(limit = 5) {
    return Array.from(this.templates.values())
      .filter(template => template.usageCount > 0)
      .sort((a, b) => (b.successRate || 0) - (a.successRate || 0))
      .slice(0, limit)
      .map(template => this.getTemplateAnalytics(template.id));
  }
  
  // Template Suggestions
  suggestTemplate(profile, userGoals = {}) {
    try {
      const suggestions = [];
      
      // Analyze profile to suggest appropriate templates
      if (profile.partnership_status === 'Has an idea for a startup') {
        suggestions.push({
          templateId: 'idea_collaboration',
          reason: 'Recipient has their own startup idea',
          confidence: 0.8
        });
      }
      
      if (profile.partnership_status === 'Looking to partner with someone else\'s idea') {
        if (profile.has_skills && profile.has_skills.some(skill => 
          ['Developer', 'Development', 'React', 'Node.js', 'Python'].some(tech => skill.includes(tech)))) {
          suggestions.push({
            templateId: 'technical_cofounder',
            reason: 'Recipient has technical skills and is looking to join projects',
            confidence: 0.9
          });
        } else {
          suggestions.push({
            templateId: 'business_cofounder',
            reason: 'Recipient is looking to join projects and has business skills',
            confidence: 0.7
          });
        }
      }
      
      if (profile.wants_skills && profile.wants_skills.length > 0) {
        suggestions.push({
          templateId: 'skill_exchange',
          reason: 'Recipient is looking for specific skills',
          confidence: 0.6
        });
      }
      
      // Default suggestion
      if (suggestions.length === 0) {
        suggestions.push({
          templateId: 'initial_outreach_general',
          reason: 'General outreach template',
          confidence: 0.5
        });
      }
      
      // Sort by confidence
      suggestions.sort((a, b) => b.confidence - a.confidence);
      
      return suggestions;
    } catch (error) {
      console.error('Error suggesting template:', error);
      return [{
        templateId: 'initial_outreach_general',
        reason: 'Default template due to error',
        confidence: 0.3
      }];
    }
  }
  
  // Utility Methods
  generateTestId() {
    return 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  validateTemplate(template) {
    const errors = [];
    
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }
    
    if (!template.subject || template.subject.trim().length === 0) {
      errors.push('Template subject is required');
    }
    
    if (!template.body || template.body.trim().length === 0) {
      errors.push('Template body is required');
    }
    
    if (template.body && template.body.length > 2000) {
      errors.push('Template body is too long (max 2000 characters)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  exportTemplates() {
    return {
      templates: Array.from(this.templates.values()),
      variables: Array.from(this.variables.values()),
      exportedAt: new Date().toISOString()
    };
  }
  
  importTemplates(data) {
    try {
      if (data.templates) {
        data.templates.forEach(template => {
          this.templates.set(template.id, template);
        });
      }
      
      if (data.variables) {
        data.variables.forEach(variable => {
          this.variables.set(variable.name, variable);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error importing templates:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageTemplateSystem;
} else if (typeof window !== 'undefined') {
  window.MessageTemplateSystem = MessageTemplateSystem;
}

