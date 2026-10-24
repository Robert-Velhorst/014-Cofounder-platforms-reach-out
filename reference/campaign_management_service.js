// Automated Campaign Management Service - Phase 2
// Multi-step campaigns with scheduling, follow-ups, and conditional logic

const EventEmitter = require('events');

class CampaignManagementService extends EventEmitter {
    constructor(messageService, analyticsService) {
        super();
        this.messageService = messageService;
        this.analyticsService = analyticsService;
        
        this.campaigns = new Map();
        this.campaignExecutions = new Map();
        this.scheduledJobs = new Map();
        this.templates = new Map();
        
        // Initialize default templates
        this.initializeTemplates();
        
        // Start job processor
        this.startJobProcessor();
    }

    // ==================== INITIALIZATION ====================

    initializeTemplates() {
        const defaultTemplates = [
            {
                id: 'intro_follow_convert',
                name: 'Introduction → Follow-up → Conversion',
                description: 'Standard 3-step outreach sequence',
                steps: [
                    {
                        order: 1,
                        type: 'message',
                        templateType: 'introduction',
                        delayHours: 0,
                        conditions: []
                    },
                    {
                        order: 2,
                        type: 'message',
                        templateType: 'follow_up',
                        delayHours: 72, // 3 days
                        conditions: [
                            { field: 'previous_step_opened', operator: 'equals', value: false }
                        ]
                    },
                    {
                        order: 3,
                        type: 'message',
                        templateType: 'conversion',
                        delayHours: 120, // 5 days
                        conditions: [
                            { field: 'previous_step_opened', operator: 'equals', value: true },
                            { field: 'previous_step_replied', operator: 'equals', value: false }
                        ]
                    }
                ]
            },
            {
                id: 'aggressive_outreach',
                name: 'Aggressive Multi-Touch',
                description: '5-step high-frequency outreach',
                steps: [
                    { order: 1, type: 'message', templateType: 'introduction', delayHours: 0 },
                    { order: 2, type: 'message', templateType: 'follow_up', delayHours: 48 },
                    { order: 3, type: 'message', templateType: 'value_add', delayHours: 96 },
                    { order: 4, type: 'message', templateType: 'case_study', delayHours: 168 },
                    { order: 5, type: 'message', templateType: 'final_attempt', delayHours: 240 }
                ]
            }
        ];

        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }

    startJobProcessor() {
        // Process scheduled jobs every minute
        this.jobProcessorInterval = setInterval(() => {
            this.processScheduledJobs();
        }, 60000); // 60 seconds
    }

    // ==================== CAMPAIGN CREATION ====================

    createCampaign(userId, campaignData) {
        const campaign = {
            id: this.generateCampaignId(),
            userId,
            name: campaignData.name,
            description: campaignData.description || '',
            status: 'draft',
            workflow: campaignData.workflow || this.templates.get('intro_follow_convert').steps,
            settings: {
                autoStart: campaignData.autoStart || false,
                stopOnReply: campaignData.stopOnReply !== false,
                respectTimezone: campaignData.respectTimezone !== false,
                sendingHours: campaignData.sendingHours || { start: 9, end: 17 },
                sendingDays: campaignData.sendingDays || [1, 2, 3, 4, 5], // Mon-Fri
                ...campaignData.settings
            },
            prospects: [],
            stats: {
                totalProspects: 0,
                messagesScheduled: 0,
                messagesSent: 0,
                messagesOpened: 0,
                messagesReplied: 0,
                conversions: 0,
                unsubscribes: 0
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            startedAt: null,
            completedAt: null
        };

        this.campaigns.set(campaign.id, campaign);
        
        // Track in analytics
        if (this.analyticsService) {
            this.analyticsService.trackEvent('campaign_created', {
                campaignId: campaign.id,
                campaignName: campaign.name
            }, userId);
        }

        this.emit('campaign_created', campaign);
        return campaign;
    }

    // ==================== CAMPAIGN MANAGEMENT ====================

    getCampaign(campaignId) {
        return this.campaigns.get(campaignId);
    }

    getAllCampaigns(userId = null) {
        let campaigns = Array.from(this.campaigns.values());
        
        if (userId) {
            campaigns = campaigns.filter(c => c.userId === userId);
        }

        return campaigns.sort((a, b) => b.createdAt - a.createdAt);
    }

    updateCampaign(campaignId, updates) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return null;

        // Prevent updates to running campaigns
        if (campaign.status === 'running' && updates.workflow) {
            throw new Error('Cannot modify workflow of running campaign');
        }

        Object.assign(campaign, updates, {
            updatedAt: new Date()
        });

        this.campaigns.set(campaignId, campaign);
        this.emit('campaign_updated', campaign);
        return campaign;
    }

    deleteCampaign(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return false;

        // Stop campaign if running
        if (campaign.status === 'running') {
            this.stopCampaign(campaignId);
        }

        this.campaigns.delete(campaignId);
        this.emit('campaign_deleted', { campaignId });
        return true;
    }

    // ==================== CAMPAIGN EXECUTION ====================

    async startCampaign(campaignId, prospects = []) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status === 'running') {
            throw new Error('Campaign is already running');
        }

        // Add prospects to campaign
        if (prospects.length > 0) {
            campaign.prospects = prospects.map(p => ({
                prospectId: p.id || p.prospectId,
                status: 'pending',
                currentStep: 0,
                addedAt: new Date()
            }));
            campaign.stats.totalProspects = prospects.length;
        }

        // Update campaign status
        campaign.status = 'running';
        campaign.startedAt = new Date();
        this.campaigns.set(campaignId, campaign);

        // Create execution tracker
        const execution = {
            campaignId,
            startedAt: new Date(),
            steps: new Map(),
            prospects: new Map()
        };

        this.campaignExecutions.set(campaignId, execution);

        // Schedule first step for all prospects
        for (const prospect of campaign.prospects) {
            await this.scheduleNextStep(campaignId, prospect.prospectId);
        }

        // Track in analytics
        if (this.analyticsService) {
            this.analyticsService.trackEvent('campaign_started', {
                campaignId,
                campaignName: campaign.name,
                prospectCount: prospects.length
            }, campaign.userId);
        }

        this.emit('campaign_started', campaign);
        return campaign;
    }

    async pauseCampaign(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        campaign.status = 'paused';
        campaign.updatedAt = new Date();
        this.campaigns.set(campaignId, campaign);

        // Cancel all scheduled jobs for this campaign
        this.cancelCampaignJobs(campaignId);

        this.emit('campaign_paused', campaign);
        return campaign;
    }

    async resumeCampaign(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        campaign.status = 'running';
        campaign.updatedAt = new Date();
        this.campaigns.set(campaignId, campaign);

        // Reschedule pending jobs
        for (const prospect of campaign.prospects) {
            if (prospect.status === 'pending' || prospect.status === 'in_progress') {
                await this.scheduleNextStep(campaignId, prospect.prospectId);
            }
        }

        this.emit('campaign_resumed', campaign);
        return campaign;
    }

    async stopCampaign(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        campaign.status = 'stopped';
        campaign.completedAt = new Date();
        campaign.updatedAt = new Date();
        this.campaigns.set(campaignId, campaign);

        // Cancel all scheduled jobs
        this.cancelCampaignJobs(campaignId);

        // Track in analytics
        if (this.analyticsService) {
            this.analyticsService.trackEvent('campaign_stopped', {
                campaignId,
                campaignName: campaign.name
            }, campaign.userId);
        }

        this.emit('campaign_stopped', campaign);
        return campaign;
    }

    // ==================== STEP SCHEDULING ====================

    async scheduleNextStep(campaignId, prospectId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return;

        const prospect = campaign.prospects.find(p => p.prospectId === prospectId);
        if (!prospect) return;

        const nextStepIndex = prospect.currentStep;
        const nextStep = campaign.workflow[nextStepIndex];

        if (!nextStep) {
            // Campaign completed for this prospect
            prospect.status = 'completed';
            return;
        }

        // Check conditions
        if (nextStep.conditions && nextStep.conditions.length > 0) {
            const conditionsMet = await this.evaluateConditions(
                nextStep.conditions,
                campaignId,
                prospectId
            );

            if (!conditionsMet) {
                // Skip this step and move to next
                prospect.currentStep++;
                await this.scheduleNextStep(campaignId, prospectId);
                return;
            }
        }

        // Calculate execution time
        const executionTime = this.calculateExecutionTime(
            nextStep.delayHours,
            campaign.settings
        );

        // Create scheduled job
        const job = {
            id: this.generateJobId(),
            campaignId,
            prospectId,
            stepIndex: nextStepIndex,
            step: nextStep,
            scheduledFor: executionTime,
            status: 'scheduled',
            createdAt: new Date()
        };

        this.scheduledJobs.set(job.id, job);
        prospect.status = 'in_progress';
        campaign.stats.messagesScheduled++;

        this.emit('step_scheduled', { campaignId, prospectId, job });
    }

    calculateExecutionTime(delayHours, settings) {
        const now = new Date();
        let executionTime = new Date(now.getTime() + (delayHours * 60 * 60 * 1000));

        if (settings.respectTimezone && settings.sendingHours) {
            // Adjust to sending hours
            const hour = executionTime.getHours();
            if (hour < settings.sendingHours.start) {
                executionTime.setHours(settings.sendingHours.start, 0, 0, 0);
            } else if (hour >= settings.sendingHours.end) {
                // Move to next day
                executionTime.setDate(executionTime.getDate() + 1);
                executionTime.setHours(settings.sendingHours.start, 0, 0, 0);
            }

            // Check if it's a sending day
            const dayOfWeek = executionTime.getDay();
            if (!settings.sendingDays.includes(dayOfWeek)) {
                // Move to next sending day
                let daysToAdd = 1;
                while (!settings.sendingDays.includes((dayOfWeek + daysToAdd) % 7)) {
                    daysToAdd++;
                }
                executionTime.setDate(executionTime.getDate() + daysToAdd);
                executionTime.setHours(settings.sendingHours.start, 0, 0, 0);
            }
        }

        return executionTime;
    }

    async evaluateConditions(conditions, campaignId, prospectId) {
        const execution = this.campaignExecutions.get(campaignId);
        if (!execution) return true;

        const prospectData = execution.prospects.get(prospectId) || {};

        for (const condition of conditions) {
            const value = prospectData[condition.field];
            
            switch (condition.operator) {
                case 'equals':
                    if (value !== condition.value) return false;
                    break;
                case 'not_equals':
                    if (value === condition.value) return false;
                    break;
                case 'greater_than':
                    if (!(value > condition.value)) return false;
                    break;
                case 'less_than':
                    if (!(value < condition.value)) return false;
                    break;
                case 'contains':
                    if (!value || !value.includes(condition.value)) return false;
                    break;
            }
        }

        return true;
    }

    // ==================== JOB PROCESSING ====================

    async processScheduledJobs() {
        const now = new Date();
        const jobsToExecute = [];

        // Find jobs ready for execution
        for (const [jobId, job] of this.scheduledJobs.entries()) {
            if (job.status === 'scheduled' && job.scheduledFor <= now) {
                jobsToExecute.push(job);
            }
        }

        // Execute jobs
        for (const job of jobsToExecute) {
            await this.executeJob(job);
        }
    }

    async executeJob(job) {
        const campaign = this.campaigns.get(job.campaignId);
        if (!campaign || campaign.status !== 'running') {
            job.status = 'cancelled';
            return;
        }

        try {
            job.status = 'executing';
            this.scheduledJobs.set(job.id, job);

            // Execute the step
            await this.executeStep(job);

            job.status = 'completed';
            job.completedAt = new Date();
            this.scheduledJobs.set(job.id, job);

            // Update prospect progress
            const prospect = campaign.prospects.find(p => p.prospectId === job.prospectId);
            if (prospect) {
                prospect.currentStep++;
                
                // Check if campaign should stop (e.g., prospect replied)
                if (campaign.settings.stopOnReply && prospect.replied) {
                    prospect.status = 'completed';
                } else {
                    // Schedule next step
                    await this.scheduleNextStep(job.campaignId, job.prospectId);
                }
            }

            this.emit('job_completed', job);
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.scheduledJobs.set(job.id, job);
            this.emit('job_failed', { job, error });
        }
    }

    async executeStep(job) {
        const { campaignId, prospectId, step } = job;
        const campaign = this.campaigns.get(campaignId);

        switch (step.type) {
            case 'message':
                await this.sendMessage(campaign, prospectId, step);
                break;
            case 'wait':
                // Just wait, nothing to do
                break;
            case 'webhook':
                await this.triggerWebhook(campaign, prospectId, step);
                break;
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }

    async sendMessage(campaign, prospectId, step) {
        // Generate message using message service
        if (!this.messageService) {
            console.warn('Message service not available');
            return;
        }

        try {
            const message = await this.messageService.generatePersonalizedMessage(
                { userId: campaign.userId },
                { id: prospectId },
                { 
                    tone: step.tone || 'professional',
                    templateType: step.templateType 
                }
            );

            // Update stats
            campaign.stats.messagesSent++;
            this.campaigns.set(campaign.id, campaign);

            // Track in analytics
            if (this.analyticsService) {
                this.analyticsService.trackEvent('message_sent', {
                    campaignId: campaign.id,
                    prospectId,
                    stepType: step.templateType
                }, campaign.userId);
            }

            // Update execution tracker
            const execution = this.campaignExecutions.get(campaign.id);
            if (execution) {
                if (!execution.prospects.has(prospectId)) {
                    execution.prospects.set(prospectId, {});
                }
                const prospectData = execution.prospects.get(prospectId);
                prospectData.last_message_sent = new Date();
                prospectData.messages_sent = (prospectData.messages_sent || 0) + 1;
            }

            this.emit('message_sent', { campaign, prospectId, message });
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async triggerWebhook(campaign, prospectId, step) {
        // Trigger external webhook
        console.log(`Triggering webhook for campaign ${campaign.id}, prospect ${prospectId}`);
        // Implementation would make HTTP request to webhook URL
    }

    // ==================== EVENT TRACKING ====================

    trackMessageOpened(campaignId, prospectId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return;

        campaign.stats.messagesOpened++;
        this.campaigns.set(campaignId, campaign);

        const execution = this.campaignExecutions.get(campaignId);
        if (execution) {
            const prospectData = execution.prospects.get(prospectId) || {};
            prospectData.previous_step_opened = true;
            prospectData.last_opened = new Date();
            execution.prospects.set(prospectId, prospectData);
        }

        if (this.analyticsService) {
            this.analyticsService.trackEvent('message_opened', {
                campaignId,
                prospectId
            }, campaign.userId);
        }
    }

    trackMessageReplied(campaignId, prospectId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return;

        campaign.stats.messagesReplied++;
        this.campaigns.set(campaignId, campaign);

        const prospect = campaign.prospects.find(p => p.prospectId === prospectId);
        if (prospect) {
            prospect.replied = true;
            
            // Stop campaign for this prospect if configured
            if (campaign.settings.stopOnReply) {
                prospect.status = 'completed';
                this.cancelProspectJobs(campaignId, prospectId);
            }
        }

        const execution = this.campaignExecutions.get(campaignId);
        if (execution) {
            const prospectData = execution.prospects.get(prospectId) || {};
            prospectData.previous_step_replied = true;
            prospectData.replied_at = new Date();
            execution.prospects.set(prospectId, prospectData);
        }

        if (this.analyticsService) {
            this.analyticsService.trackEvent('message_replied', {
                campaignId,
                prospectId
            }, campaign.userId);
        }
    }

    // ==================== CAMPAIGN ANALYTICS ====================

    getCampaignStats(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return null;

        const stats = { ...campaign.stats };

        // Calculate rates
        stats.openRate = stats.messagesSent > 0 
            ? (stats.messagesOpened / stats.messagesSent) * 100 
            : 0;
        
        stats.replyRate = stats.messagesSent > 0 
            ? (stats.messagesReplied / stats.messagesSent) * 100 
            : 0;

        stats.conversionRate = stats.messagesSent > 0 
            ? (stats.conversions / stats.messagesSent) * 100 
            : 0;

        // Prospect status breakdown
        stats.prospectStatus = {
            pending: campaign.prospects.filter(p => p.status === 'pending').length,
            in_progress: campaign.prospects.filter(p => p.status === 'in_progress').length,
            completed: campaign.prospects.filter(p => p.status === 'completed').length,
            failed: campaign.prospects.filter(p => p.status === 'failed').length
        };

        return stats;
    }

    // ==================== UTILITIES ====================

    cancelCampaignJobs(campaignId) {
        for (const [jobId, job] of this.scheduledJobs.entries()) {
            if (job.campaignId === campaignId && job.status === 'scheduled') {
                job.status = 'cancelled';
                this.scheduledJobs.set(jobId, job);
            }
        }
    }

    cancelProspectJobs(campaignId, prospectId) {
        for (const [jobId, job] of this.scheduledJobs.entries()) {
            if (job.campaignId === campaignId && 
                job.prospectId === prospectId && 
                job.status === 'scheduled') {
                job.status = 'cancelled';
                this.scheduledJobs.set(jobId, job);
            }
        }
    }

    generateCampaignId() {
        return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanup() {
        if (this.jobProcessorInterval) {
            clearInterval(this.jobProcessorInterval);
        }
    }
}

module.exports = CampaignManagementService;
