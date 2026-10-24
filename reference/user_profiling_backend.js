// Comprehensive User Profiling Backend System
// Enables meaningful compatibility scoring through detailed user profiles

const express = require('express');
const cors = require('cors');

class UserProfilingSystem {
    constructor() {
        this.app = express();
        this.port = 3030;
        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupDatabase() {
        // In-memory database for user profiles
        this.userProfiles = new Map();
        this.compatibilityScores = new Map();
        this.onboardingSessions = new Map();
        
        // Initialize with sample data structure
        this.profileSchema = {
            userId: 'string',
            createdAt: 'timestamp',
            updatedAt: 'timestamp',
            completenessScore: 0,
            
            // A. Founder Identity & Background
            personalInfo: {
                name: '',
                email: '',
                location: '',
                timezone: '',
                linkedinProfile: '',
                githubProfile: '',
                twitterProfile: '',
                personalWebsite: ''
            },
            
            founderStage: {
                experienceLevel: '', // first_time, serial, experienced
                currentStatus: '', // ideation, mvp, early_stage, scaling, established
                previousExits: 0,
                yearsEntrepreneurship: 0,
                previousStartups: [],
                notableAchievements: []
            },
            
            // B. Skills & Expertise Profile
            technicalSkills: {
                programmingLanguages: [],
                frameworks: [],
                platforms: [],
                proficiencyLevels: {}, // {skill: level}
                certifications: [],
                portfolioProjects: []
            },
            
            businessSkills: {
                marketing: 0, // 0-10 scale
                sales: 0,
                finance: 0,
                operations: 0,
                strategy: 0,
                fundraising: 0,
                productManagement: 0,
                customerSuccess: 0
            },
            
            domainExpertise: {
                industries: [],
                yearsExperience: {}, // {industry: years}
                specificKnowledge: [],
                professionalBackground: ''
            },
            
            // C. Personality & Work Style
            personalityType: {
                mbtiType: '',
                bigFiveScores: {
                    openness: 0,
                    conscientiousness: 0,
                    extraversion: 0,
                    agreeableness: 0,
                    neuroticism: 0
                },
                workStyle: '', // collaborative, independent, hybrid
                communicationStyle: '', // direct, diplomatic, analytical, enthusiastic
                decisionMaking: '', // data_driven, intuitive, consensus, decisive
                leadershipStyle: '', // visionary, servant, democratic, autocratic
                conflictResolution: '' // confrontational, avoidant, collaborative, compromising
            },
            
            availability: {
                commitmentLevel: '', // full_time, part_time, weekends, flexible
                hoursPerWeek: 0,
                timezoneFlexibility: false,
                travelWillingness: '', // none, occasional, frequent, extensive
                startDate: '',
                noticePeriod: ''
            },
            
            // D. Vision & Goals
            startupVision: {
                industryFocus: [],
                problemSolving: '',
                targetMarket: '',
                businessModel: '',
                scaleAmbition: '', // lifestyle, regional, national, global
                exitStrategy: '', // ipo, acquisition, lifestyle, none
                timelineToLaunch: '',
                fundingGoals: '' // bootstrapped, angel, vc, enterprise
            },
            
            partnershipGoals: {
                seekingRoles: [], // technical, business, marketing, sales, operations
                equityExpectations: { min: 0, max: 0 },
                timelineToLaunch: '',
                fundingGoals: '',
                idealTeamSize: 0,
                decisionMakingStructure: '' // equal, lead_founder, board, consensus
            },
            
            // E. Values & Culture
            coreValues: [],
            workCulturePreferences: {
                remoteVsOffice: '', // remote, hybrid, office, flexible
                hierarchyVsFlat: 0, // 0-10 scale (0=flat, 10=hierarchical)
                fastVsDeliberate: 0, // 0-10 scale (0=deliberate, 10=fast)
                riskTolerance: '', // conservative, moderate, aggressive
                workLifeBalance: 0, // 0-10 importance
                diversityImportance: 0 // 0-10 importance
            },
            
            ethicalConsiderations: {
                socialImpactImportance: 0, // 0-10 scale
                environmentalConsciousness: 0,
                diversityCommitment: 0,
                transparencyValue: 0,
                customerPrivacy: 0
            },
            
            // F. Co-Founder Preferences
            idealCofounder: {
                mustHaveSkills: [],
                niceToHaveSkills: [],
                experienceLevelPreference: '', // junior, peer, senior, any
                personalityCompatibility: [],
                locationPreferences: [],
                availabilityRequirements: '',
                ageRange: { min: 0, max: 0 },
                educationPreference: '' // none, bachelors, masters, phd, any
            },
            
            dealBreakers: [],
            flexibilityAreas: [],
            
            // G. Current Situation & Constraints
            currentSituation: {
                employmentStatus: '', // employed, unemployed, student, entrepreneur
                financialRunway: 0, // months
                familyCommitments: '',
                relocationWillingness: false,
                visaStatus: '',
                legalConstraints: []
            },
            
            // H. Success Metrics & Priorities
            successMetrics: {
                primaryGoal: '', // revenue, users, impact, innovation, exit
                revenueTargets: {},
                userTargets: {},
                impactMetrics: [],
                timelineExpectations: ''
            }
        };
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
    }

    setupRoutes() {
        // Profile Management Routes
        this.app.post('/api/profile/create', this.createProfile.bind(this));
        this.app.get('/api/profile/:userId', this.getProfile.bind(this));
        this.app.put('/api/profile/:userId', this.updateProfile.bind(this));
        this.app.delete('/api/profile/:userId', this.deleteProfile.bind(this));
        
        // Onboarding Routes
        this.app.post('/api/onboarding/start', this.startOnboarding.bind(this));
        this.app.post('/api/onboarding/step', this.saveOnboardingStep.bind(this));
        this.app.post('/api/onboarding/complete', this.completeOnboarding.bind(this));
        this.app.get('/api/onboarding/progress/:sessionId', this.getOnboardingProgress.bind(this));
        
        // Profile Analysis Routes
        this.app.get('/api/profile/:userId/completeness', this.getProfileCompleteness.bind(this));
        this.app.get('/api/profile/:userId/suggestions', this.getProfileSuggestions.bind(this));
        this.app.post('/api/profile/:userId/analyze', this.analyzeProfile.bind(this));
        
        // Compatibility Routes
        this.app.post('/api/compatibility/calculate', this.calculateCompatibility.bind(this));
        this.app.get('/api/compatibility/:userId/:prospectId', this.getCompatibilityScore.bind(this));
        this.app.post('/api/compatibility/batch', this.batchCalculateCompatibility.bind(this));
        
        // Social Media Integration Routes
        this.app.post('/api/social/linkedin/import', this.importLinkedInData.bind(this));
        this.app.post('/api/social/github/import', this.importGitHubData.bind(this));
        this.app.post('/api/social/twitter/import', this.importTwitterData.bind(this));
        
        // Analytics Routes
        this.app.get('/api/analytics/profiles', this.getProfileAnalytics.bind(this));
        this.app.get('/api/analytics/matching', this.getMatchingAnalytics.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', service: 'user-profiling-system', timestamp: new Date() });
        });
    }

    // Profile Management Methods
    async createProfile(req, res) {
        try {
            const userId = this.generateUserId();
            const profile = {
                ...JSON.parse(JSON.stringify(this.profileSchema)),
                userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...req.body
            };
            
            this.userProfiles.set(userId, profile);
            
            res.json({
                success: true,
                userId,
                profile,
                message: 'Profile created successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            const { userId } = req.params;
            const profile = this.userProfiles.get(userId);
            
            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profile not found' });
            }
            
            res.json({ success: true, profile });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const { userId } = req.params;
            const profile = this.userProfiles.get(userId);
            
            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profile not found' });
            }
            
            const updatedProfile = this.deepMerge(profile, req.body);
            updatedProfile.updatedAt = new Date();
            updatedProfile.completenessScore = this.calculateCompleteness(updatedProfile);
            
            this.userProfiles.set(userId, updatedProfile);
            
            res.json({
                success: true,
                profile: updatedProfile,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteProfile(req, res) {
        try {
            const { userId } = req.params;
            
            if (!this.userProfiles.has(userId)) {
                return res.status(404).json({ success: false, error: 'Profile not found' });
            }
            
            this.userProfiles.delete(userId);
            
            res.json({
                success: true,
                message: 'Profile deleted successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Onboarding Methods
    async startOnboarding(req, res) {
        try {
            const sessionId = this.generateSessionId();
            const session = {
                sessionId,
                startedAt: new Date(),
                currentStep: 1,
                totalSteps: 5,
                completedSteps: [],
                data: {},
                userId: null
            };
            
            this.onboardingSessions.set(sessionId, session);
            
            res.json({
                success: true,
                sessionId,
                currentStep: 1,
                totalSteps: 5,
                questions: this.getOnboardingQuestions(1)
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async saveOnboardingStep(req, res) {
        try {
            const { sessionId, step, data } = req.body;
            const session = this.onboardingSessions.get(sessionId);
            
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            session.data[`step${step}`] = data;
            session.completedSteps.push(step);
            session.currentStep = step + 1;
            
            this.onboardingSessions.set(sessionId, session);
            
            const nextQuestions = session.currentStep <= session.totalSteps 
                ? this.getOnboardingQuestions(session.currentStep)
                : null;
            
            res.json({
                success: true,
                currentStep: session.currentStep,
                totalSteps: session.totalSteps,
                progress: (session.completedSteps.length / session.totalSteps) * 100,
                nextQuestions
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async completeOnboarding(req, res) {
        try {
            const { sessionId } = req.body;
            const session = this.onboardingSessions.get(sessionId);
            
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            // Create user profile from onboarding data
            const userId = this.generateUserId();
            const profile = this.buildProfileFromOnboarding(session.data);
            profile.userId = userId;
            profile.createdAt = new Date();
            profile.updatedAt = new Date();
            profile.completenessScore = this.calculateCompleteness(profile);
            
            this.userProfiles.set(userId, profile);
            session.userId = userId;
            
            res.json({
                success: true,
                userId,
                profile,
                completenessScore: profile.completenessScore,
                message: 'Onboarding completed successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getOnboardingProgress(req, res) {
        try {
            const { sessionId } = req.params;
            const session = this.onboardingSessions.get(sessionId);
            
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            res.json({
                success: true,
                currentStep: session.currentStep,
                totalSteps: session.totalSteps,
                completedSteps: session.completedSteps,
                progress: (session.completedSteps.length / session.totalSteps) * 100
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Profile Analysis Methods
    async getProfileCompleteness(req, res) {
        try {
            const { userId } = req.params;
            const profile = this.userProfiles.get(userId);
            
            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profile not found' });
            }
            
            const completeness = this.calculateDetailedCompleteness(profile);
            
            res.json({
                success: true,
                overallScore: completeness.overall,
                breakdown: completeness.breakdown,
                missingFields: completeness.missingFields
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getProfileSuggestions(req, res) {
        try {
            const { userId } = req.params;
            const profile = this.userProfiles.get(userId);
            
            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profile not found' });
            }
            
            const suggestions = this.generateProfileSuggestions(profile);
            
            res.json({
                success: true,
                suggestions,
                priorityActions: suggestions.filter(s => s.priority === 'high')
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async analyzeProfile(req, res) {
        try {
            const { userId } = req.params;
            const profile = this.userProfiles.get(userId);
            
            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profile not found' });
            }
            
            const analysis = {
                strengths: this.identifyStrengths(profile),
                gaps: this.identifyGaps(profile),
                recommendations: this.generateRecommendations(profile),
                marketPosition: this.analyzeMarketPosition(profile),
                matchingPotential: this.assessMatchingPotential(profile)
            };
            
            res.json({ success: true, analysis });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Compatibility Calculation Methods
    async calculateCompatibility(req, res) {
        try {
            const { userId, prospectProfile } = req.body;
            const userProfile = this.userProfiles.get(userId);
            
            if (!userProfile) {
                return res.status(404).json({ success: false, error: 'User profile not found' });
            }
            
            const compatibility = this.computeCompatibilityScore(userProfile, prospectProfile);
            
            // Store compatibility score
            const scoreId = `${userId}_${prospectProfile.id || 'prospect'}`;
            this.compatibilityScores.set(scoreId, {
                ...compatibility,
                calculatedAt: new Date()
            });
            
            res.json({
                success: true,
                compatibility
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getCompatibilityScore(req, res) {
        try {
            const { userId, prospectId } = req.params;
            const scoreId = `${userId}_${prospectId}`;
            const score = this.compatibilityScores.get(scoreId);
            
            if (!score) {
                return res.status(404).json({ success: false, error: 'Compatibility score not found' });
            }
            
            res.json({ success: true, compatibility: score });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async batchCalculateCompatibility(req, res) {
        try {
            const { userId, prospects } = req.body;
            const userProfile = this.userProfiles.get(userId);
            
            if (!userProfile) {
                return res.status(404).json({ success: false, error: 'User profile not found' });
            }
            
            const results = prospects.map(prospect => ({
                prospectId: prospect.id,
                compatibility: this.computeCompatibilityScore(userProfile, prospect)
            }));
            
            // Sort by overall score
            results.sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore);
            
            res.json({
                success: true,
                results,
                topMatches: results.slice(0, 10)
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Core Algorithm: Compatibility Scoring
    computeCompatibilityScore(userProfile, prospectProfile) {
        const weights = {
            skillsComplementarity: 0.25,
            personalityFit: 0.20,
            goalsAlignment: 0.20,
            valuesMatch: 0.15,
            workStyleSync: 0.10,
            availabilityMatch: 0.10
        };
        
        const scores = {
            skillsComplementarity: this.calculateSkillsComplementarity(userProfile, prospectProfile),
            personalityFit: this.calculatePersonalityFit(userProfile, prospectProfile),
            goalsAlignment: this.calculateGoalsAlignment(userProfile, prospectProfile),
            valuesMatch: this.calculateValuesMatch(userProfile, prospectProfile),
            workStyleSync: this.calculateWorkStyleSync(userProfile, prospectProfile),
            availabilityMatch: this.calculateAvailabilityMatch(userProfile, prospectProfile)
        };
        
        const overallScore = Object.keys(weights).reduce((sum, key) => {
            return sum + (scores[key] * weights[key]);
        }, 0);
        
        return {
            overallScore: Math.round(overallScore * 100) / 100,
            breakdown: scores,
            weights,
            reasoning: this.generateCompatibilityReasoning(scores, userProfile, prospectProfile),
            successProbability: this.calculateSuccessProbability(scores),
            recommendations: this.generatePartnershipRecommendations(scores, userProfile, prospectProfile)
        };
    }

    calculateSkillsComplementarity(user, prospect) {
        // Analyze how well skills complement each other
        const userSkills = new Set([
            ...(user.technicalSkills?.programmingLanguages || []),
            ...(user.domainExpertise?.industries || []),
            ...Object.keys(user.businessSkills || {}).filter(k => user.businessSkills[k] >= 7)
        ]);
        
        const prospectSkills = new Set([
            ...(prospect.skills || []),
            ...(prospect.expertise || [])
        ]);
        
        // Calculate overlap (some overlap is good, too much means redundancy)
        const overlap = [...userSkills].filter(s => prospectSkills.has(s)).length;
        const total = userSkills.size + prospectSkills.size;
        const overlapRatio = overlap / total;
        
        // Ideal overlap is 20-40% (some shared understanding, mostly complementary)
        let score = 0;
        if (overlapRatio >= 0.2 && overlapRatio <= 0.4) {
            score = 1.0;
        } else if (overlapRatio < 0.2) {
            score = 0.5 + (overlapRatio / 0.2) * 0.5; // Too little overlap
        } else {
            score = 1.0 - ((overlapRatio - 0.4) / 0.6) * 0.5; // Too much overlap
        }
        
        // Check if prospect has skills user is seeking
        const seekingSkills = user.idealCofounder?.mustHaveSkills || [];
        const hasRequiredSkills = seekingSkills.filter(s => prospectSkills.has(s)).length;
        const requiredSkillsScore = seekingSkills.length > 0 
            ? hasRequiredSkills / seekingSkills.length 
            : 0.5;
        
        return (score * 0.6 + requiredSkillsScore * 0.4);
    }

    calculatePersonalityFit(user, prospect) {
        // Analyze personality compatibility using Big Five and work style
        const userPersonality = user.personalityType || {};
        const prospectPersonality = prospect.personality || {};
        
        // Some traits should be similar, others complementary
        const similarityTraits = ['conscientiousness', 'agreeableness']; // Should be similar
        const complementaryTraits = ['extraversion', 'openness']; // Can be different
        
        let similarityScore = 0;
        let complementaryScore = 0;
        
        // Calculate similarity for traits that should match
        similarityTraits.forEach(trait => {
            const userScore = userPersonality.bigFiveScores?.[trait] || 5;
            const prospectScore = prospectPersonality[trait] || 5;
            const difference = Math.abs(userScore - prospectScore);
            similarityScore += (10 - difference) / 10;
        });
        similarityScore /= similarityTraits.length;
        
        // For complementary traits, moderate difference is good
        complementaryTraits.forEach(trait => {
            const userScore = userPersonality.bigFiveScores?.[trait] || 5;
            const prospectScore = prospectPersonality[trait] || 5;
            const difference = Math.abs(userScore - prospectScore);
            // Ideal difference is 2-4 points
            if (difference >= 2 && difference <= 4) {
                complementaryScore += 1.0;
            } else if (difference < 2) {
                complementaryScore += 0.7;
            } else {
                complementaryScore += 0.5;
            }
        });
        complementaryScore /= complementaryTraits.length;
        
        return (similarityScore * 0.6 + complementaryScore * 0.4);
    }

    calculateGoalsAlignment(user, prospect) {
        // Analyze alignment of startup vision and goals
        const userVision = user.startupVision || {};
        const prospectVision = prospect.vision || {};
        
        let alignmentScore = 0;
        let factors = 0;
        
        // Industry focus alignment
        const userIndustries = new Set(userVision.industryFocus || []);
        const prospectIndustries = new Set(prospectVision.industries || []);
        const industryOverlap = [...userIndustries].filter(i => prospectIndustries.has(i)).length;
        if (userIndustries.size > 0 && prospectIndustries.size > 0) {
            alignmentScore += industryOverlap > 0 ? 1.0 : 0.3;
            factors++;
        }
        
        // Scale ambition alignment
        if (userVision.scaleAmbition && prospectVision.scaleAmbition) {
            const scaleMatch = userVision.scaleAmbition === prospectVision.scaleAmbition ? 1.0 : 0.5;
            alignmentScore += scaleMatch;
            factors++;
        }
        
        // Funding goals alignment
        if (userVision.fundingGoals && prospectVision.fundingGoals) {
            const fundingMatch = userVision.fundingGoals === prospectVision.fundingGoals ? 1.0 : 0.6;
            alignmentScore += fundingMatch;
            factors++;
        }
        
        return factors > 0 ? alignmentScore / factors : 0.5;
    }

    calculateValuesMatch(user, prospect) {
        // Analyze alignment of core values and culture preferences
        const userValues = new Set(user.coreValues || []);
        const prospectValues = new Set(prospect.values || []);
        
        const sharedValues = [...userValues].filter(v => prospectValues.has(v)).length;
        const totalValues = Math.max(userValues.size, prospectValues.size);
        
        const valuesScore = totalValues > 0 ? sharedValues / totalValues : 0.5;
        
        // Work culture preferences
        const userCulture = user.workCulturePreferences || {};
        const prospectCulture = prospect.workCulture || {};
        
        let cultureScore = 0;
        let cultureFactors = 0;
        
        if (userCulture.remoteVsOffice && prospectCulture.remoteVsOffice) {
            cultureScore += userCulture.remoteVsOffice === prospectCulture.remoteVsOffice ? 1.0 : 0.5;
            cultureFactors++;
        }
        
        if (userCulture.riskTolerance && prospectCulture.riskTolerance) {
            cultureScore += userCulture.riskTolerance === prospectCulture.riskTolerance ? 1.0 : 0.6;
            cultureFactors++;
        }
        
        const cultureFit = cultureFactors > 0 ? cultureScore / cultureFactors : 0.5;
        
        return (valuesScore * 0.6 + cultureFit * 0.4);
    }

    calculateWorkStyleSync(user, prospect) {
        // Analyze work style compatibility
        const userStyle = user.personalityType || {};
        const prospectStyle = prospect.workStyle || {};
        
        let syncScore = 0;
        let factors = 0;
        
        // Communication style compatibility
        if (userStyle.communicationStyle && prospectStyle.communicationStyle) {
            const compatible = this.areStylesCompatible(
                userStyle.communicationStyle, 
                prospectStyle.communicationStyle
            );
            syncScore += compatible ? 1.0 : 0.5;
            factors++;
        }
        
        // Decision making compatibility
        if (userStyle.decisionMaking && prospectStyle.decisionMaking) {
            const compatible = this.areStylesCompatible(
                userStyle.decisionMaking,
                prospectStyle.decisionMaking
            );
            syncScore += compatible ? 1.0 : 0.6;
            factors++;
        }
        
        return factors > 0 ? syncScore / factors : 0.5;
    }

    calculateAvailabilityMatch(user, prospect) {
        // Analyze availability and commitment compatibility
        const userAvail = user.availability || {};
        const prospectAvail = prospect.availability || {};
        
        let matchScore = 0;
        let factors = 0;
        
        // Commitment level match
        if (userAvail.commitmentLevel && prospectAvail.commitmentLevel) {
            matchScore += userAvail.commitmentLevel === prospectAvail.commitmentLevel ? 1.0 : 0.6;
            factors++;
        }
        
        // Hours per week compatibility
        if (userAvail.hoursPerWeek && prospectAvail.hoursPerWeek) {
            const hoursDiff = Math.abs(userAvail.hoursPerWeek - prospectAvail.hoursPerWeek);
            matchScore += hoursDiff <= 10 ? 1.0 : (hoursDiff <= 20 ? 0.7 : 0.4);
            factors++;
        }
        
        // Timezone flexibility
        if (userAvail.timezoneFlexibility !== undefined && prospectAvail.timezoneFlexibility !== undefined) {
            matchScore += (userAvail.timezoneFlexibility || prospectAvail.timezoneFlexibility) ? 1.0 : 0.6;
            factors++;
        }
        
        return factors > 0 ? matchScore / factors : 0.5;
    }

    areStylesCompatible(style1, style2) {
        // Define compatibility matrix for different styles
        const compatibilityMatrix = {
            direct: ['direct', 'analytical'],
            diplomatic: ['diplomatic', 'enthusiastic'],
            analytical: ['analytical', 'direct'],
            enthusiastic: ['enthusiastic', 'diplomatic'],
            data_driven: ['data_driven', 'analytical'],
            intuitive: ['intuitive', 'enthusiastic'],
            consensus: ['consensus', 'collaborative'],
            decisive: ['decisive', 'direct']
        };
        
        return compatibilityMatrix[style1]?.includes(style2) || style1 === style2;
    }

    calculateSuccessProbability(scores) {
        // Calculate probability of successful partnership based on compatibility scores
        const criticalFactors = ['skillsComplementarity', 'goalsAlignment', 'valuesMatch'];
        const criticalScore = criticalFactors.reduce((sum, key) => sum + scores[key], 0) / criticalFactors.length;
        
        const allFactorsScore = Object.values(scores).reduce((sum, val) => sum + val, 0) / Object.keys(scores).length;
        
        // Critical factors weighted more heavily
        const probability = (criticalScore * 0.7 + allFactorsScore * 0.3);
        
        return Math.round(probability * 100);
    }

    generateCompatibilityReasoning(scores, user, prospect) {
        const reasons = [];
        
        if (scores.skillsComplementarity >= 0.7) {
            reasons.push("Strong skills complementarity - your abilities complement each other well");
        } else if (scores.skillsComplementarity < 0.5) {
            reasons.push("Skills overlap may be too high or too low - consider if this creates gaps");
        }
        
        if (scores.personalityFit >= 0.7) {
            reasons.push("Excellent personality compatibility - similar work ethics with complementary traits");
        }
        
        if (scores.goalsAlignment >= 0.8) {
            reasons.push("Highly aligned vision and goals - you're heading in the same direction");
        } else if (scores.goalsAlignment < 0.5) {
            reasons.push("Different visions for the startup - important to discuss and align expectations");
        }
        
        if (scores.valuesMatch >= 0.7) {
            reasons.push("Strong values alignment - shared principles for building the company");
        }
        
        if (scores.availabilityMatch < 0.5) {
            reasons.push("Availability mismatch - different commitment levels or schedules may cause friction");
        }
        
        return reasons.join(". ");
    }

    generatePartnershipRecommendations(scores, user, prospect) {
        const recommendations = [];
        
        if (scores.skillsComplementarity < 0.6) {
            recommendations.push({
                area: "Skills",
                priority: "high",
                suggestion: "Consider how you'll fill skill gaps or if there's too much overlap"
            });
        }
        
        if (scores.goalsAlignment < 0.6) {
            recommendations.push({
                area: "Goals",
                priority: "high",
                suggestion: "Have detailed discussions about long-term vision and exit strategy"
            });
        }
        
        if (scores.valuesMatch < 0.6) {
            recommendations.push({
                area: "Values",
                priority: "medium",
                suggestion: "Discuss core values and work culture expectations early"
            });
        }
        
        if (scores.availabilityMatch < 0.5) {
            recommendations.push({
                area: "Availability",
                priority: "high",
                suggestion: "Clarify time commitments and ensure expectations are aligned"
            });
        }
        
        if (scores.personalityFit < 0.5) {
            recommendations.push({
                area: "Personality",
                priority: "medium",
                suggestion: "Consider if personality differences will complement or conflict"
            });
        }
        
        return recommendations;
    }

    // Helper Methods
    calculateCompleteness(profile) {
        const weights = {
            personalInfo: 0.15,
            founderStage: 0.10,
            technicalSkills: 0.15,
            businessSkills: 0.10,
            domainExpertise: 0.10,
            personalityType: 0.10,
            availability: 0.10,
            startupVision: 0.10,
            idealCofounder: 0.10
        };
        
        let totalScore = 0;
        
        Object.keys(weights).forEach(section => {
            const sectionData = profile[section];
            if (sectionData && typeof sectionData === 'object') {
                const filledFields = Object.values(sectionData).filter(v => {
                    if (Array.isArray(v)) return v.length > 0;
                    if (typeof v === 'object') return Object.keys(v).length > 0;
                    return v !== '' && v !== 0 && v !== null && v !== undefined;
                }).length;
                const totalFields = Object.keys(sectionData).length;
                const sectionScore = totalFields > 0 ? filledFields / totalFields : 0;
                totalScore += sectionScore * weights[section];
            }
        });
        
        return Math.round(totalScore * 100);
    }

    calculateDetailedCompleteness(profile) {
        const breakdown = {};
        const missingFields = {};
        
        const sections = [
            'personalInfo', 'founderStage', 'technicalSkills', 'businessSkills',
            'domainExpertise', 'personalityType', 'availability', 'startupVision',
            'partnershipGoals', 'coreValues', 'idealCofounder'
        ];
        
        sections.forEach(section => {
            const sectionData = profile[section];
            if (sectionData && typeof sectionData === 'object') {
                const fields = Object.keys(sectionData);
                const filled = fields.filter(f => {
                    const value = sectionData[f];
                    if (Array.isArray(value)) return value.length > 0;
                    if (typeof value === 'object') return Object.keys(value).length > 0;
                    return value !== '' && value !== 0 && value !== null && value !== undefined;
                });
                
                breakdown[section] = Math.round((filled.length / fields.length) * 100);
                missingFields[section] = fields.filter(f => !filled.includes(f));
            }
        });
        
        const overall = Object.values(breakdown).reduce((sum, val) => sum + val, 0) / Object.keys(breakdown).length;
        
        return { overall: Math.round(overall), breakdown, missingFields };
    }

    generateProfileSuggestions(profile) {
        const suggestions = [];
        const completeness = this.calculateDetailedCompleteness(profile);
        
        Object.entries(completeness.breakdown).forEach(([section, score]) => {
            if (score < 70) {
                suggestions.push({
                    section,
                    priority: score < 40 ? 'high' : 'medium',
                    message: `Complete your ${section} (${score}% complete)`,
                    impact: `+${Math.round((100 - score) * 0.5)}% better matches`,
                    missingFields: completeness.missingFields[section]
                });
            }
        });
        
        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    identifyStrengths(profile) {
        const strengths = [];
        
        // Technical strengths
        if (profile.technicalSkills?.programmingLanguages?.length > 5) {
            strengths.push("Diverse technical skill set");
        }
        
        // Business strengths
        const strongBusinessSkills = Object.entries(profile.businessSkills || {})
            .filter(([_, score]) => score >= 8)
            .map(([skill, _]) => skill);
        if (strongBusinessSkills.length > 0) {
            strengths.push(`Strong in ${strongBusinessSkills.join(', ')}`);
        }
        
        // Experience
        if (profile.founderStage?.previousExits > 0) {
            strengths.push("Proven track record with exits");
        }
        
        return strengths;
    }

    identifyGaps(profile) {
        const gaps = [];
        
        // Check for missing critical information
        if (!profile.startupVision?.industryFocus?.length) {
            gaps.push("Industry focus not specified");
        }
        
        if (!profile.idealCofounder?.mustHaveSkills?.length) {
            gaps.push("Co-founder requirements not defined");
        }
        
        if (!profile.personalityType?.mbtiType) {
            gaps.push("Personality assessment incomplete");
        }
        
        return gaps;
    }

    generateRecommendations(profile) {
        const recommendations = [];
        
        const completeness = this.calculateCompleteness(profile);
        
        if (completeness < 70) {
            recommendations.push("Complete your profile to improve match quality");
        }
        
        if (!profile.linkedinProfile) {
            recommendations.push("Connect LinkedIn to enhance your profile");
        }
        
        if (!profile.coreValues?.length) {
            recommendations.push("Define your core values for better cultural fit");
        }
        
        return recommendations;
    }

    analyzeMarketPosition(profile) {
        return {
            uniqueness: "Medium", // Would use ML in production
            demand: "High",
            competitiveness: "Moderate"
        };
    }

    assessMatchingPotential(profile) {
        const completeness = this.calculateCompleteness(profile);
        
        return {
            readiness: completeness >= 70 ? "Ready" : "Needs improvement",
            estimatedMatches: Math.round(completeness * 0.5), // Rough estimate
            qualityScore: completeness >= 80 ? "High" : completeness >= 60 ? "Medium" : "Low"
        };
    }

    buildProfileFromOnboarding(data) {
        // Transform onboarding data into profile structure
        const profile = JSON.parse(JSON.stringify(this.profileSchema));
        
        // Map step1 data (basic info)
        if (data.step1) {
            profile.personalInfo = { ...profile.personalInfo, ...data.step1.personalInfo };
            profile.founderStage = { ...profile.founderStage, ...data.step1.founderStage };
        }
        
        // Map step2 data (skills)
        if (data.step2) {
            profile.technicalSkills = { ...profile.technicalSkills, ...data.step2.technicalSkills };
            profile.businessSkills = { ...profile.businessSkills, ...data.step2.businessSkills };
        }
        
        // Map step3 data (personality & work style)
        if (data.step3) {
            profile.personalityType = { ...profile.personalityType, ...data.step3.personalityType };
            profile.availability = { ...profile.availability, ...data.step3.availability };
        }
        
        // Map step4 data (vision & goals)
        if (data.step4) {
            profile.startupVision = { ...profile.startupVision, ...data.step4.startupVision };
            profile.partnershipGoals = { ...profile.partnershipGoals, ...data.step4.partnershipGoals };
        }
        
        // Map step5 data (preferences)
        if (data.step5) {
            profile.idealCofounder = { ...profile.idealCofounder, ...data.step5.idealCofounder };
            profile.coreValues = data.step5.coreValues || [];
            profile.dealBreakers = data.step5.dealBreakers || [];
        }
        
        return profile;
    }

    getOnboardingQuestions(step) {
        const questions = {
            1: {
                title: "Let's start with the basics",
                subtitle: "Tell us about yourself and your founder journey",
                fields: [
                    { id: 'name', label: 'Full Name', type: 'text', required: true },
                    { id: 'email', label: 'Email', type: 'email', required: true },
                    { id: 'location', label: 'Location', type: 'text', required: true },
                    { id: 'experienceLevel', label: 'Founder Experience', type: 'select', 
                      options: ['First-time founder', 'Serial entrepreneur', 'Experienced founder'], required: true },
                    { id: 'currentStatus', label: 'Current Stage', type: 'select',
                      options: ['Ideation', 'Building MVP', 'Early stage', 'Scaling', 'Established'], required: true }
                ]
            },
            2: {
                title: "Your skills and expertise",
                subtitle: "Help us understand what you bring to the table",
                fields: [
                    { id: 'technicalSkills', label: 'Technical Skills', type: 'multiselect',
                      options: ['JavaScript', 'Python', 'React', 'Node.js', 'AI/ML', 'Blockchain', 'Mobile', 'DevOps'], required: false },
                    { id: 'businessSkills', label: 'Rate your business skills (0-10)', type: 'rating',
                      skills: ['Marketing', 'Sales', 'Finance', 'Operations', 'Strategy', 'Fundraising'], required: false },
                    { id: 'industries', label: 'Industry Experience', type: 'multiselect',
                      options: ['SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'AI/ML', 'Blockchain', 'Other'], required: false }
                ]
            },
            3: {
                title: "Your personality and work style",
                subtitle: "Understanding how you work helps us find the right match",
                fields: [
                    { id: 'workStyle', label: 'Work Style', type: 'select',
                      options: ['Collaborative', 'Independent', 'Hybrid'], required: true },
                    { id: 'communicationStyle', label: 'Communication Style', type: 'select',
                      options: ['Direct', 'Diplomatic', 'Analytical', 'Enthusiastic'], required: true },
                    { id: 'commitmentLevel', label: 'Commitment Level', type: 'select',
                      options: ['Full-time', 'Part-time', 'Weekends', 'Flexible'], required: true },
                    { id: 'hoursPerWeek', label: 'Hours per week', type: 'number', required: true }
                ]
            },
            4: {
                title: "Your vision and goals",
                subtitle: "What are you building and where do you want to go?",
                fields: [
                    { id: 'industryFocus', label: 'Industry Focus', type: 'multiselect',
                      options: ['SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'AI/ML', 'Blockchain', 'Other'], required: true },
                    { id: 'problemSolving', label: 'What problem are you solving?', type: 'textarea', required: true },
                    { id: 'scaleAmbition', label: 'Scale Ambition', type: 'select',
                      options: ['Lifestyle business', 'Regional', 'National', 'Global'], required: true },
                    { id: 'fundingGoals', label: 'Funding Goals', type: 'select',
                      options: ['Bootstrapped', 'Angel', 'VC', 'Enterprise'], required: true }
                ]
            },
            5: {
                title: "Your ideal co-founder",
                subtitle: "Help us find the perfect match for you",
                fields: [
                    { id: 'mustHaveSkills', label: 'Must-have skills', type: 'multiselect',
                      options: ['Technical', 'Business', 'Marketing', 'Sales', 'Design', 'Product', 'Operations'], required: true },
                    { id: 'experienceLevelPreference', label: 'Experience Level', type: 'select',
                      options: ['Junior', 'Peer', 'Senior', 'Any'], required: false },
                    { id: 'coreValues', label: 'Core Values', type: 'multiselect',
                      options: ['Innovation', 'Integrity', 'Customer-first', 'Transparency', 'Diversity', 'Sustainability', 'Growth', 'Work-life balance'], required: true },
                    { id: 'dealBreakers', label: 'Deal Breakers', type: 'multiselect',
                      options: ['Different time zones', 'Part-time commitment', 'No technical skills', 'No business skills', 'Different vision', 'Poor communication'], required: false }
                ]
            }
        };
        
        return questions[step] || null;
    }

    deepMerge(target, source) {
        const output = { ...target };
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Social Media Integration (Placeholder methods)
    async importLinkedInData(req, res) {
        res.json({ success: true, message: 'LinkedIn integration coming soon', data: {} });
    }

    async importGitHubData(req, res) {
        res.json({ success: true, message: 'GitHub integration coming soon', data: {} });
    }

    async importTwitterData(req, res) {
        res.json({ success: true, message: 'Twitter integration coming soon', data: {} });
    }

    // Analytics Methods
    async getProfileAnalytics(req, res) {
        const profiles = Array.from(this.userProfiles.values());
        
        const analytics = {
            totalProfiles: profiles.length,
            averageCompleteness: profiles.reduce((sum, p) => sum + p.completenessScore, 0) / profiles.length || 0,
            experienceLevels: this.groupBy(profiles, 'founderStage.experienceLevel'),
            industries: this.groupBy(profiles, 'domainExpertise.industries'),
            locations: this.groupBy(profiles, 'personalInfo.location')
        };
        
        res.json({ success: true, analytics });
    }

    async getMatchingAnalytics(req, res) {
        const scores = Array.from(this.compatibilityScores.values());
        
        const analytics = {
            totalCalculations: scores.length,
            averageScore: scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length || 0,
            highQualityMatches: scores.filter(s => s.overallScore >= 0.8).length,
            successProbability: scores.reduce((sum, s) => sum + s.successProbability, 0) / scores.length || 0
        };
        
        res.json({ success: true, analytics });
    }

    groupBy(array, path) {
        const result = {};
        array.forEach(item => {
            const value = path.split('.').reduce((obj, key) => obj?.[key], item);
            if (Array.isArray(value)) {
                value.forEach(v => {
                    result[v] = (result[v] || 0) + 1;
                });
            } else if (value) {
                result[value] = (result[value] || 0) + 1;
            }
        });
        return result;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`\n🚀 User Profiling System running on port ${this.port}`);
            console.log(`📊 API Documentation: http://localhost:${this.port}/health`);
            console.log(`\n✅ Ready to create meaningful co-founder matches!\n`);
        });
    }
}

// Start the server
const system = new UserProfilingSystem();
system.start();

module.exports = UserProfilingSystem;
