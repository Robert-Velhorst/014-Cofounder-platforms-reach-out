import { invokeLLM } from "./_core/llm";
import type { CompatibilityScore } from "./matching-engine";

/**
 * Smart AI-Powered Messaging Engine
 * Generates personalized outreach messages based on compatibility analysis
 */

export interface MessageContext {
  senderName: string;
  senderSkills: string[];
  senderIndustries: string[];
  senderStartupStage?: string;
  recipientName: string;
  recipientTitle?: string;
  recipientSkills: string[];
  recipientIndustries: string[];
  recipientBio?: string;
  compatibilityScore: CompatibilityScore;
}

export interface GeneratedMessage {
  subject: string;
  body: string;
  tone: "professional" | "casual" | "enthusiastic";
  personalizationScore: number;
}

/**
 * Generate personalized message (wrapper for compatibility)
 */
export async function generatePersonalizedMessage(context: {
  prospectName: string;
  userProfile: any;
  prospectProfile: any;
  compatibilityScore: number;
  messageType?: string;
  context?: string;
}): Promise<{ message: string }> {
  // Convert to MessageContext format
  const messageContext: MessageContext = {
    senderName: "User",
    senderSkills: context.userProfile.skills || [],
    senderIndustries: context.userProfile.industries || [],
    senderStartupStage: context.userProfile.startupStage,
    recipientName: context.prospectName,
    recipientSkills: context.prospectProfile.skills || [],
    recipientIndustries: context.prospectProfile.industries || [],
    recipientBio: context.prospectProfile.bio,
    compatibilityScore: {
      overall: context.compatibilityScore,
      breakdown: {
        skills: 0,
        industries: 0,
        goals: 0,
        workStyle: 0,
        location: 0,
        experience: 0,
        commitment: 0,
      },
      highlights: [],
      concerns: [],
    },
  };

  const result = await generateOutreachMessage(messageContext);
  return { message: result.body };
}

/**
 * Generate personalized outreach message using AI
 */
export async function generateOutreachMessage(
  context: MessageContext
): Promise<GeneratedMessage> {
  const highlights = context.compatibilityScore.highlights.join(", ");
  const skillsMatch = context.compatibilityScore.breakdown.skills;
  const industryMatch = context.compatibilityScore.breakdown.industries;

  const prompt = `You are a co-founder matchmaking expert. Generate a personalized outreach message for a potential co-founder match.

Context:
- Sender: ${context.senderName}
- Sender Skills: ${context.senderSkills.join(", ")}
- Sender Industries: ${context.senderIndustries.join(", ")}
- Sender Startup Stage: ${context.senderStartupStage || "Not specified"}

- Recipient: ${context.recipientName}
- Recipient Title: ${context.recipientTitle || "Not specified"}
- Recipient Skills: ${context.recipientSkills.join(", ")}
- Recipient Industries: ${context.recipientIndustries.join(", ")}
- Recipient Bio: ${context.recipientBio || "Not available"}

Compatibility Analysis:
- Overall Score: ${context.compatibilityScore.overall}%
- Skills Compatibility: ${skillsMatch}%
- Industry Alignment: ${industryMatch}%
- Highlights: ${highlights || "General compatibility"}

Instructions:
1. Write a warm, professional message (150-200 words)
2. Reference specific skills or experiences that complement each other
3. Mention shared industry interests
4. Express genuine interest in collaboration
5. Include a clear call-to-action (e.g., "Would you be open to a quick call?")
6. Keep it authentic and not overly salesy
7. Use the recipient's name naturally

Return ONLY a JSON object with this structure:
{
  "subject": "Brief, engaging subject line (5-8 words)",
  "body": "The personalized message body",
  "tone": "professional" | "casual" | "enthusiastic"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at writing personalized, authentic outreach messages for co-founder matching. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format");
    }
    const parsed = JSON.parse(content);

    return {
      subject: parsed.subject,
      body: parsed.body,
      tone: parsed.tone || "professional",
      personalizationScore: calculatePersonalizationScore(parsed.body, context),
    };
  } catch (error) {
    console.error("Failed to generate AI message:", error);

    // Fallback to template-based message
    return generateTemplateMessage(context);
  }
}

/**
 * Calculate how personalized a message is
 */
function calculatePersonalizationScore(
  message: string,
  context: MessageContext
): number {
  let score = 0;
  const lowerMessage = message.toLowerCase();

  // Check for recipient name
  if (lowerMessage.includes(context.recipientName.toLowerCase())) {
    score += 20;
  }

  // Check for specific skills mentioned
  const mentionedSkills = context.recipientSkills.filter(skill =>
    lowerMessage.includes(skill.toLowerCase())
  );
  score += Math.min(30, mentionedSkills.length * 10);

  // Check for industries mentioned
  const mentionedIndustries = context.recipientIndustries.filter(industry =>
    lowerMessage.includes(industry.toLowerCase())
  );
  score += Math.min(20, mentionedIndustries.length * 10);

  // Check for compatibility highlights
  const mentionedHighlights = context.compatibilityScore.highlights.filter(
    highlight => lowerMessage.includes(highlight.toLowerCase().slice(0, 10))
  );
  score += Math.min(20, mentionedHighlights.length * 10);

  // Check for call-to-action
  const ctaKeywords = ["call", "chat", "discuss", "connect", "meet", "talk"];
  if (ctaKeywords.some(keyword => lowerMessage.includes(keyword))) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Fallback template-based message generation
 */
function generateTemplateMessage(context: MessageContext): GeneratedMessage {
  const topSkill = context.recipientSkills[0] || "your expertise";
  const topIndustry = context.recipientIndustries[0] || "the startup space";

  const subject = `Potential Co-Founder Match - ${context.senderSkills[0]} + ${topSkill}`;

  const body = `Hi ${context.recipientName},

I came across your profile and was impressed by your background in ${topSkill} and ${topIndustry}. I'm ${context.senderName}, and I'm ${context.senderSkills.join(" and ")} working in ${context.senderIndustries.join(" and ")}.

I believe our skills could complement each other well. ${context.compatibilityScore.highlights[0] || "We share similar interests in building innovative solutions"}, and I think there could be great potential for collaboration.

${context.senderStartupStage ? `I'm currently at the ${context.senderStartupStage} stage and looking for a co-founder who can help take things to the next level.` : "I'm exploring co-founder partnerships for my next venture."}

Would you be open to a quick call to explore potential synergies?

Best regards,
${context.senderName}`;

  return {
    subject,
    body,
    tone: "professional",
    personalizationScore: 60,
  };
}

/**
 * Generate follow-up message
 */
export async function generateFollowUpMessage(
  context: MessageContext,
  previousMessage: string,
  daysSinceLastMessage: number
): Promise<GeneratedMessage> {
  const prompt = `Generate a friendly follow-up message for a co-founder outreach.

Context:
- Original message was sent ${daysSinceLastMessage} days ago
- Recipient: ${context.recipientName}
- Previous message: "${previousMessage.slice(0, 200)}..."

Instructions:
1. Keep it brief (50-75 words)
2. Reference the original message
3. Add value (e.g., share a relevant article, insight, or update)
4. Be respectful of their time
5. Include a soft call-to-action

Return JSON with "subject" and "body" fields.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at writing non-pushy, value-adding follow-up messages.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format");
    }
    const parsed = JSON.parse(content);

    return {
      subject: parsed.subject,
      body: parsed.body,
      tone: "casual",
      personalizationScore: 70,
    };
  } catch (error) {
    return {
      subject: `Following up - ${context.senderName}`,
      body: `Hi ${context.recipientName},\n\nI wanted to follow up on my previous message about potential collaboration. I understand you're busy, but I'd love to connect if you're interested.\n\nNo pressure - just let me know if you'd like to chat!\n\nBest,\n${context.senderName}`,
      tone: "casual",
      personalizationScore: 50,
    };
  }
}

/**
 * Analyze message effectiveness
 */
export interface MessageAnalytics {
  readability: number;
  sentiment: "positive" | "neutral" | "negative";
  callToActionPresent: boolean;
  estimatedResponseRate: number;
}

export function analyzeMessage(message: string): MessageAnalytics {
  const lowerMessage = message.toLowerCase();

  // Simple readability score (based on sentence length and word complexity)
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = message.split(/\s+/).length / sentences.length;
  const readability = Math.max(
    0,
    Math.min(100, 100 - (avgSentenceLength - 15) * 2)
  );

  // Sentiment analysis (basic keyword matching)
  const positiveWords = [
    "excited",
    "great",
    "love",
    "perfect",
    "excellent",
    "amazing",
  ];
  const negativeWords = ["unfortunately", "sorry", "difficult", "problem"];

  const positiveCount = positiveWords.filter(w =>
    lowerMessage.includes(w)
  ).length;
  const negativeCount = negativeWords.filter(w =>
    lowerMessage.includes(w)
  ).length;

  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  if (positiveCount > negativeCount) sentiment = "positive";
  if (negativeCount > positiveCount) sentiment = "negative";

  // Check for call-to-action
  const ctaKeywords = [
    "call",
    "chat",
    "discuss",
    "connect",
    "meet",
    "talk",
    "schedule",
  ];
  const callToActionPresent = ctaKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  // Estimate response rate based on factors
  let estimatedResponseRate = 30; // Base rate
  if (readability > 70) estimatedResponseRate += 10;
  if (sentiment === "positive") estimatedResponseRate += 15;
  if (callToActionPresent) estimatedResponseRate += 10;
  if (message.length > 100 && message.length < 300) estimatedResponseRate += 10;

  return {
    readability: Math.round(readability),
    sentiment,
    callToActionPresent,
    estimatedResponseRate: Math.min(85, estimatedResponseRate),
  };
}

/**
 * A/B test message variants
 */
export async function generateMessageVariants(
  context: MessageContext,
  variantCount: number = 2
): Promise<GeneratedMessage[]> {
  const variants: GeneratedMessage[] = [];

  for (let i = 0; i < variantCount; i++) {
    const message = await generateOutreachMessage(context);
    variants.push(message);

    // Add small delay to get different results
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return variants;
}
