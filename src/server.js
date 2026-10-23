const express = require('express');
const cors = require('cors');
const path = require('path');
const open = require('open');
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dashboard directory
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));

// In-memory data storage (replacing SQLite for simplicity)
let messages = [];
let users = [];
let settings = {};
let analytics = {};

function initializeDatabase() {
  return new Promise((resolve) => {
    console.log('Initializing in-memory database...');

    // Initialize demo data
    messages = [
      {
        id: 1,
        recipient_name: 'John Smith',
        recipient_email: 'john.smith@example.com',
        platform: 'StartHawk',
        subject: 'Co-founder Partnership Opportunity',
        content: 'Hi John, I came across your profile and was impressed by your background in software development...',
        status: 'sent',
        response_received: false,
        sent_at: new Date().toISOString()
      },
      {
        id: 2,
        recipient_name: 'Sarah Johnson',
        recipient_email: 'sarah.j@example.com',
        platform: 'CoFoundersLab',
        subject: 'Technical Co-founder Role',
        content: 'Hello Sarah, Your expertise in React and Node.js caught my attention...',
        status: 'sent',
        response_received: true,
        sent_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 3,
        recipient_name: 'Michael Brown',
        recipient_email: 'mbrown@example.com',
        platform: 'StartHawk',
        subject: 'Business Partnership Discussion',
        content: 'Hi Michael, I noticed your interest in fintech startups...',
        status: 'sent',
        response_received: false,
        sent_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 4,
        recipient_name: 'Emily Davis',
        recipient_email: 'emily.davis@example.com',
        platform: 'AngelList',
        subject: 'Co-founder Opportunity - AI Startup',
        content: 'Dear Emily, Your background in machine learning aligns perfectly...',
        status: 'sent',
        response_received: true,
        sent_at: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 5,
        recipient_name: 'David Wilson',
        recipient_email: 'david.w@example.com',
        platform: 'StartHawk',
        subject: 'Partnership Inquiry',
        content: 'Hello David, I saw your profile and wanted to reach out...',
        status: 'sent',
        response_received: false,
        sent_at: new Date(Date.now() - 345600000).toISOString()
      }
    ];

    console.log(`Initialized ${messages.length} demo messages`);
    resolve();
  });
}

function initializeDemoData() {
  console.log('Initializing demo data...');
  console.log('Generating demo data...');
  console.log(`Generated ${messages.length} demo messages`);
  console.log(`Initialized ${messages.length} demo messages`);
  return Promise.resolve();
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    // Calculate statistics from in-memory messages
    const totalSent = messages.length;
    const totalResponses = messages.filter(msg => msg.response_received).length;
    const responseRate = totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0;

    // Group by platform
    const platformStats = {};
    messages.forEach(msg => {
      if (!platformStats[msg.platform]) {
        platformStats[msg.platform] = { total_sent: 0, responses: 0 };
      }
      platformStats[msg.platform].total_sent++;
      if (msg.response_received) {
        platformStats[msg.platform].responses++;
      }
    });

    const platformPerformance = Object.keys(platformStats).map(platform => ({
      platform,
      sent: platformStats[platform].total_sent,
      responses: platformStats[platform].responses,
      rate: platformStats[platform].total_sent > 0 ?
        Math.round((platformStats[platform].responses / platformStats[platform].total_sent) * 100) : 0
    }));

    // Get recent messages (last 10)
    const recentMessages = messages
      .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
      .slice(0, 10)
      .map(msg => ({
        type: msg.response_received ? 'response' : 'message',
        platform: msg.platform,
        recipient: msg.recipient_name,
        time: new Date(msg.sent_at).toLocaleString(),
        status: msg.response_received ? 'received' : 'sent'
      }));

    const analytics = {
      messageStats: {
        sent: totalSent,
        responses: totalResponses,
        responseRate: responseRate,
        unresponsiveRate: 100 - responseRate
      },
      platformPerformance,
      timeSaved: {
        hours: Math.round(totalSent * 0.25 * 10) / 10, // Assume 15 minutes saved per message
        moneySaved: `$${Math.round(totalSent * 0.25 * 50)}.00` // Assume $50/hour rate
      },
      recentActivity: recentMessages,
      monthlyData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        sent: [12, 19, 23, 28, 35, totalSent],
        responses: [6, 9, 11, 14, 18, totalResponses]
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Messages endpoints
app.get('/api/messages/recent', (req, res) => {
  try {
    const recentMessages = messages
      .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
      .slice(0, 20);

    res.json(recentMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const { recipient_name, recipient_email, platform, subject, content } = req.body;

    if (!recipient_name || !recipient_email || !platform || !subject || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMessage = {
      id: messages.length + 1,
      recipient_name,
      recipient_email,
      platform,
      subject,
      content,
      status: 'sent',
      response_received: false,
      sent_at: new Date().toISOString()
    };

    messages.push(newMessage);

    res.json({
      id: newMessage.id,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  // Return mock settings for now
  res.json({
    account: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      hourlyRate: 50,
      timezone: 'UTC-5',
      twoFactorAuth: true
    },
    platforms: {
      starthawk: {
        enabled: true,
        accountType: 'paid',
        email: 'john.doe@example.com'
      },
      cofoundersLab: {
        enabled: true,
        accountType: 'paid',
        email: 'john.doe@example.com'
      }
    },
    messaging: {
      defaultTemplate: 'template1',
      followUpDays: 3,
      maxFollowUps: 2
    },
    notifications: {
      email: true,
      desktop: true,
      responses: true,
      followUps: true
    },
    appearance: {
      theme: 'dark',
      compactMode: false
    }
  });
});

app.post('/api/settings', (req, res) => {
  // For now, just return success
  res.json({
    message: 'Settings saved successfully'
  });
});

// Platform status endpoints
app.get('/api/platforms/status', (req, res) => {
  res.json({
    starthawk: {
      connected: true,
      lastSync: new Date().toISOString(),
      messageQuota: {
        daily: 50,
        used: 12,
        remaining: 38
      }
    },
    cofoundersLab: {
      connected: true,
      lastSync: new Date().toISOString(),
      messageQuota: {
        daily: 100,
        used: 24,
        remaining: 76
      }
    }
  });
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await initializeDemoData();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Co-Founders Outreach Backend Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
      open(`http://localhost:${PORT}/dashboard`)
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  console.log('Server shutdown complete');
  process.exit(0);
});

// Start the server
startServer();

