// Advanced Analytics Service - Phase 2
// Real-time metrics, visualizations, and predictive analytics

class AdvancedAnalyticsService {
    constructor() {
        this.metrics = new Map();
        this.events = [];
        this.aggregations = new Map();
        this.realTimeListeners = new Set();
        
        // Initialize metric trackers
        this.initializeMetrics();
    }

    // ==================== INITIALIZATION ====================

    initializeMetrics() {
        const metricDefinitions = [
            { key: 'total_users', name: 'Total Users', type: 'counter' },
            { key: 'active_users', name: 'Active Users', type: 'gauge' },
            { key: 'total_prospects', name: 'Total Prospects', type: 'counter' },
            { key: 'total_matches', name: 'Total Matches', type: 'counter' },
            { key: 'messages_sent', name: 'Messages Sent', type: 'counter' },
            { key: 'messages_opened', name: 'Messages Opened', type: 'counter' },
            { key: 'messages_replied', name: 'Messages Replied', type: 'counter' },
            { key: 'campaigns_active', name: 'Active Campaigns', type: 'gauge' },
            { key: 'campaigns_completed', name: 'Completed Campaigns', type: 'counter' },
            { key: 'avg_compatibility', name: 'Avg Compatibility Score', type: 'gauge' },
            { key: 'avg_response_rate', name: 'Avg Response Rate', type: 'gauge' },
            { key: 'credits_consumed', name: 'Credits Consumed', type: 'counter' },
            { key: 'revenue', name: 'Revenue', type: 'counter' }
        ];

        metricDefinitions.forEach(def => {
            this.metrics.set(def.key, {
                ...def,
                value: 0,
                history: [],
                lastUpdated: new Date()
            });
        });
    }

    // ==================== METRIC TRACKING ====================

    incrementMetric(key, amount = 1) {
        const metric = this.metrics.get(key);
        if (!metric) return;

        metric.value += amount;
        metric.lastUpdated = new Date();
        
        // Store in history for time-series analysis
        metric.history.push({
            value: metric.value,
            timestamp: new Date()
        });

        // Notify real-time listeners
        this.notifyListeners('metric_update', { key, value: metric.value });

        return metric.value;
    }

    setMetric(key, value) {
        const metric = this.metrics.get(key);
        if (!metric) return;

        metric.value = value;
        metric.lastUpdated = new Date();
        
        metric.history.push({
            value: metric.value,
            timestamp: new Date()
        });

        this.notifyListeners('metric_update', { key, value: metric.value });

        return metric.value;
    }

    getMetric(key) {
        return this.metrics.get(key);
    }

    getAllMetrics() {
        const result = {};
        for (const [key, metric] of this.metrics.entries()) {
            result[key] = {
                name: metric.name,
                value: metric.value,
                type: metric.type,
                lastUpdated: metric.lastUpdated
            };
        }
        return result;
    }

    // ==================== EVENT TRACKING ====================

    trackEvent(eventType, eventData = {}, userId = null) {
        const event = {
            id: this.generateEventId(),
            type: eventType,
            data: eventData,
            userId,
            timestamp: new Date()
        };

        this.events.push(event);

        // Update relevant metrics based on event type
        this.updateMetricsFromEvent(event);

        // Notify real-time listeners
        this.notifyListeners('event', event);

        return event;
    }

    updateMetricsFromEvent(event) {
        switch (event.type) {
            case 'user_registered':
                this.incrementMetric('total_users');
                break;
            case 'user_login':
                // Track active users
                break;
            case 'prospect_imported':
                this.incrementMetric('total_prospects', event.data.count || 1);
                break;
            case 'match_created':
                this.incrementMetric('total_matches');
                break;
            case 'message_sent':
                this.incrementMetric('messages_sent');
                break;
            case 'message_opened':
                this.incrementMetric('messages_opened');
                break;
            case 'message_replied':
                this.incrementMetric('messages_replied');
                break;
            case 'campaign_started':
                this.incrementMetric('campaigns_active');
                break;
            case 'campaign_completed':
                this.incrementMetric('campaigns_completed');
                this.incrementMetric('campaigns_active', -1);
                break;
            case 'credits_consumed':
                this.incrementMetric('credits_consumed', event.data.amount || 0);
                break;
            case 'payment_received':
                this.incrementMetric('revenue', event.data.amount || 0);
                break;
        }
    }

    getEvents(filters = {}) {
        let filtered = [...this.events];

        if (filters.type) {
            filtered = filtered.filter(e => e.type === filters.type);
        }

        if (filters.userId) {
            filtered = filtered.filter(e => e.userId === filters.userId);
        }

        if (filters.startDate) {
            filtered = filtered.filter(e => e.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter(e => e.timestamp <= filters.endDate);
        }

        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    // ==================== DASHBOARD METRICS ====================

    getDashboardMetrics() {
        const metrics = this.getAllMetrics();
        
        // Calculate derived metrics
        const openRate = metrics.messages_sent.value > 0
            ? (metrics.messages_opened.value / metrics.messages_sent.value) * 100
            : 0;

        const replyRate = metrics.messages_sent.value > 0
            ? (metrics.messages_replied.value / metrics.messages_sent.value) * 100
            : 0;

        const conversionRate = metrics.messages_sent.value > 0
            ? (metrics.messages_replied.value / metrics.messages_sent.value) * 100
            : 0;

        return {
            overview: {
                totalUsers: metrics.total_users.value,
                activeUsers: metrics.active_users.value,
                totalProspects: metrics.total_prospects.value,
                totalMatches: metrics.total_matches.value
            },
            messaging: {
                messagesSent: metrics.messages_sent.value,
                messagesOpened: metrics.messages_opened.value,
                messagesReplied: metrics.messages_replied.value,
                openRate: Math.round(openRate * 10) / 10,
                replyRate: Math.round(replyRate * 10) / 10,
                conversionRate: Math.round(conversionRate * 10) / 10
            },
            campaigns: {
                activeCampaigns: metrics.campaigns_active.value,
                completedCampaigns: metrics.campaigns_completed.value,
                totalCampaigns: metrics.campaigns_active.value + metrics.campaigns_completed.value
            },
            quality: {
                avgCompatibility: Math.round(metrics.avg_compatibility.value * 100),
                avgResponseRate: Math.round(metrics.avg_response_rate.value * 100)
            },
            business: {
                creditsConsumed: metrics.credits_consumed.value,
                revenue: metrics.revenue.value,
                avgRevenuePerUser: metrics.total_users.value > 0
                    ? Math.round((metrics.revenue.value / metrics.total_users.value) * 100) / 100
                    : 0
            }
        };
    }

    // ==================== CONVERSION FUNNEL ====================

    getConversionFunnel(userId = null) {
        const events = userId ? this.getEvents({ userId }) : this.events;

        const funnel = {
            profileCreated: 0,
            prospectsImported: 0,
            matchesFound: 0,
            messagesSent: 0,
            messagesOpened: 0,
            messagesReplied: 0,
            conversions: 0
        };

        const userStages = new Map();

        events.forEach(event => {
            const uid = event.userId || 'anonymous';
            
            if (!userStages.has(uid)) {
                userStages.set(uid, new Set());
            }

            const stages = userStages.get(uid);

            switch (event.type) {
                case 'profile_created':
                    stages.add('profileCreated');
                    break;
                case 'prospect_imported':
                    stages.add('prospectsImported');
                    break;
                case 'match_created':
                    stages.add('matchesFound');
                    break;
                case 'message_sent':
                    stages.add('messagesSent');
                    break;
                case 'message_opened':
                    stages.add('messagesOpened');
                    break;
                case 'message_replied':
                    stages.add('messagesReplied');
                    break;
                case 'conversion':
                    stages.add('conversions');
                    break;
            }
        });

        // Count users at each stage
        userStages.forEach(stages => {
            if (stages.has('profileCreated')) funnel.profileCreated++;
            if (stages.has('prospectsImported')) funnel.prospectsImported++;
            if (stages.has('matchesFound')) funnel.matchesFound++;
            if (stages.has('messagesSent')) funnel.messagesSent++;
            if (stages.has('messagesOpened')) funnel.messagesOpened++;
            if (stages.has('messagesReplied')) funnel.messagesReplied++;
            if (stages.has('conversions')) funnel.conversions++;
        });

        // Calculate conversion rates
        const total = funnel.profileCreated || 1;
        const funnelWithRates = {
            stages: funnel,
            conversionRates: {
                profileToImport: (funnel.prospectsImported / total) * 100,
                importToMatch: funnel.prospectsImported > 0 ? (funnel.matchesFound / funnel.prospectsImported) * 100 : 0,
                matchToMessage: funnel.matchesFound > 0 ? (funnel.messagesSent / funnel.matchesFound) * 100 : 0,
                messageToOpen: funnel.messagesSent > 0 ? (funnel.messagesOpened / funnel.messagesSent) * 100 : 0,
                openToReply: funnel.messagesOpened > 0 ? (funnel.messagesReplied / funnel.messagesOpened) * 100 : 0,
                replyToConversion: funnel.messagesReplied > 0 ? (funnel.conversions / funnel.messagesReplied) * 100 : 0
            },
            overallConversion: (funnel.conversions / total) * 100
        };

        return funnelWithRates;
    }

    // ==================== TIME-SERIES ANALYSIS ====================

    getTimeSeriesData(metricKey, period = '7d') {
        const metric = this.metrics.get(metricKey);
        if (!metric || !metric.history.length) {
            return [];
        }

        const now = new Date();
        const periodMs = this.parsePeriod(period);
        const startDate = new Date(now - periodMs);

        const filtered = metric.history.filter(h => h.timestamp >= startDate);

        // Group by time buckets
        const bucketSize = this.getBucketSize(period);
        const buckets = new Map();

        filtered.forEach(point => {
            const bucketKey = Math.floor(point.timestamp.getTime() / bucketSize) * bucketSize;
            if (!buckets.has(bucketKey)) {
                buckets.set(bucketKey, []);
            }
            buckets.get(bucketKey).push(point.value);
        });

        // Calculate average for each bucket
        const result = [];
        buckets.forEach((values, timestamp) => {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            result.push({
                timestamp: new Date(timestamp),
                value: Math.round(avg * 100) / 100
            });
        });

        return result.sort((a, b) => a.timestamp - b.timestamp);
    }

    parsePeriod(period) {
        const match = period.match(/^(\d+)([hdwm])$/);
        if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

        const [, amount, unit] = match;
        const multipliers = {
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
            m: 30 * 24 * 60 * 60 * 1000
        };

        return parseInt(amount) * multipliers[unit];
    }

    getBucketSize(period) {
        const match = period.match(/^(\d+)([hdwm])$/);
        if (!match) return 60 * 60 * 1000; // Default 1 hour

        const [, , unit] = match;
        const bucketSizes = {
            h: 5 * 60 * 1000,      // 5 minutes
            d: 60 * 60 * 1000,     // 1 hour
            w: 6 * 60 * 60 * 1000, // 6 hours
            m: 24 * 60 * 60 * 1000 // 1 day
        };

        return bucketSizes[unit];
    }

    // ==================== CAMPAIGN ANALYTICS ====================

    getCampaignAnalytics(campaignId) {
        const campaignEvents = this.getEvents({ type: 'campaign_*' });
        const messageEvents = this.getEvents({});

        const campaignMessages = messageEvents.filter(e => 
            e.data && e.data.campaignId === campaignId
        );

        const sent = campaignMessages.filter(e => e.type === 'message_sent').length;
        const opened = campaignMessages.filter(e => e.type === 'message_opened').length;
        const replied = campaignMessages.filter(e => e.type === 'message_replied').length;

        return {
            campaignId,
            messagesSent: sent,
            messagesOpened: opened,
            messagesReplied: replied,
            openRate: sent > 0 ? (opened / sent) * 100 : 0,
            replyRate: sent > 0 ? (replied / sent) * 100 : 0,
            conversionRate: sent > 0 ? (replied / sent) * 100 : 0,
            timeline: this.getCampaignTimeline(campaignId)
        };
    }

    getCampaignTimeline(campaignId) {
        const events = this.getEvents({}).filter(e => 
            e.data && e.data.campaignId === campaignId
        );

        return events.map(e => ({
            type: e.type,
            timestamp: e.timestamp,
            data: e.data
        }));
    }

    // ==================== A/B TEST ANALYTICS ====================

    getABTestResults(testId) {
        const testEvents = this.getEvents({}).filter(e => 
            e.data && e.data.abTestId === testId
        );

        const variants = new Map();

        testEvents.forEach(event => {
            const variantId = event.data.variantId;
            if (!variants.has(variantId)) {
                variants.set(variantId, {
                    variantId,
                    sent: 0,
                    opened: 0,
                    replied: 0
                });
            }

            const variant = variants.get(variantId);

            switch (event.type) {
                case 'message_sent':
                    variant.sent++;
                    break;
                case 'message_opened':
                    variant.opened++;
                    break;
                case 'message_replied':
                    variant.replied++;
                    break;
            }
        });

        const results = Array.from(variants.values()).map(v => ({
            ...v,
            openRate: v.sent > 0 ? (v.opened / v.sent) * 100 : 0,
            replyRate: v.sent > 0 ? (v.replied / v.sent) * 100 : 0
        }));

        // Determine winner
        const winner = results.reduce((best, current) => 
            current.replyRate > best.replyRate ? current : best
        , results[0]);

        return {
            testId,
            variants: results,
            winner: winner?.variantId,
            statisticalSignificance: this.calculateSignificance(results)
        };
    }

    calculateSignificance(variants) {
        // Simplified statistical significance calculation
        // In production, use proper statistical tests (chi-square, t-test)
        if (variants.length < 2) return 0;

        const [a, b] = variants;
        const diff = Math.abs(a.replyRate - b.replyRate);
        const minSampleSize = Math.min(a.sent, b.sent);

        if (minSampleSize < 30) return 0; // Not enough data

        // Rough approximation
        const significance = Math.min(100, (diff / 10) * (minSampleSize / 100) * 100);
        return Math.round(significance);
    }

    // ==================== ROI ANALYSIS ====================

    getROIAnalysis(userId = null) {
        const events = userId ? this.getEvents({ userId }) : this.events;

        const costs = {
            credits: 0,
            subscription: 0,
            total: 0
        };

        const returns = {
            conversions: 0,
            estimatedValue: 0
        };

        events.forEach(event => {
            if (event.type === 'credits_consumed') {
                costs.credits += event.data.amount || 0;
            }
            if (event.type === 'payment_received') {
                costs.subscription += event.data.amount || 0;
            }
            if (event.type === 'conversion') {
                returns.conversions++;
                returns.estimatedValue += event.data.value || 0;
            }
        });

        costs.total = costs.credits + costs.subscription;

        const roi = costs.total > 0 
            ? ((returns.estimatedValue - costs.total) / costs.total) * 100
            : 0;

        return {
            costs,
            returns,
            roi: Math.round(roi * 10) / 10,
            breakEven: costs.total > 0 ? Math.ceil(costs.total / (returns.estimatedValue / returns.conversions || 1)) : 0
        };
    }

    // ==================== PREDICTIVE ANALYTICS ====================

    predictResponseRate(userProfile, prospectProfile) {
        // Simple prediction based on historical data
        // In production, use ML model
        
        const historicalRate = this.metrics.get('avg_response_rate').value;
        
        // Adjust based on compatibility
        const compatibilityBonus = (userProfile.compatibility || 0.5) * 0.2;
        
        // Adjust based on message quality
        const messageQualityBonus = 0.1;
        
        const predicted = historicalRate + compatibilityBonus + messageQualityBonus;
        
        return Math.min(1, Math.max(0, predicted));
    }

    forecastMetric(metricKey, periods = 7) {
        const metric = this.metrics.get(metricKey);
        if (!metric || metric.history.length < 7) {
            return [];
        }

        // Simple linear regression for forecasting
        const recentData = metric.history.slice(-30);
        const trend = this.calculateTrend(recentData);

        const lastValue = recentData[recentData.length - 1].value;
        const lastTimestamp = recentData[recentData.length - 1].timestamp;

        const forecast = [];
        for (let i = 1; i <= periods; i++) {
            const predictedValue = lastValue + (trend * i);
            const predictedTimestamp = new Date(lastTimestamp.getTime() + (i * 24 * 60 * 60 * 1000));
            
            forecast.push({
                timestamp: predictedTimestamp,
                value: Math.max(0, Math.round(predictedValue * 100) / 100),
                confidence: Math.max(0, 100 - (i * 10)) // Confidence decreases with time
            });
        }

        return forecast;
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;

        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        data.forEach((point, index) => {
            sumX += index;
            sumY += point.value;
            sumXY += index * point.value;
            sumX2 += index * index;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    // ==================== REAL-TIME UPDATES ====================

    subscribe(listener) {
        this.realTimeListeners.add(listener);
        return () => this.realTimeListeners.delete(listener);
    }

    notifyListeners(eventType, data) {
        this.realTimeListeners.forEach(listener => {
            try {
                listener(eventType, data);
            } catch (error) {
                console.error('Error notifying listener:', error);
            }
        });
    }

    // ==================== DATA EXPORT ====================

    exportData(format = 'json', filters = {}) {
        const data = {
            metrics: this.getAllMetrics(),
            events: this.getEvents(filters),
            dashboard: this.getDashboardMetrics(),
            funnel: this.getConversionFunnel(),
            exportedAt: new Date()
        };

        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                return data;
        }
    }

    convertToCSV(data) {
        // Simple CSV conversion for metrics
        const rows = [['Metric', 'Value', 'Last Updated']];
        
        Object.entries(data.metrics).forEach(([key, metric]) => {
            rows.push([metric.name, metric.value, metric.lastUpdated]);
        });

        return rows.map(row => row.join(',')).join('\n');
    }

    // ==================== UTILITIES ====================

    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    reset() {
        this.metrics.clear();
        this.events = [];
        this.aggregations.clear();
        this.initializeMetrics();
    }
}

module.exports = AdvancedAnalyticsService;
