// Cost Benchmarking Script for Multi-Platform Outreach System
// This script measures actual computation costs for all operations

const { performance } = require('perf_hooks');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class CostBenchmarker {
    constructor() {
        this.results = {
            browserOperations: {},
            databaseOperations: {},
            aiOperations: {},
            networkOperations: {},
            systemResources: {}
        };
        
        // Infrastructure cost rates (per unit)
        this.costRates = {
            // Server costs (per hour)
            cpuCoreHour: 0.0416, // $1/month per core = $0.0416/hour
            ramGBHour: 0.0139,   // $10/month per GB = $0.0139/hour
            
            // Network costs
            dataTransferGB: 0.09, // $0.09 per GB
            apiCallCost: 0.0001,  // $0.0001 per API call
            
            // Storage costs
            storageGBMonth: 0.023, // $0.023 per GB per month
            databaseOperationCost: 0.000001, // $0.000001 per operation
            
            // Browser automation costs
            browserInstanceHour: 0.05, // Estimated cost for browser instance
            
            // AI/ML costs (if using external APIs)
            openaiTokenCost: 0.000002, // $0.002 per 1K tokens
            claudeTokenCost: 0.000008  // $0.008 per 1K tokens
        };
    }

    async benchmarkAllOperations() {
        console.log('🔍 Starting comprehensive cost benchmarking...\n');
        
        try {
            await this.benchmarkBrowserOperations();
            await this.benchmarkDatabaseOperations();
            await this.benchmarkNetworkOperations();
            await this.benchmarkSystemResources();
            
            this.calculateActualCosts();
            this.generateCostReport();
            
        } catch (error) {
            console.error('Benchmarking failed:', error);
        }
    }

    async benchmarkBrowserOperations() {
        console.log('📱 Benchmarking browser operations...');
        
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Test 1: Page Navigation
        const navStart = performance.now();
        await page.goto('https://cofounderslab.com');
        const navEnd = performance.now();
        this.results.browserOperations.pageNavigation = {
            duration: navEnd - navStart,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        // Test 2: Element Search and Interaction
        const searchStart = performance.now();
        try {
            await page.waitForSelector('body', { timeout: 5000 });
            await page.evaluate(() => {
                // Simulate profile search
                const elements = document.querySelectorAll('div, span, a');
                return elements.length;
            });
        } catch (error) {
            console.log('Search operation completed with timeout');
        }
        const searchEnd = performance.now();
        this.results.browserOperations.elementSearch = {
            duration: searchEnd - searchStart,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        // Test 3: Data Extraction
        const extractStart = performance.now();
        const extractedData = await page.evaluate(() => {
            return {
                title: document.title,
                links: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => a.href),
                text: document.body.innerText.substring(0, 1000)
            };
        });
        const extractEnd = performance.now();
        this.results.browserOperations.dataExtraction = {
            duration: extractEnd - extractStart,
            dataSize: JSON.stringify(extractedData).length,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        // Test 4: Form Interaction (simulated)
        const formStart = performance.now();
        try {
            await page.evaluate(() => {
                // Simulate form filling
                const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
                inputs.forEach((input, index) => {
                    if (index < 3) { // Limit to first 3 inputs
                        input.value = `test_value_${index}`;
                    }
                });
            });
        } catch (error) {
            console.log('Form interaction simulation completed');
        }
        const formEnd = performance.now();
        this.results.browserOperations.formInteraction = {
            duration: formEnd - formStart,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        await browser.close();
        console.log('✅ Browser operations benchmarked\n');
    }

    async benchmarkDatabaseOperations() {
        console.log('🗄️ Benchmarking database operations...');
        
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(':memory:');
        
        // Test 1: Table Creation
        const createStart = performance.now();
        await new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE test_users (
                    id INTEGER PRIMARY KEY,
                    name TEXT,
                    email TEXT,
                    credits INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        const createEnd = performance.now();
        this.results.databaseOperations.tableCreation = {
            duration: createEnd - createStart,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        // Test 2: Bulk Insert Operations
        const insertStart = performance.now();
        const insertPromises = [];
        for (let i = 0; i < 100; i++) {
            insertPromises.push(new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO test_users (name, email, credits) VALUES (?, ?, ?)',
                    [`User ${i}`, `user${i}@test.com`, Math.floor(Math.random() * 1000)],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            }));
        }
        await Promise.all(insertPromises);
        const insertEnd = performance.now();
        this.results.databaseOperations.bulkInsert = {
            duration: insertEnd - insertStart,
            recordCount: 100,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        // Test 3: Complex Query Operations
        const queryStart = performance.now();
        await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    COUNT(*) as total_users,
                    AVG(credits) as avg_credits,
                    MAX(credits) as max_credits,
                    MIN(credits) as min_credits
                FROM test_users 
                WHERE credits > 100
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        const queryEnd = performance.now();
        this.results.databaseOperations.complexQuery = {
            duration: queryEnd - queryStart,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        // Test 4: Update Operations
        const updateStart = performance.now();
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE test_users SET credits = credits + 100 WHERE id % 2 = 0',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        const updateEnd = performance.now();
        this.results.databaseOperations.bulkUpdate = {
            duration: updateEnd - updateStart,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        db.close();
        console.log('✅ Database operations benchmarked\n');
    }

    async benchmarkNetworkOperations() {
        console.log('🌐 Benchmarking network operations...');
        
        const axios = require('axios');
        
        // Test 1: Simple HTTP GET Request
        const getStart = performance.now();
        try {
            const response = await axios.get('https://httpbin.org/get', {
                timeout: 10000
            });
            const getEnd = performance.now();
            this.results.networkOperations.httpGet = {
                duration: getEnd - getStart,
                responseSize: JSON.stringify(response.data).length,
                statusCode: response.status,
                memoryUsage: process.memoryUsage(),
                iterations: 1
            };
        } catch (error) {
            console.log('HTTP GET test completed with error:', error.message);
            this.results.networkOperations.httpGet = {
                duration: 5000, // Fallback duration
                error: error.message,
                iterations: 1
            };
        }
        
        // Test 2: HTTP POST Request with Data
        const postStart = performance.now();
        try {
            const testData = {
                message: 'Hello, I am interested in connecting for a potential co-founder opportunity.',
                sender: 'test_user',
                timestamp: new Date().toISOString()
            };
            
            const response = await axios.post('https://httpbin.org/post', testData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const postEnd = performance.now();
            this.results.networkOperations.httpPost = {
                duration: postEnd - postStart,
                requestSize: JSON.stringify(testData).length,
                responseSize: JSON.stringify(response.data).length,
                statusCode: response.status,
                memoryUsage: process.memoryUsage(),
                iterations: 1
            };
        } catch (error) {
            console.log('HTTP POST test completed with error:', error.message);
            this.results.networkOperations.httpPost = {
                duration: 5000, // Fallback duration
                error: error.message,
                iterations: 1
            };
        }
        
        // Test 3: Multiple Concurrent Requests
        const concurrentStart = performance.now();
        try {
            const requests = Array(5).fill().map((_, i) => 
                axios.get(`https://httpbin.org/delay/1?id=${i}`, { timeout: 15000 })
            );
            await Promise.all(requests);
            const concurrentEnd = performance.now();
            this.results.networkOperations.concurrentRequests = {
                duration: concurrentEnd - concurrentStart,
                requestCount: 5,
                memoryUsage: process.memoryUsage(),
                iterations: 1
            };
        } catch (error) {
            console.log('Concurrent requests test completed with error:', error.message);
            this.results.networkOperations.concurrentRequests = {
                duration: 10000, // Fallback duration
                error: error.message,
                iterations: 1
            };
        }
        
        console.log('✅ Network operations benchmarked\n');
    }

    async benchmarkSystemResources() {
        console.log('💻 Benchmarking system resource usage...');
        
        // Test 1: CPU Intensive Operation
        const cpuStart = performance.now();
        const startMemory = process.memoryUsage();
        
        // Simulate AI processing workload
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
        }
        
        const cpuEnd = performance.now();
        const endMemory = process.memoryUsage();
        
        this.results.systemResources.cpuIntensive = {
            duration: cpuEnd - cpuStart,
            memoryDelta: {
                rss: endMemory.rss - startMemory.rss,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal
            },
            result: result,
            iterations: 1
        };
        
        // Test 2: Memory Allocation
        const memStart = performance.now();
        const startMem = process.memoryUsage();
        
        // Allocate and process large data structures
        const largeArray = new Array(100000).fill().map((_, i) => ({
            id: i,
            data: `data_${i}`,
            timestamp: Date.now(),
            metadata: {
                processed: false,
                score: Math.random()
            }
        }));
        
        // Process the data
        const processedData = largeArray
            .filter(item => item.metadata.score > 0.5)
            .map(item => ({
                ...item,
                metadata: { ...item.metadata, processed: true }
            }));
        
        const memEnd = performance.now();
        const endMem = process.memoryUsage();
        
        this.results.systemResources.memoryAllocation = {
            duration: memEnd - memStart,
            itemsProcessed: largeArray.length,
            itemsFiltered: processedData.length,
            memoryDelta: {
                rss: endMem.rss - startMem.rss,
                heapUsed: endMem.heapUsed - startMem.heapUsed,
                heapTotal: endMem.heapTotal - startMem.heapTotal
            },
            iterations: 1
        };
        
        // Test 3: File I/O Operations
        const ioStart = performance.now();
        const testData = JSON.stringify({
            users: Array(1000).fill().map((_, i) => ({
                id: i,
                name: `User ${i}`,
                email: `user${i}@test.com`,
                credits: Math.floor(Math.random() * 1000)
            }))
        });
        
        // Write file
        fs.writeFileSync('/tmp/test_data.json', testData);
        
        // Read file
        const readData = fs.readFileSync('/tmp/test_data.json', 'utf8');
        
        // Parse and process
        const parsedData = JSON.parse(readData);
        
        // Clean up
        fs.unlinkSync('/tmp/test_data.json');
        
        const ioEnd = performance.now();
        
        this.results.systemResources.fileIO = {
            duration: ioEnd - ioStart,
            dataSize: testData.length,
            recordCount: parsedData.users.length,
            memoryUsage: process.memoryUsage(),
            iterations: 1
        };
        
        console.log('✅ System resource benchmarking completed\n');
    }

    calculateActualCosts() {
        console.log('💰 Calculating actual costs based on benchmarks...\n');
        
        const costs = {};
        
        // Browser Operation Costs
        costs.browserOperations = {};
        
        // Page Navigation Cost
        const navDuration = this.results.browserOperations.pageNavigation.duration / 1000; // Convert to seconds
        costs.browserOperations.pageNavigation = {
            cpuCost: (navDuration / 3600) * this.costRates.cpuCoreHour * 0.5, // 50% CPU usage
            memoryCost: (navDuration / 3600) * this.costRates.ramGBHour * 0.1, // 100MB RAM
            browserCost: (navDuration / 3600) * this.costRates.browserInstanceHour,
            networkCost: this.costRates.dataTransferGB * 0.001, // ~1MB data transfer
            total: 0
        };
        costs.browserOperations.pageNavigation.total = 
            costs.browserOperations.pageNavigation.cpuCost +
            costs.browserOperations.pageNavigation.memoryCost +
            costs.browserOperations.pageNavigation.browserCost +
            costs.browserOperations.pageNavigation.networkCost;
        
        // Element Search Cost
        const searchDuration = this.results.browserOperations.elementSearch.duration / 1000;
        costs.browserOperations.elementSearch = {
            cpuCost: (searchDuration / 3600) * this.costRates.cpuCoreHour * 0.3,
            memoryCost: (searchDuration / 3600) * this.costRates.ramGBHour * 0.05,
            browserCost: (searchDuration / 3600) * this.costRates.browserInstanceHour,
            total: 0
        };
        costs.browserOperations.elementSearch.total = 
            costs.browserOperations.elementSearch.cpuCost +
            costs.browserOperations.elementSearch.memoryCost +
            costs.browserOperations.elementSearch.browserCost;
        
        // Data Extraction Cost
        const extractDuration = this.results.browserOperations.dataExtraction.duration / 1000;
        const dataSize = this.results.browserOperations.dataExtraction.dataSize;
        costs.browserOperations.dataExtraction = {
            cpuCost: (extractDuration / 3600) * this.costRates.cpuCoreHour * 0.4,
            memoryCost: (extractDuration / 3600) * this.costRates.ramGBHour * 0.02,
            browserCost: (extractDuration / 3600) * this.costRates.browserInstanceHour,
            storageCost: (dataSize / 1024 / 1024 / 1024) * this.costRates.storageGBMonth / 30, // Daily cost
            total: 0
        };
        costs.browserOperations.dataExtraction.total = 
            costs.browserOperations.dataExtraction.cpuCost +
            costs.browserOperations.dataExtraction.memoryCost +
            costs.browserOperations.dataExtraction.browserCost +
            costs.browserOperations.dataExtraction.storageCost;
        
        // Form Interaction Cost
        const formDuration = this.results.browserOperations.formInteraction.duration / 1000;
        costs.browserOperations.formInteraction = {
            cpuCost: (formDuration / 3600) * this.costRates.cpuCoreHour * 0.2,
            memoryCost: (formDuration / 3600) * this.costRates.ramGBHour * 0.01,
            browserCost: (formDuration / 3600) * this.costRates.browserInstanceHour,
            total: 0
        };
        costs.browserOperations.formInteraction.total = 
            costs.browserOperations.formInteraction.cpuCost +
            costs.browserOperations.formInteraction.memoryCost +
            costs.browserOperations.formInteraction.browserCost;
        
        // Database Operation Costs
        costs.databaseOperations = {};
        
        // Single Query Cost
        const queryDuration = this.results.databaseOperations.complexQuery.duration / 1000;
        costs.databaseOperations.singleQuery = {
            cpuCost: (queryDuration / 3600) * this.costRates.cpuCoreHour * 0.1,
            memoryCost: (queryDuration / 3600) * this.costRates.ramGBHour * 0.001,
            dbOperationCost: this.costRates.databaseOperationCost,
            total: 0
        };
        costs.databaseOperations.singleQuery.total = 
            costs.databaseOperations.singleQuery.cpuCost +
            costs.databaseOperations.singleQuery.memoryCost +
            costs.databaseOperations.singleQuery.dbOperationCost;
        
        // Insert Operation Cost
        const insertDuration = this.results.databaseOperations.bulkInsert.duration / 1000;
        const insertCount = this.results.databaseOperations.bulkInsert.recordCount;
        costs.databaseOperations.insertOperation = {
            cpuCost: (insertDuration / 3600) * this.costRates.cpuCoreHour * 0.2,
            memoryCost: (insertDuration / 3600) * this.costRates.ramGBHour * 0.002,
            dbOperationCost: this.costRates.databaseOperationCost * insertCount,
            storageCost: (insertCount * 100 / 1024 / 1024 / 1024) * this.costRates.storageGBMonth / 30, // 100 bytes per record
            total: 0
        };
        costs.databaseOperations.insertOperation.total = 
            costs.databaseOperations.insertOperation.cpuCost +
            costs.databaseOperations.insertOperation.memoryCost +
            costs.databaseOperations.insertOperation.dbOperationCost +
            costs.databaseOperations.insertOperation.storageCost;
        
        // Network Operation Costs
        costs.networkOperations = {};
        
        // HTTP Request Cost
        if (this.results.networkOperations.httpGet && !this.results.networkOperations.httpGet.error) {
            const httpDuration = this.results.networkOperations.httpGet.duration / 1000;
            const responseSize = this.results.networkOperations.httpGet.responseSize;
            costs.networkOperations.httpRequest = {
                cpuCost: (httpDuration / 3600) * this.costRates.cpuCoreHour * 0.05,
                networkCost: (responseSize / 1024 / 1024 / 1024) * this.costRates.dataTransferGB,
                apiCallCost: this.costRates.apiCallCost,
                total: 0
            };
            costs.networkOperations.httpRequest.total = 
                costs.networkOperations.httpRequest.cpuCost +
                costs.networkOperations.httpRequest.networkCost +
                costs.networkOperations.httpRequest.apiCallCost;
        }
        
        // Calculate composite operation costs
        costs.compositeOperations = {};
        
        // Profile Search (Navigation + Search + Extraction)
        costs.compositeOperations.profileSearch = {
            total: costs.browserOperations.pageNavigation.total +
                   costs.browserOperations.elementSearch.total +
                   costs.browserOperations.dataExtraction.total +
                   costs.databaseOperations.singleQuery.total
        };
        
        // Message Sending (Form Interaction + HTTP Post + Database Insert)
        costs.compositeOperations.messageSending = {
            total: costs.browserOperations.formInteraction.total +
                   (costs.networkOperations.httpRequest?.total || 0.001) +
                   costs.databaseOperations.insertOperation.total
        };
        
        // Profile Analysis (Data Processing + Database Operations)
        const cpuIntensiveDuration = this.results.systemResources.cpuIntensive.duration / 1000;
        costs.compositeOperations.profileAnalysis = {
            cpuCost: (cpuIntensiveDuration / 3600) * this.costRates.cpuCoreHour * 0.8,
            memoryCost: (cpuIntensiveDuration / 3600) * this.costRates.ramGBHour * 0.1,
            dbCost: costs.databaseOperations.singleQuery.total * 3, // Multiple queries
            total: 0
        };
        costs.compositeOperations.profileAnalysis.total = 
            costs.compositeOperations.profileAnalysis.cpuCost +
            costs.compositeOperations.profileAnalysis.memoryCost +
            costs.compositeOperations.profileAnalysis.dbCost;
        
        this.actualCosts = costs;
    }

    generateCostReport() {
        console.log('📊 Generating comprehensive cost report...\n');
        
        const report = {
            timestamp: new Date().toISOString(),
            benchmarkResults: this.results,
            actualCosts: this.actualCosts,
            creditPricing: {},
            recommendations: []
        };
        
        // Calculate credit pricing with 2.5x markup
        const markup = 2.5;
        
        report.creditPricing = {
            profileSearch: {
                actualCost: this.actualCosts.compositeOperations.profileSearch.total,
                customerPrice: this.actualCosts.compositeOperations.profileSearch.total * markup,
                creditsRequired: Math.ceil((this.actualCosts.compositeOperations.profileSearch.total * markup) / 0.01),
                markup: markup
            },
            messageSending: {
                actualCost: this.actualCosts.compositeOperations.messageSending.total,
                customerPrice: this.actualCosts.compositeOperations.messageSending.total * markup,
                creditsRequired: Math.ceil((this.actualCosts.compositeOperations.messageSending.total * markup) / 0.01),
                markup: markup
            },
            profileAnalysis: {
                actualCost: this.actualCosts.compositeOperations.profileAnalysis.total,
                customerPrice: this.actualCosts.compositeOperations.profileAnalysis.total * markup,
                creditsRequired: Math.ceil((this.actualCosts.compositeOperations.profileAnalysis.total * markup) / 0.01),
                markup: markup
            },
            singleDatabaseQuery: {
                actualCost: this.actualCosts.databaseOperations.singleQuery.total,
                customerPrice: this.actualCosts.databaseOperations.singleQuery.total * markup,
                creditsRequired: Math.ceil((this.actualCosts.databaseOperations.singleQuery.total * markup) / 0.01),
                markup: markup
            }
        };
        
        // Generate recommendations
        report.recommendations = [
            'Profile search operations are the most cost-effective for users',
            'Message sending has moderate costs due to network and browser overhead',
            'Profile analysis is the most expensive due to CPU-intensive processing',
            'Database operations are very cost-effective and should be encouraged',
            'Consider batching operations to reduce per-operation overhead costs'
        ];
        
        // Save report to file
        fs.writeFileSync('./cost_analysis_report.json', JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('💰 ACTUAL COST ANALYSIS RESULTS');
        console.log('=====================================');
        console.log(`Profile Search: $${report.creditPricing.profileSearch.actualCost.toFixed(6)} → ${report.creditPricing.profileSearch.creditsRequired} credits ($${report.creditPricing.profileSearch.customerPrice.toFixed(4)})`);
        console.log(`Message Sending: $${report.creditPricing.messageSending.actualCost.toFixed(6)} → ${report.creditPricing.messageSending.creditsRequired} credits ($${report.creditPricing.messageSending.customerPrice.toFixed(4)})`);
        console.log(`Profile Analysis: $${report.creditPricing.profileAnalysis.actualCost.toFixed(6)} → ${report.creditPricing.profileAnalysis.creditsRequired} credits ($${report.creditPricing.profileAnalysis.customerPrice.toFixed(4)})`);
        console.log(`Database Query: $${report.creditPricing.singleDatabaseQuery.actualCost.toFixed(6)} → ${report.creditPricing.singleDatabaseQuery.creditsRequired} credits ($${report.creditPricing.singleDatabaseQuery.customerPrice.toFixed(4)})`);
        console.log('\n✅ Cost analysis complete! Report saved to cost_analysis_report.json');
        
        return report;
    }
}

// Run benchmarking if script is executed directly
if (require.main === module) {
    const benchmarker = new CostBenchmarker();
    benchmarker.benchmarkAllOperations().then(() => {
        console.log('\n🎉 All benchmarking completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Benchmarking failed:', error);
        process.exit(1);
    });
}

module.exports = CostBenchmarker;
