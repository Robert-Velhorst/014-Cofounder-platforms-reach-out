// Slicing Pie Equity Calculator Service
// Fair, dynamic equity allocation based on contributions

class SlicingPieCalculator {
  constructor() {
    this.companies = new Map();
    this.contributions = new Map();
    this.founders = new Map();
    
    // Risk multipliers
    this.multipliers = {
      founder: {
        time: 2,
        cash: 4,
        expenses: 4,
        supplies: 2,
        relationships: 2,
        ip: 2,
      },
      employee: {
        time: 1,
        cash: 1,
        expenses: 1,
        supplies: 1,
        relationships: 1,
        ip: 1,
      },
      advisor: {
        time: 1.5,
        cash: 1,
        expenses: 1,
        relationships: 1.5,
        ip: 1.5,
      },
    };

    // Fair market hourly rates by role
    this.hourlyRates = {
      developer: 150,
      designer: 125,
      product_manager: 140,
      sales: 130,
      marketing: 120,
      operations: 110,
      finance: 135,
      legal: 200,
      general: 100,
    };
  }

  // Create new company
  createCompany(companyId, name, foundedDate) {
    const company = {
      id: companyId,
      name,
      foundedDate,
      founders: [],
      totalSlices: 0,
      createdAt: new Date().toISOString(),
    };
    this.companies.set(companyId, company);
    return company;
  }

  // Add founder to company
  addFounder(companyId, founderId, founderData) {
    const company = this.companies.get(companyId);
    if (!company) throw new Error('Company not found');

    const founder = {
      id: founderId,
      name: founderData.name,
      email: founderData.email,
      role: founderData.role || 'founder',
      joinedDate: founderData.joinedDate || new Date().toISOString(),
      slices: 0,
      contributions: [],
    };

    this.founders.set(founderId, founder);
    company.founders.push(founderId);
    
    return founder;
  }

  // Add contribution
  addContribution(companyId, founderId, contributionData) {
    const company = this.companies.get(companyId);
    const founder = this.founders.get(founderId);
    
    if (!company) throw new Error('Company not found');
    if (!founder) throw new Error('Founder not found');

    const contributionId = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const contribution = {
      id: contributionId,
      companyId,
      founderId,
      type: contributionData.type, // time, cash, expenses, supplies, relationships, ip
      date: contributionData.date || new Date().toISOString(),
      description: contributionData.description,
      details: contributionData.details,
      fairMarketValue: 0,
      riskMultiplier: 0,
      slices: 0,
      status: 'pending', // pending, approved, rejected
      approvedBy: null,
      approvedAt: null,
    };

    // Calculate fair market value and slices
    this.calculateContributionValue(contribution, founder);

    this.contributions.set(contributionId, contribution);
    founder.contributions.push(contributionId);

    return contribution;
  }

  // Calculate contribution value and slices
  calculateContributionValue(contribution, founder) {
    const { type, details } = contribution;
    const founderRole = founder.role || 'founder';
    const multiplier = this.multipliers[founderRole][type];

    switch (type) {
      case 'time':
        // Hours × Hourly Rate × Risk Multiplier
        const hours = details.hours || 0;
        const role = details.role || 'general';
        const hourlyRate = details.hourlyRate || this.hourlyRates[role] || 100;
        contribution.fairMarketValue = hours * hourlyRate;
        contribution.riskMultiplier = multiplier;
        contribution.slices = contribution.fairMarketValue * multiplier;
        break;

      case 'cash':
        // Cash Amount × Risk Multiplier
        contribution.fairMarketValue = details.amount || 0;
        contribution.riskMultiplier = multiplier;
        contribution.slices = contribution.fairMarketValue * multiplier;
        break;

      case 'expenses':
        // Expense Amount × Risk Multiplier
        contribution.fairMarketValue = details.amount || 0;
        contribution.riskMultiplier = multiplier;
        contribution.slices = contribution.fairMarketValue * multiplier;
        break;

      case 'supplies':
        // Fair Market Value × Risk Multiplier
        contribution.fairMarketValue = details.fairMarketValue || 0;
        contribution.riskMultiplier = multiplier;
        contribution.slices = contribution.fairMarketValue * multiplier;
        break;

      case 'relationships':
        // Value Generated × Commission Rate × Risk Multiplier
        const valueGenerated = details.valueGenerated || 0;
        const commissionRate = details.commissionRate || 0.15; // 15% default
        contribution.fairMarketValue = valueGenerated * commissionRate;
        contribution.riskMultiplier = multiplier;
        contribution.slices = contribution.fairMarketValue * multiplier;
        break;

      case 'ip':
        // Development Cost or Market Value × Risk Multiplier
        contribution.fairMarketValue = details.developmentCost || details.marketValue || 0;
        contribution.riskMultiplier = multiplier;
        contribution.slices = contribution.fairMarketValue * multiplier;
        break;

      default:
        contribution.fairMarketValue = 0;
        contribution.riskMultiplier = 1;
        contribution.slices = 0;
    }
  }

  // Approve contribution
  approveContribution(contributionId, approvedBy) {
    const contribution = this.contributions.get(contributionId);
    if (!contribution) throw new Error('Contribution not found');

    contribution.status = 'approved';
    contribution.approvedBy = approvedBy;
    contribution.approvedAt = new Date().toISOString();

    // Update founder slices
    const founder = this.founders.get(contribution.founderId);
    founder.slices += contribution.slices;

    // Update company total slices
    const company = this.companies.get(contribution.companyId);
    company.totalSlices += contribution.slices;

    return contribution;
  }

  // Reject contribution
  rejectContribution(contributionId, rejectedBy, reason) {
    const contribution = this.contributions.get(contributionId);
    if (!contribution) throw new Error('Contribution not found');

    contribution.status = 'rejected';
    contribution.rejectedBy = rejectedBy;
    contribution.rejectedAt = new Date().toISOString();
    contribution.rejectionReason = reason;

    return contribution;
  }

  // Calculate equity distribution
  calculateEquity(companyId) {
    const company = this.companies.get(companyId);
    if (!company) throw new Error('Company not found');

    const distribution = [];
    const totalSlices = company.totalSlices;

    for (const founderId of company.founders) {
      const founder = this.founders.get(founderId);
      const percentage = totalSlices > 0 ? (founder.slices / totalSlices) * 100 : 0;

      distribution.push({
        founderId: founder.id,
        name: founder.name,
        role: founder.role,
        slices: founder.slices,
        percentage: percentage,
        contributionCount: founder.contributions.length,
      });
    }

    // Sort by percentage descending
    distribution.sort((a, b) => b.percentage - a.percentage);

    return {
      companyId,
      totalSlices,
      distribution,
      calculatedAt: new Date().toISOString(),
    };
  }

  // Get founder's contribution breakdown
  getFounderContributions(founderId) {
    const founder = this.founders.get(founderId);
    if (!founder) throw new Error('Founder not found');

    const contributions = founder.contributions.map(id => this.contributions.get(id));
    
    const breakdown = {
      time: { count: 0, slices: 0, fmv: 0 },
      cash: { count: 0, slices: 0, fmv: 0 },
      expenses: { count: 0, slices: 0, fmv: 0 },
      supplies: { count: 0, slices: 0, fmv: 0 },
      relationships: { count: 0, slices: 0, fmv: 0 },
      ip: { count: 0, slices: 0, fmv: 0 },
    };

    for (const contrib of contributions) {
      if (contrib.status === 'approved') {
        breakdown[contrib.type].count++;
        breakdown[contrib.type].slices += contrib.slices;
        breakdown[contrib.type].fmv += contrib.fairMarketValue;
      }
    }

    return {
      founderId,
      name: founder.name,
      totalSlices: founder.slices,
      breakdown,
      contributions: contributions.filter(c => c.status === 'approved'),
    };
  }

  // Scenario modeling: What-if analysis
  modelScenario(companyId, scenarios) {
    const company = this.companies.get(companyId);
    if (!company) throw new Error('Company not found');

    const results = [];

    for (const scenario of scenarios) {
      const { name, hypotheticalContributions } = scenario;
      
      // Calculate hypothetical total slices
      let hypotheticalTotal = company.totalSlices;
      const founderSlices = new Map();

      // Initialize with current slices
      for (const founderId of company.founders) {
        const founder = this.founders.get(founderId);
        founderSlices.set(founderId, founder.slices);
      }

      // Add hypothetical contributions
      for (const contrib of hypotheticalContributions) {
        const founder = this.founders.get(contrib.founderId);
        const tempContrib = {
          type: contrib.type,
          details: contrib.details,
        };
        this.calculateContributionValue(tempContrib, founder);
        
        const currentSlices = founderSlices.get(contrib.founderId) || 0;
        founderSlices.set(contrib.founderId, currentSlices + tempContrib.slices);
        hypotheticalTotal += tempContrib.slices;
      }

      // Calculate new percentages
      const distribution = [];
      for (const [founderId, slices] of founderSlices.entries()) {
        const founder = this.founders.get(founderId);
        distribution.push({
          founderId,
          name: founder.name,
          slices,
          percentage: (slices / hypotheticalTotal) * 100,
        });
      }

      results.push({
        scenarioName: name,
        totalSlices: hypotheticalTotal,
        distribution,
      });
    }

    return results;
  }

  // Model exit scenario (acquisition, IPO)
  modelExit(companyId, exitValue) {
    const equity = this.calculateEquity(companyId);
    
    const exitDistribution = equity.distribution.map(founder => ({
      ...founder,
      exitValue: (founder.percentage / 100) * exitValue,
    }));

    return {
      companyId,
      exitValue,
      distribution: exitDistribution,
    };
  }

  // Model dilution (funding round)
  modelDilution(companyId, newInvestmentAmount, postMoneyValuation) {
    const equity = this.calculateEquity(companyId);
    
    const newEquityPercentage = (newInvestmentAmount / postMoneyValuation) * 100;
    const dilutionFactor = 1 - (newEquityPercentage / 100);

    const dilutedDistribution = equity.distribution.map(founder => ({
      ...founder,
      originalPercentage: founder.percentage,
      dilutedPercentage: founder.percentage * dilutionFactor,
      dilution: founder.percentage - (founder.percentage * dilutionFactor),
    }));

    return {
      companyId,
      investmentAmount: newInvestmentAmount,
      postMoneyValuation,
      newEquityPercentage,
      distribution: dilutedDistribution,
    };
  }

  // Generate vesting schedule
  generateVestingSchedule(founderId, vestingPeriodMonths = 48, cliffMonths = 12) {
    const founder = this.founders.get(founderId);
    if (!founder) throw new Error('Founder not found');

    const totalSlices = founder.slices;
    const monthlyVesting = totalSlices / vestingPeriodMonths;
    
    const schedule = [];
    let vestedSlices = 0;

    for (let month = 0; month <= vestingPeriodMonths; month++) {
      if (month < cliffMonths) {
        // Before cliff: no vesting
        schedule.push({
          month,
          vestedSlices: 0,
          unvestedSlices: totalSlices,
          percentage: 0,
        });
      } else if (month === cliffMonths) {
        // At cliff: vest cliff amount
        vestedSlices = monthlyVesting * cliffMonths;
        schedule.push({
          month,
          vestedSlices,
          unvestedSlices: totalSlices - vestedSlices,
          percentage: (vestedSlices / totalSlices) * 100,
        });
      } else {
        // After cliff: monthly vesting
        vestedSlices = monthlyVesting * month;
        schedule.push({
          month,
          vestedSlices,
          unvestedSlices: totalSlices - vestedSlices,
          percentage: (vestedSlices / totalSlices) * 100,
        });
      }
    }

    return {
      founderId,
      name: founder.name,
      totalSlices,
      vestingPeriodMonths,
      cliffMonths,
      monthlyVesting,
      schedule,
    };
  }

  // Generate co-founder agreement
  generateAgreement(companyId) {
    const company = this.companies.get(companyId);
    const equity = this.calculateEquity(companyId);

    const agreement = {
      companyName: company.name,
      foundedDate: company.foundedDate,
      generatedDate: new Date().toISOString(),
      founders: equity.distribution.map(f => ({
        name: f.name,
        role: f.role,
        equityPercentage: f.percentage.toFixed(2),
      })),
      terms: {
        equityModel: 'Slicing Pie - Dynamic Equity Split',
        vestingPeriod: '4 years',
        cliffPeriod: '1 year',
        contributionTracking: 'Real-time with approval process',
        disputeResolution: 'Mediation then arbitration',
        ipAssignment: 'All IP assigned to company',
        nonCompete: '1 year post-departure',
        confidentiality: 'Perpetual',
      },
      nextSteps: [
        'Review and sign this agreement',
        'Set up contribution tracking system',
        'Schedule monthly equity reviews',
        'Consult with legal counsel',
        'File necessary incorporation documents',
      ],
    };

    return agreement;
  }

  // Get company summary
  getCompanySummary(companyId) {
    const company = this.companies.get(companyId);
    if (!company) throw new Error('Company not found');

    const equity = this.calculateEquity(companyId);
    
    const allContributions = [];
    for (const founderId of company.founders) {
      const founder = this.founders.get(founderId);
      for (const contribId of founder.contributions) {
        allContributions.push(this.contributions.get(contribId));
      }
    }

    const approvedContributions = allContributions.filter(c => c.status === 'approved');
    const pendingContributions = allContributions.filter(c => c.status === 'pending');

    return {
      company: {
        id: company.id,
        name: company.name,
        foundedDate: company.foundedDate,
        founderCount: company.founders.length,
      },
      equity: equity.distribution,
      totalSlices: company.totalSlices,
      contributions: {
        total: allContributions.length,
        approved: approvedContributions.length,
        pending: pendingContributions.length,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

module.exports = SlicingPieCalculator;

// Example usage:
if (require.main === module) {
  const calculator = new SlicingPieCalculator();

  // Create company
  const company = calculator.createCompany('comp_1', 'TechStartup Inc', '2024-01-01');
  console.log('Company created:', company);

  // Add founders
  const founder1 = calculator.addFounder('comp_1', 'founder_1', {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'founder',
  });

  const founder2 = calculator.addFounder('comp_1', 'founder_2', {
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'founder',
  });

  // Add contributions
  const contrib1 = calculator.addContribution('comp_1', 'founder_1', {
    type: 'time',
    description: 'Backend development',
    details: {
      hours: 160,
      role: 'developer',
      hourlyRate: 150,
    },
  });

  const contrib2 = calculator.addContribution('comp_1', 'founder_2', {
    type: 'cash',
    description: 'Initial investment',
    details: {
      amount: 10000,
    },
  });

  // Approve contributions
  calculator.approveContribution(contrib1.id, 'founder_2');
  calculator.approveContribution(contrib2.id, 'founder_1');

  // Calculate equity
  const equity = calculator.calculateEquity('comp_1');
  console.log('\nEquity Distribution:');
  console.log(JSON.stringify(equity, null, 2));

  // Get founder breakdown
  const breakdown = calculator.getFounderContributions('founder_1');
  console.log('\nFounder 1 Contributions:');
  console.log(JSON.stringify(breakdown, null, 2));

  // Model exit scenario
  const exitModel = calculator.modelExit('comp_1', 1000000);
  console.log('\nExit Scenario ($1M):');
  console.log(JSON.stringify(exitModel, null, 2));

  // Generate vesting schedule
  const vesting = calculator.generateVestingSchedule('founder_1');
  console.log('\nVesting Schedule (first 6 months):');
  console.log(JSON.stringify(vesting.schedule.slice(0, 7), null, 2));

  // Generate agreement
  const agreement = calculator.generateAgreement('comp_1');
  console.log('\nCo-Founder Agreement:');
  console.log(JSON.stringify(agreement, null, 2));
}
