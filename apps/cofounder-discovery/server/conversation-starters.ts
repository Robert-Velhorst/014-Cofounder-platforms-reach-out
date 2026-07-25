/**
 * AI Conversation Starter Generator
 * Generates personalized ice-breaker messages using enriched LinkedIn/GitHub data
 */

import { invokeLLM } from "./_core/llm";

export interface ConversationStarterContext {
  prospectId?: number;
  enrichmentScore?: number;
  // User info
  userName: string;
  userSkills: string[];
  userIndustries: string[];
  userExperience?: string;
  userLookingFor: string[];
  userBio?: string;

  // Prospect info
  prospectName: string;
  prospectSkills: string[];
  prospectIndustries: string[];
  prospectExperience?: string;
  prospectBio?: string;
  prospectCurrentCompany?: string;

  // Enrichment data
  linkedinData?: {
    headline?: string;
    positions?: Array<{
      title: string;
      company: string;
    }>;
    skills?: Array<{
      name: string;
      endorsements?: number;
    }>;
  };

  githubData?: {
    bio?: string;
    topLanguages?: string[];
    repositories?: Array<{
      name: string;
      description?: string;
      language?: string;
      stars: number;
    }>;
  };

  // Compatibility info
  compatibilityScore?: number;
  sharedSkills: string[];
  complementarySkills: string[];
  sharedIndustries: string[];
}

export interface ConversationStarter {
  message: string;
  tone: "professional" | "friendly" | "enthusiastic";
  focusArea:
    | "skills"
    | "industry"
    | "project"
    | "experience"
    | "shared_interest";
  reasoning: string;
}

/**
 * Generate AI-powered conversation starters
 */
export async function generateConversationStarters(
  context: ConversationStarterContext,
  saveHistory = false,
  userId?: number
): Promise<ConversationStarter[]> {
  // Build context for LLM
  const prompt = buildConversationStarterPrompt(context);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at crafting personalized, engaging conversation starters for potential co-founders. 
Your goal is to create authentic, specific ice-breakers that reference real details from their profiles and highlight genuine connection points.
Avoid generic messages. Focus on shared interests, complementary skills, or interesting projects.
Keep messages concise (2-3 sentences max) and natural.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "conversation_starters",
          strict: true,
          schema: {
            type: "object",
            properties: {
              starters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      description: "The conversation starter message",
                    },
                    tone: {
                      type: "string",
                      enum: ["professional", "friendly", "enthusiastic"],
                      description: "The tone of the message",
                    },
                    focusArea: {
                      type: "string",
                      enum: [
                        "skills",
                        "industry",
                        "project",
                        "experience",
                        "shared_interest",
                      ],
                      description: "What the message focuses on",
                    },
                    reasoning: {
                      type: "string",
                      description: "Why this starter would work well",
                    },
                  },
                  required: ["message", "tone", "focusArea", "reasoning"],
                  additionalProperties: false,
                },
                minItems: 3,
                maxItems: 5,
              },
            },
            required: ["starters"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("No response from LLM, using fallback starters");
      return generateFallbackStarters(context);
    }

    // Ensure content is a string
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    try {
      const parsed = JSON.parse(contentStr);
      return parsed.starters || generateFallbackStarters(context);
    } catch (parseError) {
      console.warn("Failed to parse LLM response, using fallback starters");
      return generateFallbackStarters(context);
    }
  } catch (error) {
    console.error("Failed to generate conversation starters:", error);

    // Fallback to template-based starters
    const starters = generateFallbackStarters(context);

    // Save to history if requested
    if (saveHistory && userId) {
      const { saveConversationStarter } = await import("./db");
      for (const starter of starters) {
        await saveConversationStarter({
          userId,
          prospectId: context.prospectId || 0,
          message: starter.message,
          tone: starter.tone,
          focusArea: starter.focusArea,
          reasoning: starter.reasoning,
          compatibilityScore: context.compatibilityScore,
          enrichmentScore: context.enrichmentScore,
        });
      }
    }

    return starters;
  }
}

/**
 * Build prompt for LLM
 */
function buildConversationStarterPrompt(
  context: ConversationStarterContext
): string {
  let prompt = `Generate 3-5 personalized conversation starters for ${context.userName} to reach out to ${context.prospectName}.\n\n`;

  prompt += `**About ${context.userName}:**\n`;
  prompt += `- Skills: ${context.userSkills.join(", ")}\n`;
  prompt += `- Industries: ${context.userIndustries.join(", ")}\n`;
  if (context.userExperience) {
    prompt += `- Experience Level: ${context.userExperience}\n`;
  }
  prompt += `- Looking For: ${context.userLookingFor.join(", ")}\n`;
  if (context.userBio) {
    prompt += `- Bio: ${context.userBio}\n`;
  }

  prompt += `\n**About ${context.prospectName}:**\n`;
  prompt += `- Skills: ${context.prospectSkills.join(", ")}\n`;
  prompt += `- Industries: ${context.prospectIndustries.join(", ")}\n`;
  if (context.prospectExperience) {
    prompt += `- Experience Level: ${context.prospectExperience}\n`;
  }
  if (context.prospectBio) {
    prompt += `- Bio: ${context.prospectBio}\n`;
  }
  if (context.prospectCurrentCompany) {
    prompt += `- Current Company: ${context.prospectCurrentCompany}\n`;
  }

  // Add LinkedIn enrichment data
  if (context.linkedinData) {
    prompt += `\n**LinkedIn Profile:**\n`;
    if (context.linkedinData.headline) {
      prompt += `- Headline: ${context.linkedinData.headline}\n`;
    }
    if (
      context.linkedinData.positions &&
      context.linkedinData.positions.length > 0
    ) {
      const currentPosition = context.linkedinData.positions[0];
      prompt += `- Current Role: ${currentPosition.title} at ${currentPosition.company}\n`;
    }
    if (context.linkedinData.skills && context.linkedinData.skills.length > 0) {
      const topSkills = context.linkedinData.skills
        .slice(0, 5)
        .map(s => s.name)
        .join(", ");
      prompt += `- Top Skills: ${topSkills}\n`;
    }
  }

  // Add GitHub enrichment data
  if (context.githubData) {
    prompt += `\n**GitHub Profile:**\n`;
    if (
      context.githubData.topLanguages &&
      context.githubData.topLanguages.length > 0
    ) {
      prompt += `- Programming Languages: ${context.githubData.topLanguages.join(", ")}\n`;
    }
    if (
      context.githubData.repositories &&
      context.githubData.repositories.length > 0
    ) {
      const topRepo = context.githubData.repositories[0];
      if (topRepo.stars > 10) {
        prompt += `- Notable Project: "${topRepo.name}" (${topRepo.stars} stars)`;
        if (topRepo.description) {
          prompt += ` - ${topRepo.description}`;
        }
        prompt += `\n`;
      }
    }
  }

  // Add compatibility insights
  prompt += `\n**Compatibility Insights:**\n`;
  prompt += `- Overall Compatibility: ${context.compatibilityScore}%\n`;
  if (context.sharedSkills.length > 0) {
    prompt += `- Shared Skills: ${context.sharedSkills.join(", ")}\n`;
  }
  if (context.complementarySkills.length > 0) {
    prompt += `- Complementary Skills: ${context.complementarySkills.join(", ")}\n`;
  }
  if (context.sharedIndustries.length > 0) {
    prompt += `- Shared Industries: ${context.sharedIndustries.join(", ")}\n`;
  }

  prompt += `\n**Requirements:**\n`;
  prompt += `- Reference specific details from their profile (projects, skills, companies, etc.)\n`;
  prompt += `- Highlight genuine connection points or complementary strengths\n`;
  prompt += `- Keep it concise (2-3 sentences)\n`;
  prompt += `- Make it feel personal and authentic, not templated\n`;
  prompt += `- Vary the tone and focus area across the starters\n`;
  prompt += `- Don't use emojis\n`;

  return prompt;
}

/**
 * Generate fallback starters using templates
 */
function generateFallbackStarters(
  context: ConversationStarterContext
): ConversationStarter[] {
  const starters: ConversationStarter[] = [];

  // Starter 1: Shared skills
  if (context.sharedSkills.length > 0) {
    const skills = context.sharedSkills.slice(0, 2).join(" and ");
    starters.push({
      message: `Hi ${context.prospectName}, I noticed we both have experience with ${skills}. I'm ${context.userName}, and I'm looking for a co-founder to build something in the ${context.userIndustries[0] || "tech"} space. Would love to chat about potential collaboration.`,
      tone: "professional",
      focusArea: "skills",
      reasoning: "Highlights shared technical skills as a connection point",
    });
  }

  // Starter 2: Complementary skills
  if (context.complementarySkills.length > 0) {
    const compSkills = context.complementarySkills.slice(0, 2).join(" and ");
    starters.push({
      message: `Hey ${context.prospectName}, your background in ${compSkills} caught my eye. I'm working on ${context.userLookingFor[0] || "a new venture"} and think our skills could complement each other well. Interested in exploring this?`,
      tone: "friendly",
      focusArea: "skills",
      reasoning: "Emphasizes how skills complement each other",
    });
  }

  // Starter 3: Industry alignment
  if (context.sharedIndustries.length > 0) {
    starters.push({
      message: `Hi ${context.prospectName}, I see you're passionate about ${context.sharedIndustries[0]}. I'm ${context.userName}, and I'm building in this space too. Would be great to connect and share ideas about the industry.`,
      tone: "professional",
      focusArea: "industry",
      reasoning: "Connects through shared industry interest",
    });
  }

  // Starter 4: Company/Experience
  if (context.prospectCurrentCompany) {
    starters.push({
      message: `Hey ${context.prospectName}, your experience at ${context.prospectCurrentCompany} is impressive. I'm looking for someone with your background to join me in building ${context.userIndustries[0] || "a new venture"}. Open to a conversation?`,
      tone: "enthusiastic",
      focusArea: "experience",
      reasoning: "Acknowledges their professional experience",
    });
  }

  // Starter 5: GitHub project (if available)
  if (
    context.githubData?.repositories &&
    context.githubData.repositories.length > 0
  ) {
    const topRepo = context.githubData.repositories[0];
    starters.push({
      message: `Hi ${context.prospectName}, I came across your "${topRepo.name}" project on GitHub. Really interesting work! I'm ${context.userName}, working on something in ${context.userIndustries[0] || "tech"}. Would love to discuss potential synergies.`,
      tone: "enthusiastic",
      focusArea: "project",
      reasoning: "Shows genuine interest in their work",
    });
  }

  // Ensure we have at least 3 starters
  while (starters.length < 3) {
    starters.push({
      message: `Hi ${context.prospectName}, I'm ${context.userName}. I noticed your profile and think we might have some interesting synergies. I'm working on ${context.userLookingFor[0] || "finding a co-founder"} in the ${context.userIndustries[0] || "tech"} space. Would you be open to a quick chat?`,
      tone: "professional",
      focusArea: "shared_interest",
      reasoning: "General introduction highlighting potential collaboration",
    });
  }

  return starters.slice(0, 5);
}

/**
 * Regenerate conversation starters with different focus
 */
export async function regenerateConversationStarters(
  context: ConversationStarterContext,
  previousStarters: ConversationStarter[]
): Promise<ConversationStarter[]> {
  const usedFocusAreas = previousStarters.map(s => s.focusArea);

  // Add instruction to avoid previous focus areas
  const enhancedContext = {
    ...context,
    avoidFocusAreas: usedFocusAreas,
  };

  return generateConversationStarters(enhancedContext);
}
