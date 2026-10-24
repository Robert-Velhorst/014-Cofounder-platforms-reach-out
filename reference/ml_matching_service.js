// Enhanced ML Matching Service - Phase 2
// Machine learning-powered matching with collaborative filtering and feedback loops

class MLMatchingService {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        
        // Training data storage
        this.matchHistory = [];
        this.userFeedback = [];
        this.successfulMatches = [];
        
        // Feature weights (learned from data)
        this.featureWeights = {
            skills: 0.25,
            personality: 0.20,
            goals: 0.20,
            values: 0.15,
            workStyle: 0.10,
            availability: 0.10
        };

        // Collaborative filtering data
        this.userSimilarities = new Map();
        this.prospectPopularity = new Map();
        
        // Model performance metrics
        this.modelMetrics = {
            accuracy: 0,
            precision: 0,
            recall: 0,
            f1Score: 0,
            lastTrainedAt: null,
            trainingDataSize: 0
        };
    }

    // ==================== ENHANCED COMPATIBILITY SCORING ====================

    async calculateEnhancedCompatibility(userProfile, prospectProfile) {
        // Base compatibility calculation (from Phase 1)
        const baseScore = this.calculateBaseCompatibility(userProfile, prospectProfile);

        // ML-enhanced adjustments
        const mlAdjustments = await this.applyMLEnhancements(
            userProfile,
            prospectProfile,
            baseScore
        );

        // Collaborative filtering boost
        const collaborativeBoost = this.getCollaborativeFilteringBoost(
            userProfile,
            prospectProfile
        );

        // Historical success pattern matching
        const historicalBoost = this.getHistoricalSuccessBoost(
            userProfile,
            prospectProfile
        );

        // Combine scores with learned weights
        const enhancedScore = {
            base: baseScore.overall,
            mlAdjusted: baseScore.overall + mlAdjustments,
            collaborative: collaborativeBoost,
            historical: historicalBoost,
            final: this.combineScores(
                baseScore.overall,
                mlAdjustments,
                collaborativeBoost,
                historicalBoost
            )
        };

        // Generate detailed breakdown
        const breakdown = {
            ...baseScore.breakdown,
            mlEnhancements: mlAdjustments,
            collaborativeSignal: collaborativeBoost,
            historicalPattern: historicalBoost
        };

        // Predict success probability
        const successProbability = this.predictSuccessProbability(
            userProfile,
            prospectProfile,
            enhancedScore.final
        );

        // Generate explainable AI reasoning
        const reasoning = this.generateExplainableReasoning(
            userProfile,
            prospectProfile,
            breakdown,
            enhancedScore.final
        );

        return {
            compatibilityScore: Math.min(1, Math.max(0, enhancedScore.final)),
            breakdown,
            successProbability,
            reasoning,
            confidence: this.calculateConfidence(breakdown),
            recommendedActions: this.generateRecommendedActions(breakdown)
        };
    }

    calculateBaseCompatibility(userProfile, prospectProfile) {
        const dimensions = {
            skills: this.compareSkills(userProfile, prospectProfile),
            personality: this.comparePersonality(userProfile, prospectProfile),
            goals: this.compareGoals(userProfile, prospectProfile),
            values: this.compareValues(userProfile, prospectProfile),
            workStyle: this.compareWorkStyle(userProfile, prospectProfile),
            availability: this.compareAvailability(userProfile, prospectProfile)
        };

        const overall = Object.entries(dimensions).reduce((sum, [key, score]) => {
            return sum + (score * this.featureWeights[key]);
        }, 0);

        return {
            overall,
            breakdown: dimensions
        };
    }

    // ==================== ML ENHANCEMENTS ====================

    async applyMLEnhancements(userProfile, prospectProfile, baseScore) {
        let adjustment = 0;

        // Feature interaction effects
        adjustment += this.calculateFeatureInteractions(userProfile, prospectProfile);

        // Non-linear patterns
        adjustment += this.applyNonLinearTransforms(baseScore);

        // Temporal patterns (time-based adjustments)
        adjustment += this.applyTemporalAdjustments(userProfile, prospectProfile);

        return adjustment;
    }

    calculateFeatureInteractions(userProfile, prospectProfile) {
        let interaction = 0;

        // Skills + Goals synergy
        const techSkillsMatch = this.hasOverlap(
            userProfile.technicalSkills || [],
            prospectProfile.skills || []
        );
        const goalAlignment = this.compareGoals(userProfile, prospectProfile);
        
        if (techSkillsMatch && goalAlignment > 0.7) {
            interaction += 0.05; // Boost for strong skill-goal alignment
        }

        // Personality + Work Style synergy
        const personalityFit = this.comparePersonality(userProfile, prospectProfile);
        const workStyleFit = this.compareWorkStyle(userProfile, prospectProfile);
        
        if (personalityFit > 0.8 && workStyleFit > 0.8) {
            interaction += 0.03; // Boost for exceptional cultural fit
        }

        // Location + Availability synergy
        if (userProfile.personalInfo?.location === prospectProfile.location) {
            const availabilityMatch = this.compareAvailability(userProfile, prospectProfile);
            if (availabilityMatch > 0.7) {
                interaction += 0.02; // Boost for local + available
            }
        }

        return interaction;
    }

    applyNonLinearTransforms(baseScore) {
        // Apply sigmoid-like transformation to emphasize high scores
        const transformed = 1 / (1 + Math.exp(-10 * (baseScore.overall - 0.5)));
        return (transformed - 0.5) * 0.1; // Scale to small adjustment
    }

    applyTemporalAdjustments(userProfile, prospectProfile) {
        let adjustment = 0;

        // Recency bias: favor recently active prospects
        if (prospectProfile.lastActive) {
            const daysSinceActive = (Date.now() - new Date(prospectProfile.lastActive)) / (1000 * 60 * 60 * 24);
            if (daysSinceActive < 7) {
                adjustment += 0.02; // Boost for recently active
            }
        }

        // Urgency matching
        if (userProfile.availability?.startDate && prospectProfile.availability) {
            const userUrgency = this.calculateUrgency(userProfile.availability.startDate);
            const prospectUrgency = this.calculateUrgency(prospectProfile.availability);
            
            if (Math.abs(userUrgency - prospectUrgency) < 0.2) {
                adjustment += 0.02; // Boost for matching urgency
            }
        }

        return adjustment;
    }

    // ==================== COLLABORATIVE FILTERING ====================

    getCollaborativeFilteringBoost(userProfile, prospectProfile) {
        // Find similar users
        const similarUsers = this.findSimilarUsers(userProfile);
        
        if (similarUsers.length === 0) {
            return 0; // No collaborative signal yet
        }

        // Check if similar users matched with this prospect
        let boost = 0;
        let totalWeight = 0;

        similarUsers.forEach(({ userId, similarity }) => {
            const userMatches = this.matchHistory.filter(m => m.userId === userId);
            const matchedThisProspect = userMatches.find(m => 
                m.prospectId === prospectProfile.id && m.outcome === 'success'
            );

            if (matchedThisProspect) {
                boost += similarity * 0.1; // Weight by user similarity
                totalWeight += similarity;
            }
        });

        return totalWeight > 0 ? boost / totalWeight : 0;
    }

    findSimilarUsers(userProfile) {
        // Simplified collaborative filtering
        // In production, use matrix factorization or deep learning
        const similarUsers = [];

        this.userSimilarities.forEach((similarity, userId) => {
            if (similarity > 0.7) { // Threshold for "similar"
                similarUsers.push({ userId, similarity });
            }
        });

        return similarUsers.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
    }

    updateUserSimilarities(userId, userProfile) {
        // Calculate similarity with all other users
        // Simplified version - in production, use cosine similarity or learned embeddings
        
        this.matchHistory.forEach(match => {
            if (match.userId !== userId) {
                const similarity = this.calculateUserSimilarity(userProfile, match.userProfile);
                this.userSimilarities.set(`${userId}_${match.userId}`, similarity);
            }
        });
    }

    calculateUserSimilarity(profile1, profile2) {
        // Jaccard similarity on skills
        const skillsSimilarity = this.jaccardSimilarity(
            profile1.technicalSkills || [],
            profile2.technicalSkills || []
        );

        // Cosine similarity on goals (simplified)
        const goalsSimilarity = this.compareGoals(profile1, profile2);

        return (skillsSimilarity + goalsSimilarity) / 2;
    }

    // ==================== HISTORICAL SUCCESS PATTERNS ====================

    getHistoricalSuccessBoost(userProfile, prospectProfile) {
        if (this.successfulMatches.length < 10) {
            return 0; // Not enough data
        }

        // Find patterns in successful matches
        const patterns = this.extractSuccessPatterns();

        // Check if current match fits successful patterns
        let boost = 0;

        patterns.forEach(pattern => {
            if (this.matchesPattern(userProfile, prospectProfile, pattern)) {
                boost += pattern.weight;
            }
        });

        return Math.min(0.1, boost); // Cap at 0.1
    }

    extractSuccessPatterns() {
        const patterns = [];

        // Pattern: Same industry experience
        const sameIndustryMatches = this.successfulMatches.filter(m => 
            m.userProfile.domainExpertise?.industries?.some(i => 
                m.prospectProfile.industries?.includes(i)
            )
        );

        if (sameIndustryMatches.length > 5) {
            patterns.push({
                type: 'same_industry',
                weight: 0.03,
                confidence: sameIndustryMatches.length / this.successfulMatches.length
            });
        }

        // Pattern: Complementary skills
        const complementarySkillsMatches = this.successfulMatches.filter(m => {
            const userSkills = new Set(m.userProfile.technicalSkills || []);
            const prospectSkills = new Set(m.prospectProfile.skills || []);
            const overlap = [...userSkills].filter(s => prospectSkills.has(s)).length;
            const total = userSkills.size + prospectSkills.size;
            return overlap / total < 0.3; // Low overlap = complementary
        });

        if (complementarySkillsMatches.length > 5) {
            patterns.push({
                type: 'complementary_skills',
                weight: 0.04,
                confidence: complementarySkillsMatches.length / this.successfulMatches.length
            });
        }

        return patterns;
    }

    matchesPattern(userProfile, prospectProfile, pattern) {
        switch (pattern.type) {
            case 'same_industry':
                return userProfile.domainExpertise?.industries?.some(i => 
                    prospectProfile.industries?.includes(i)
                );
            
            case 'complementary_skills':
                const userSkills = new Set(userProfile.technicalSkills || []);
                const prospectSkills = new Set(prospectProfile.skills || []);
                const overlap = [...userSkills].filter(s => prospectSkills.has(s)).length;
                const total = userSkills.size + prospectSkills.size;
                return overlap / total < 0.3;
            
            default:
                return false;
        }
    }

    // ==================== SUCCESS PREDICTION ====================

    predictSuccessProbability(userProfile, prospectProfile, compatibilityScore) {
        // Base probability from compatibility
        let probability = compatibilityScore;

        // Adjust based on historical data
        if (this.matchHistory.length > 50) {
            const historicalSuccessRate = this.calculateHistoricalSuccessRate(compatibilityScore);
            probability = (probability + historicalSuccessRate) / 2;
        }

        // Adjust based on user's historical success
        const userSuccessRate = this.getUserSuccessRate(userProfile.userId);
        if (userSuccessRate !== null) {
            probability = probability * 0.7 + userSuccessRate * 0.3;
        }

        // Adjust based on prospect's response rate
        const prospectResponseRate = this.getProspectResponseRate(prospectProfile.id);
        if (prospectResponseRate !== null) {
            probability = probability * 0.8 + prospectResponseRate * 0.2;
        }

        return Math.min(1, Math.max(0, probability));
    }

    calculateHistoricalSuccessRate(compatibilityScore) {
        // Find matches with similar compatibility scores
        const similarMatches = this.matchHistory.filter(m => 
            Math.abs(m.compatibilityScore - compatibilityScore) < 0.1
        );

        if (similarMatches.length < 5) return null;

        const successCount = similarMatches.filter(m => m.outcome === 'success').length;
        return successCount / similarMatches.length;
    }

    getUserSuccessRate(userId) {
        const userMatches = this.matchHistory.filter(m => m.userId === userId);
        if (userMatches.length < 3) return null;

        const successCount = userMatches.filter(m => m.outcome === 'success').length;
        return successCount / userMatches.length;
    }

    getProspectResponseRate(prospectId) {
        const prospectMatches = this.matchHistory.filter(m => m.prospectId === prospectId);
        if (prospectMatches.length < 3) return null;

        const responseCount = prospectMatches.filter(m => m.responded === true).length;
        return responseCount / prospectMatches.length;
    }

    // ==================== EXPLAINABLE AI ====================

    generateExplainableReasoning(userProfile, prospectProfile, breakdown, finalScore) {
        const reasons = [];

        // Top contributing factors
        const sortedDimensions = Object.entries(breakdown)
            .filter(([key]) => !key.includes('Enhancement') && !key.includes('Signal') && !key.includes('Pattern'))
            .sort(([, a], [, b]) => b - a);

        sortedDimensions.slice(0, 3).forEach(([dimension, score]) => {
            if (score > 0.7) {
                reasons.push(this.generateDimensionReason(dimension, score, userProfile, prospectProfile));
            }
        });

        // ML enhancements explanation
        if (breakdown.mlEnhancements > 0.03) {
            reasons.push("Advanced pattern matching identified strong synergies between your profiles");
        }

        // Collaborative signal explanation
        if (breakdown.collaborativeSignal > 0.02) {
            reasons.push("Users similar to you have had successful matches with this prospect");
        }

        // Historical pattern explanation
        if (breakdown.historicalPattern > 0.02) {
            reasons.push("This match fits patterns associated with successful co-founder partnerships");
        }

        // Overall assessment
        let assessment;
        if (finalScore >= 0.8) {
            assessment = "Exceptional match with very high success potential";
        } else if (finalScore >= 0.7) {
            assessment = "Strong match with good compatibility across key dimensions";
        } else if (finalScore >= 0.6) {
            assessment = "Good match with solid foundation for partnership";
        } else {
            assessment = "Moderate match with some areas of alignment";
        }

        return {
            assessment,
            keyFactors: reasons,
            confidence: this.calculateConfidence(breakdown)
        };
    }

    generateDimensionReason(dimension, score, userProfile, prospectProfile) {
        const templates = {
            skills: "Excellent technical skills alignment with complementary expertise",
            personality: "Strong personality fit indicating good working chemistry",
            goals: "Highly aligned vision and startup goals",
            values: "Shared core values and ethical principles",
            workStyle: "Compatible work styles and collaboration preferences",
            availability: "Matching availability and commitment levels"
        };

        return templates[dimension] || `Strong ${dimension} compatibility`;
    }

    calculateConfidence(breakdown) {
        // Confidence based on data availability and consistency
        let confidence = 0.5; // Base confidence

        // More data = higher confidence
        const dataCompleteness = Object.values(breakdown).filter(v => v > 0).length / Object.keys(breakdown).length;
        confidence += dataCompleteness * 0.3;

        // Consistency across dimensions
        const scores = Object.values(breakdown).filter(v => typeof v === 'number' && v >= 0 && v <= 1);
        const variance = this.calculateVariance(scores);
        confidence += (1 - variance) * 0.2; // Lower variance = higher confidence

        return Math.min(1, Math.max(0, confidence));
    }

    generateRecommendedActions(breakdown) {
        const actions = [];

        // Based on weakest dimensions
        const sortedDimensions = Object.entries(breakdown)
            .filter(([key]) => !key.includes('Enhancement') && !key.includes('Signal') && !key.includes('Pattern'))
            .sort(([, a], [, b]) => a - b);

        const weakestDimension = sortedDimensions[0];
        
        if (weakestDimension[1] < 0.5) {
            actions.push({
                dimension: weakestDimension[0],
                action: `Discuss ${weakestDimension[0]} alignment early to address potential concerns`,
                priority: 'high'
            });
        }

        // General recommendations
        actions.push({
            dimension: 'communication',
            action: 'Schedule an initial video call to assess chemistry and alignment',
            priority: 'medium'
        });

        actions.push({
            dimension: 'validation',
            action: 'Work on a small project together to validate collaboration style',
            priority: 'medium'
        });

        return actions;
    }

    // ==================== FEEDBACK LOOP ====================

    recordMatchOutcome(userId, prospectId, outcome, feedback = {}) {
        const matchRecord = {
            userId,
            prospectId,
            outcome, // 'success', 'failure', 'no_response'
            feedback,
            timestamp: new Date(),
            userProfile: feedback.userProfile,
            prospectProfile: feedback.prospectProfile,
            compatibilityScore: feedback.compatibilityScore,
            responded: feedback.responded || false
        };

        this.matchHistory.push(matchRecord);

        if (outcome === 'success') {
            this.successfulMatches.push(matchRecord);
        }

        // Store user feedback
        if (feedback.rating || feedback.comments) {
            this.userFeedback.push({
                userId,
                prospectId,
                rating: feedback.rating,
                comments: feedback.comments,
                timestamp: new Date()
            });
        }

        // Trigger model retraining if enough new data
        if (this.matchHistory.length % 50 === 0) {
            this.trainModel();
        }

        // Track in analytics
        if (this.analyticsService) {
            this.analyticsService.trackEvent('match_outcome_recorded', {
                outcome,
                rating: feedback.rating
            }, userId);
        }
    }

    // ==================== MODEL TRAINING ====================

    trainModel() {
        console.log('🧠 Training ML model with', this.matchHistory.length, 'data points...');

        // Update feature weights based on feedback
        this.updateFeatureWeights();

        // Update collaborative filtering data
        this.updateCollaborativeFiltering();

        // Calculate model performance
        this.evaluateModelPerformance();

        this.modelMetrics.lastTrainedAt = new Date();
        this.modelMetrics.trainingDataSize = this.matchHistory.length;

        console.log('✅ Model training complete. Accuracy:', this.modelMetrics.accuracy);
    }

    updateFeatureWeights() {
        // Analyze which features correlate with successful matches
        const featureImportance = {};

        Object.keys(this.featureWeights).forEach(feature => {
            const correlation = this.calculateFeatureCorrelation(feature);
            featureImportance[feature] = correlation;
        });

        // Normalize to sum to 1
        const total = Object.values(featureImportance).reduce((sum, val) => sum + val, 0);
        Object.keys(featureImportance).forEach(feature => {
            this.featureWeights[feature] = featureImportance[feature] / total;
        });
    }

    calculateFeatureCorrelation(feature) {
        // Simplified correlation calculation
        // In production, use proper statistical methods
        
        let correlation = 0;
        let count = 0;

        this.matchHistory.forEach(match => {
            if (match.outcome === 'success' && match.feedback?.breakdown) {
                const featureScore = match.feedback.breakdown[feature];
                if (featureScore !== undefined) {
                    correlation += featureScore;
                    count++;
                }
            }
        });

        return count > 0 ? correlation / count : 0.15; // Default weight
    }

    updateCollaborativeFiltering() {
        // Update user similarities based on match patterns
        const users = [...new Set(this.matchHistory.map(m => m.userId))];

        users.forEach(userId1 => {
            users.forEach(userId2 => {
                if (userId1 !== userId2) {
                    const similarity = this.calculateMatchPatternSimilarity(userId1, userId2);
                    this.userSimilarities.set(`${userId1}_${userId2}`, similarity);
                }
            });
        });
    }

    calculateMatchPatternSimilarity(userId1, userId2) {
        const user1Matches = this.matchHistory.filter(m => m.userId === userId1);
        const user2Matches = this.matchHistory.filter(m => m.userId === userId2);

        // Find common prospects
        const user1Prospects = new Set(user1Matches.map(m => m.prospectId));
        const user2Prospects = new Set(user2Matches.map(m => m.prospectId));

        const intersection = [...user1Prospects].filter(p => user2Prospects.has(p));
        const union = new Set([...user1Prospects, ...user2Prospects]);

        return intersection.length / union.size;
    }

    evaluateModelPerformance() {
        // Split data into train/test
        const testSize = Math.floor(this.matchHistory.length * 0.2);
        const testData = this.matchHistory.slice(-testSize);

        let correct = 0;
        let truePositives = 0;
        let falsePositives = 0;
        let falseNegatives = 0;

        testData.forEach(match => {
            const predicted = match.compatibilityScore > 0.7 ? 'success' : 'failure';
            const actual = match.outcome;

            if (predicted === actual) correct++;
            if (predicted === 'success' && actual === 'success') truePositives++;
            if (predicted === 'success' && actual !== 'success') falsePositives++;
            if (predicted !== 'success' && actual === 'success') falseNegatives++;
        });

        this.modelMetrics.accuracy = correct / testData.length;
        this.modelMetrics.precision = truePositives / (truePositives + falsePositives) || 0;
        this.modelMetrics.recall = truePositives / (truePositives + falseNegatives) || 0;
        this.modelMetrics.f1Score = 2 * (this.modelMetrics.precision * this.modelMetrics.recall) / 
            (this.modelMetrics.precision + this.modelMetrics.recall) || 0;
    }

    getModelPerformance() {
        return {
            ...this.modelMetrics,
            featureWeights: { ...this.featureWeights },
            trainingDataSize: this.matchHistory.length,
            successfulMatchesCount: this.successfulMatches.length
        };
    }

    // ==================== UTILITY FUNCTIONS ====================

    compareSkills(profile1, profile2) {
        const skills1 = new Set(profile1.technicalSkills || []);
        const skills2 = new Set(profile2.skills || []);
        return this.jaccardSimilarity([...skills1], [...skills2]);
    }

    comparePersonality(profile1, profile2) {
        if (!profile1.personalityType || !profile2.personality) return 0.5;
        
        const traits1 = profile1.personalityType.traits || [];
        const traits2 = profile2.personality?.traits || [];
        
        return this.jaccardSimilarity(traits1, traits2);
    }

    compareGoals(profile1, profile2) {
        if (!profile1.startupVision || !profile2.goals) return 0.5;
        
        const goals1 = [
            profile1.startupVision.industry,
            profile1.startupVision.businessModel,
            profile1.startupVision.targetMarket
        ].filter(Boolean);
        
        const goals2 = profile2.goals?.industries || [];
        
        return this.jaccardSimilarity(goals1, goals2);
    }

    compareValues(profile1, profile2) {
        if (!profile1.coreValues || !profile2.values) return 0.5;
        
        const values1 = profile1.coreValues.topValues || [];
        const values2 = profile2.values || [];
        
        return this.jaccardSimilarity(values1, values2);
    }

    compareWorkStyle(profile1, profile2) {
        if (!profile1.personalityType || !profile2.workStyle) return 0.5;
        
        const style1 = profile1.personalityType.workStyle || [];
        const style2 = profile2.workStyle || [];
        
        return this.jaccardSimilarity(style1, style2);
    }

    compareAvailability(profile1, profile2) {
        if (!profile1.availability || !profile2.availability) return 0.5;
        
        const commitment1 = profile1.availability.hoursPerWeek || 0;
        const commitment2 = profile2.availability?.hoursPerWeek || 0;
        
        const diff = Math.abs(commitment1 - commitment2);
        return Math.max(0, 1 - (diff / 40)); // Normalize to 40-hour week
    }

    jaccardSimilarity(set1, set2) {
        const s1 = new Set(set1);
        const s2 = new Set(set2);
        
        const intersection = [...s1].filter(x => s2.has(x)).length;
        const union = new Set([...s1, ...s2]).size;
        
        return union > 0 ? intersection / union : 0;
    }

    hasOverlap(arr1, arr2) {
        const set1 = new Set(arr1);
        return arr2.some(item => set1.has(item));
    }

    calculateUrgency(dateOrObj) {
        let date;
        if (typeof dateOrObj === 'string') {
            date = new Date(dateOrObj);
        } else if (dateOrObj.startDate) {
            date = new Date(dateOrObj.startDate);
        } else {
            return 0.5;
        }

        const daysUntil = (date - Date.now()) / (1000 * 60 * 60 * 24);
        
        if (daysUntil < 30) return 1.0;      // Very urgent
        if (daysUntil < 90) return 0.7;      // Urgent
        if (daysUntil < 180) return 0.5;     // Moderate
        return 0.3;                           // Flexible
    }

    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        
        const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
    }

    combineScores(base, ml, collaborative, historical) {
        // Weighted combination
        return base * 0.6 + ml * 0.2 + collaborative * 0.1 + historical * 0.1;
    }
}

module.exports = MLMatchingService;
