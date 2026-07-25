/**
 * Email Notification System
 * Sends email notifications for new matches and other events
 */

interface EmailNotification {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

/**
 * Send email notification
 * In production, this would integrate with SendGrid, AWS SES, or similar
 */
export async function sendEmail(
  notification: EmailNotification
): Promise<boolean> {
  // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
  // For now, log to console
  console.log("[EMAIL] Sending notification:", {
    to: notification.to,
    subject: notification.subject,
    preview: notification.textContent.substring(0, 100) + "...",
  });

  // Simulate email sending
  return true;
}

/**
 * Send new match notification email
 */
export async function sendNewMatchNotification(params: {
  userEmail: string;
  userName: string;
  prospectName: string;
  compatibilityScore: number;
  matchUrl: string;
}): Promise<boolean> {
  const { userEmail, userName, prospectName, compatibilityScore, matchUrl } =
    params;

  const subject = `New ${compatibilityScore}% Match: ${prospectName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #9333ea 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .match-score { font-size: 48px; font-weight: bold; color: #f97316; margin: 20px 0; }
        .cta-button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 New Co-Founder Match!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Great news! We found a highly compatible co-founder match for you:</p>
          
          <div style="text-align: center;">
            <h2>${prospectName}</h2>
            <div class="match-score">${compatibilityScore}%</div>
            <p style="color: #666;">Compatibility Score</p>
          </div>
          
          <p>This match aligns with your skills, vision, and work style preferences. Don't wait—the best co-founders get snatched up quickly!</p>
          
          <div style="text-align: center;">
            <a href="${matchUrl}" class="cta-button">View Match Details</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            💡 <strong>Pro tip:</strong> Use our AI-generated conversation starters to break the ice and make a great first impression.
          </p>
        </div>
        <div class="footer">
          <p>You're receiving this because you have match notifications enabled.</p>
          <p><a href="${matchUrl}/settings">Manage notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${userName},

Great news! We found a highly compatible co-founder match for you:

${prospectName}
${compatibilityScore}% Compatibility Score

This match aligns with your skills, vision, and work style preferences.

View match details: ${matchUrl}

Pro tip: Use our AI-generated conversation starters to break the ice and make a great first impression.

---
You're receiving this because you have match notifications enabled.
Manage notification preferences: ${matchUrl}/settings
  `.trim();

  return sendEmail({
    to: userEmail,
    subject,
    htmlContent,
    textContent,
  });
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail(params: {
  userEmail: string;
  userName: string;
  stats: {
    newMatches: number;
    messagesSent: number;
    responses: number;
    meetingsScheduled: number;
  };
  topMatches: Array<{
    name: string;
    score: number;
    url: string;
  }>;
}): Promise<boolean> {
  const { userEmail, userName, stats, topMatches } = params;

  const subject = `Your Weekly Co-Founder Discovery Summary`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #9333ea 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 6px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #f97316; }
        .stat-label { color: #666; font-size: 14px; }
        .match-item { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
        .cta-button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Weekly Summary</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Here's what happened this week in your co-founder search:</p>
          
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-number">${stats.newMatches}</div>
              <div class="stat-label">New Matches</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.messagesSent}</div>
              <div class="stat-label">Messages Sent</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.responses}</div>
              <div class="stat-label">Responses</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.meetingsScheduled}</div>
              <div class="stat-label">Meetings Scheduled</div>
            </div>
          </div>
          
          ${
            topMatches.length > 0
              ? `
            <h3 style="margin-top: 30px;">🔥 Top Matches This Week</h3>
            ${topMatches
              .map(
                match => `
              <div class="match-item">
                <div>
                  <strong>${match.name}</strong>
                  <div style="color: #666; font-size: 14px;">${match.score}% Match</div>
                </div>
                <a href="${match.url}" style="color: #f97316; text-decoration: none;">View →</a>
              </div>
            `
              )
              .join("")}
          `
              : ""
          }
          
          <div style="text-align: center;">
            <a href="https://your-platform.com/matches" class="cta-button">View All Matches</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hi ${userName},

Here's your weekly co-founder discovery summary:

📊 This Week's Stats:
- New Matches: ${stats.newMatches}
- Messages Sent: ${stats.messagesSent}
- Responses: ${stats.responses}
- Meetings Scheduled: ${stats.meetingsScheduled}

${
  topMatches.length > 0
    ? `
🔥 Top Matches This Week:
${topMatches.map(m => `- ${m.name} (${m.score}% match): ${m.url}`).join("\n")}
`
    : ""
}

View all matches: https://your-platform.com/matches
  `.trim();

  return sendEmail({
    to: userEmail,
    subject,
    htmlContent,
    textContent,
  });
}
