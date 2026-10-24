// deduplication_engine.js - Comprehensive Deduplication System
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

class DeduplicationEngine {
    constructor(dbPath = './deduplication.db') {
        this.db = new sqlite3.Database(dbPath);
        this.initializeDatabase();
        
        // Fuzzy matching thresholds
        this.EXACT_MATCH_THRESHOLD = 100;
        this.HIGH_CONFIDENCE_THRESHOLD = 90;
        this.MEDIUM_CONFIDENCE_THRESHOLD = 70;
        this.LOW_CONFIDENCE_THRESHOLD = 50;
        
        // Credit costs for operations
        this.OPERATION_COSTS = {
            profileSearch: 0.0320,
            profileAnalysis: 0.0009,
            messageSending: 0.0505
        };
    }

    initializeDatabase() {
        const schema = `
            -- Master profiles table (deduplicated)
            CREATE TABLE IF NOT EXISTS master_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                master_fingerprint TEXT UNIQUE NOT NULL,
                canonical_name TEXT NOT NULL,
                canonical_email TEXT,
                canonical_location TEXT,
                canonical_company TEXT,
                canonical_linkedin TEXT,
                confidence_score INTEGER DEFAULT 100,
                platforms_count INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Platform-specific profiles (raw data)
            CREATE TABLE IF NOT EXISTS platform_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                master_profile_id INTEGER,
                platform TEXT NOT NULL,
                platform_profile_id TEXT NOT NULL,
                profile_url TEXT NOT NULL,
                raw_data TEXT NOT NULL,
                fingerprint TEXT NOT NULL,
                scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (master_profile_id) REFERENCES master_profiles (id)
            );

            -- Deduplication matches (audit trail)
            CREATE TABLE IF NOT EXISTS deduplication_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile1_id INTEGER NOT NULL,
                profile2_id INTEGER NOT NULL,
                match_confidence INTEGER NOT NULL,
                match_criteria TEXT NOT NULL,
                action_taken TEXT NOT NULL,
                reviewed_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile1_id) REFERENCES platform_profiles (id),
                FOREIGN KEY (profile2_id) REFERENCES platform_profiles (id)
            );

            -- User interaction history (prevent duplicate messaging)
            CREATE TABLE IF NOT EXISTS user_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                master_profile_id INTEGER NOT NULL,
                interaction_type TEXT NOT NULL,
                platform TEXT NOT NULL,
                credits_consumed REAL,
                interaction_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (master_profile_id) REFERENCES master_profiles (id)
            );

            -- Deduplication savings tracking
            CREATE TABLE IF NOT EXISTS deduplication_savings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                duplicate_master_id INTEGER NOT NULL,
                operation_type TEXT NOT NULL,
                credits_saved REAL NOT NULL,
                money_saved REAL NOT NULL,
                platforms_involved TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (duplicate_master_id) REFERENCES master_profiles (id)
            );
        `;

        this.db.exec(schema, (err) => {
            if (err) {
                console.error('Database initialization error:', err);
            } else {
                console.log('Deduplication database initialized successfully');
            }
        });
    }

    // Generate unique profile fingerprint
    generateProfileFingerprint(profile) {
        const fingerprint = {
            // Primary identifiers (exact match)
            email: this.normalizeEmail(profile.email),
            linkedin: this.extractLinkedInId(profile.linkedin_url),
            phone: this.normalizePhone(profile.phone),
            
            // Secondary identifiers (fuzzy match)
            name_normalized: this.normalizeName(profile.full_name),
            location_normalized: this.normalizeLocation(profile.location),
            company_normalized: this.normalizeCompany(profile.company),
            
            // Tertiary identifiers (similarity match)
            skills_hash: this.generateSkillsHash(profile.skills),
            bio_hash: this.generateBioHash(profile.description),
            education_hash: this.generateEducationHash(profile.education),
            
            // Metadata
            platform: profile.source_platform,
            profile_url: profile.original_url,
            last_updated: profile.scraped_at || new Date().toISOString()
        };
        
        return fingerprint;
    }

    // Normalization functions
    normalizeEmail(email) {
        if (!email) return null;
        return email.toLowerCase().trim();
    }

    extractLinkedInId(linkedinUrl) {
        if (!linkedinUrl) return null;
        const match = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
        return match ? match[1].toLowerCase() : null;
    }

    normalizePhone(phone) {
        if (!phone) return null;
        return phone.replace(/[^\d]/g, '');
    }

    normalizeName(name) {
        if (!name) return null;
        return name.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    normalizeLocation(location) {
        if (!location) return null;
        return location.toLowerCase()
            .replace(/[^\w\s,]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    normalizeCompany(company) {
        if (!company) return null;
        return company.toLowerCase()
            .replace(/\b(inc|llc|corp|ltd|co)\b\.?/g, '')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    generateSkillsHash(skills) {
        if (!skills || !Array.isArray(skills)) return null;
        const normalizedSkills = skills.map(skill => 
            skill.toLowerCase().replace(/[^\w]/g, '')
        ).sort();
        return crypto.createHash('md5').update(normalizedSkills.join(',')).digest('hex');
    }

    generateBioHash(description) {
        if (!description) return null;
        const normalized = description.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        return crypto.createHash('md5').update(normalized).digest('hex');
    }

    generateEducationHash(education) {
        if (!education) return null;
        const normalized = education.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        return crypto.createHash('md5').update(normalized).digest('hex');
    }

    // Fuzzy matching algorithms
    calculateLevenshteinDistance(str1, str2) {
        if (!str1 || !str2) return 100;
        
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 0 : (1 - matrix[str2.length][str1.length] / maxLength) * 100;
    }

    fuzzyNameMatch(name1, name2) {
        if (!name1 || !name2) return 0;
        
        const normalized1 = this.normalizeName(name1);
        const normalized2 = this.normalizeName(name2);
        
        // Exact match
        if (normalized1 === normalized2) return 100;
        
        // Split names and check individual parts
        const parts1 = normalized1.split(' ');
        const parts2 = normalized2.split(' ');
        
        let totalScore = 0;
        let comparisons = 0;
        
        for (const part1 of parts1) {
            for (const part2 of parts2) {
                totalScore += this.calculateLevenshteinDistance(part1, part2);
                comparisons++;
            }
        }
        
        return comparisons > 0 ? totalScore / comparisons : 0;
    }

    fuzzyLocationMatch(location1, location2) {
        if (!location1 || !location2) return 0;
        
        const normalized1 = this.normalizeLocation(location1);
        const normalized2 = this.normalizeLocation(location2);
        
        return this.calculateLevenshteinDistance(normalized1, normalized2);
    }

    fuzzyCompanyMatch(company1, company2) {
        if (!company1 || !company2) return 0;
        
        const normalized1 = this.normalizeCompany(company1);
        const normalized2 = this.normalizeCompany(company2);
        
        return this.calculateLevenshteinDistance(normalized1, normalized2);
    }

    calculateSkillsSimilarity(skills1, skills2) {
        if (!skills1 || !skills2 || !Array.isArray(skills1) || !Array.isArray(skills2)) return 0;
        
        const set1 = new Set(skills1.map(s => s.toLowerCase()));
        const set2 = new Set(skills2.map(s => s.toLowerCase()));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
    }

    // Main matching confidence calculation
    calculateMatchConfidence(profile1, profile2) {
        let confidence = 0;
        const matchCriteria = [];
        
        // Exact matches (high weight)
        if (profile1.email && profile2.email && profile1.email === profile2.email) {
            confidence += 40;
            matchCriteria.push('email_exact');
        }
        
        if (profile1.linkedin && profile2.linkedin && profile1.linkedin === profile2.linkedin) {
            confidence += 35;
            matchCriteria.push('linkedin_exact');
        }
        
        if (profile1.phone && profile2.phone && profile1.phone === profile2.phone) {
            confidence += 25;
            matchCriteria.push('phone_exact');
        }
        
        // Name matching (medium weight)
        const nameScore = this.fuzzyNameMatch(profile1.name_normalized, profile2.name_normalized);
        if (nameScore > 80) {
            confidence += (nameScore / 100) * 20;
            matchCriteria.push(`name_fuzzy_${Math.round(nameScore)}`);
        }
        
        // Location matching (medium weight)
        const locationScore = this.fuzzyLocationMatch(profile1.location_normalized, profile2.location_normalized);
        if (locationScore > 70) {
            confidence += (locationScore / 100) * 15;
            matchCriteria.push(`location_fuzzy_${Math.round(locationScore)}`);
        }
        
        // Company matching (low weight)
        const companyScore = this.fuzzyCompanyMatch(profile1.company_normalized, profile2.company_normalized);
        if (companyScore > 60) {
            confidence += (companyScore / 100) * 10;
            matchCriteria.push(`company_fuzzy_${Math.round(companyScore)}`);
        }
        
        // Skills similarity (low weight)
        const skillsScore = this.calculateSkillsSimilarity(profile1.skills, profile2.skills);
        if (skillsScore > 30) {
            confidence += (skillsScore / 100) * 5;
            matchCriteria.push(`skills_similarity_${Math.round(skillsScore)}`);
        }
        
        return {
            confidence: Math.min(confidence, 100),
            criteria: matchCriteria
        };
    }

    // Process new profile for deduplication
    async processProfile(profileData, userId) {
        return new Promise((resolve, reject) => {
            const fingerprint = this.generateProfileFingerprint(profileData);
            
            // Check for existing matches
            this.findPotentialMatches(fingerprint, (err, matches) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                let bestMatch = null;
                let highestConfidence = 0;
                
                for (const match of matches) {
                    const matchResult = this.calculateMatchConfidence(fingerprint, match.fingerprint);
                    
                    if (matchResult.confidence > highestConfidence) {
                        highestConfidence = matchResult.confidence;
                        bestMatch = {
                            ...match,
                            confidence: matchResult.confidence,
                            criteria: matchResult.criteria
                        };
                    }
                }
                
                if (highestConfidence >= this.HIGH_CONFIDENCE_THRESHOLD) {
                    // High confidence duplicate found
                    this.handleDuplicate(profileData, bestMatch, userId, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                } else if (highestConfidence >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
                    // Medium confidence - flag for review
                    this.flagForReview(profileData, bestMatch, userId, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                } else {
                    // No significant match - create new master profile
                    this.createNewMasterProfile(profileData, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                }
            });
        });
    }

    findPotentialMatches(fingerprint, callback) {
        const query = `
            SELECT mp.*, pp.fingerprint, pp.raw_data
            FROM master_profiles mp
            JOIN platform_profiles pp ON mp.id = pp.master_profile_id
            WHERE mp.canonical_email = ? 
               OR mp.canonical_linkedin = ?
               OR (mp.canonical_name = ? AND mp.canonical_location = ?)
               OR (mp.canonical_name = ? AND mp.canonical_company = ?)
        `;
        
        this.db.all(query, [
            fingerprint.email,
            fingerprint.linkedin,
            fingerprint.name_normalized,
            fingerprint.location_normalized,
            fingerprint.name_normalized,
            fingerprint.company_normalized
        ], (err, rows) => {
            if (err) {
                callback(err, null);
                return;
            }
            
            const matches = rows.map(row => ({
                ...row,
                fingerprint: JSON.parse(row.fingerprint)
            }));
            
            callback(null, matches);
        });
    }

    handleDuplicate(profileData, bestMatch, userId, callback) {
        const creditsToSave = this.OPERATION_COSTS.profileAnalysis + this.OPERATION_COSTS.profileSearch;
        const moneyToSave = creditsToSave * 0.01;
        
        // Log the duplicate and savings
        const savingsQuery = `
            INSERT INTO deduplication_savings 
            (user_id, duplicate_master_id, operation_type, credits_saved, money_saved, platforms_involved)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        this.db.run(savingsQuery, [
            userId,
            bestMatch.id,
            'duplicate_prevented',
            creditsToSave,
            moneyToSave,
            JSON.stringify([profileData.source_platform, bestMatch.platform])
        ], (err) => {
            if (err) {
                callback(err, null);
                return;
            }
            
            callback(null, {
                action: 'duplicate_prevented',
                master_profile_id: bestMatch.id,
                confidence: bestMatch.confidence,
                credits_saved: creditsToSave,
                money_saved: moneyToSave,
                platforms: [profileData.source_platform, bestMatch.platform],
                message: `Duplicate detected: ${profileData.full_name} found on ${bestMatch.platform} - ${creditsToSave} credits saved`
            });
        });
    }

    flagForReview(profileData, bestMatch, userId, callback) {
        // Create new profile but flag the potential match
        this.createNewMasterProfile(profileData, (err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            
            // Log the potential match for admin review
            const matchQuery = `
                INSERT INTO deduplication_matches 
                (profile1_id, profile2_id, match_confidence, match_criteria, action_taken)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(matchQuery, [
                result.platform_profile_id,
                bestMatch.id,
                bestMatch.confidence,
                JSON.stringify(bestMatch.criteria),
                'flagged_for_review'
            ], (matchErr) => {
                if (matchErr) {
                    console.error('Error logging match for review:', matchErr);
                }
                
                callback(null, {
                    ...result,
                    action: 'flagged_for_review',
                    potential_duplicate: {
                        confidence: bestMatch.confidence,
                        criteria: bestMatch.criteria
                    }
                });
            });
        });
    }

    createNewMasterProfile(profileData, callback) {
        const fingerprint = this.generateProfileFingerprint(profileData);
        
        // Create master profile
        const masterQuery = `
            INSERT INTO master_profiles 
            (master_fingerprint, canonical_name, canonical_email, canonical_location, canonical_company, canonical_linkedin)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const masterFingerprint = crypto.createHash('sha256')
            .update(JSON.stringify(fingerprint))
            .digest('hex');
        
        this.db.run(masterQuery, [
            masterFingerprint,
            fingerprint.name_normalized,
            fingerprint.email,
            fingerprint.location_normalized,
            fingerprint.company_normalized,
            fingerprint.linkedin
        ], function(err) {
            if (err) {
                callback(err, null);
                return;
            }
            
            const masterId = this.lastID;
            
            // Create platform profile
            const platformQuery = `
                INSERT INTO platform_profiles 
                (master_profile_id, platform, platform_profile_id, profile_url, raw_data, fingerprint)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(platformQuery, [
                masterId,
                profileData.source_platform,
                profileData.platform_id || profileData.profile_url,
                profileData.profile_url,
                JSON.stringify(profileData),
                JSON.stringify(fingerprint)
            ], function(platformErr) {
                if (platformErr) {
                    callback(platformErr, null);
                    return;
                }
                
                callback(null, {
                    action: 'new_profile_created',
                    master_profile_id: masterId,
                    platform_profile_id: this.lastID,
                    fingerprint: fingerprint
                });
            });
        });
    }

    // Get deduplication statistics for admin dashboard
    getDeduplicationStats(timeframe = '30 days', callback) {
        const queries = {
            totalSavings: `
                SELECT 
                    COUNT(*) as duplicates_prevented,
                    SUM(credits_saved) as total_credits_saved,
                    SUM(money_saved) as total_money_saved
                FROM deduplication_savings 
                WHERE created_at >= datetime('now', '-${timeframe}')
            `,
            savingsByPlatform: `
                SELECT 
                    platforms_involved,
                    COUNT(*) as count,
                    SUM(credits_saved) as credits_saved
                FROM deduplication_savings 
                WHERE created_at >= datetime('now', '-${timeframe}')
                GROUP BY platforms_involved
            `,
            topDuplicateUsers: `
                SELECT 
                    user_id,
                    COUNT(*) as duplicates_found,
                    SUM(credits_saved) as credits_saved
                FROM deduplication_savings 
                WHERE created_at >= datetime('now', '-${timeframe}')
                GROUP BY user_id
                ORDER BY credits_saved DESC
                LIMIT 10
            `,
            pendingReviews: `
                SELECT COUNT(*) as pending_reviews
                FROM deduplication_matches 
                WHERE action_taken = 'flagged_for_review' AND reviewed_by IS NULL
            `
        };
        
        const results = {};
        let completed = 0;
        const total = Object.keys(queries).length;
        
        for (const [key, query] of Object.entries(queries)) {
            this.db.all(query, (err, rows) => {
                if (err) {
                    console.error(`Error executing ${key} query:`, err);
                    results[key] = null;
                } else {
                    results[key] = rows;
                }
                
                completed++;
                if (completed === total) {
                    callback(null, results);
                }
            });
        }
    }

    // Check if user has already interacted with a profile
    hasUserInteracted(userId, masterProfileId, interactionType, callback) {
        const query = `
            SELECT COUNT(*) as count
            FROM user_interactions 
            WHERE user_id = ? AND master_profile_id = ? AND interaction_type = ?
        `;
        
        this.db.get(query, [userId, masterProfileId, interactionType], (err, row) => {
            if (err) {
                callback(err, null);
                return;
            }
            
            callback(null, row.count > 0);
        });
    }

    // Record user interaction
    recordUserInteraction(userId, masterProfileId, interactionType, platform, creditsConsumed, interactionData, callback) {
        const query = `
            INSERT INTO user_interactions 
            (user_id, master_profile_id, interaction_type, platform, credits_consumed, interaction_data)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        this.db.run(query, [
            userId,
            masterProfileId,
            interactionType,
            platform,
            creditsConsumed,
            JSON.stringify(interactionData)
        ], callback);
    }
}

module.exports = DeduplicationEngine;
