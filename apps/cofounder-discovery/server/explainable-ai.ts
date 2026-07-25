/**
 * Explainable AI Module
 * Generates natural language explanations for match scores
 */

import { invokeLLM } from "./_core/llm";
import type { CompatibilityScore } from "./matching-engine";
import { calculateSemanticSkillScore } from "./semantic-matching";

export interface MatchExplanation {
  summary: string;
  strengths: string[];
  considerations: string[];
  whyBetterThanOthers?: string;
  confidence: "high" | "medium" | "low";
}

export interface ExplanationContext {
  // User info
  userName: string;
  userSkills: string[];
  userIndustries: string[];
  userExperience: string;
  userLookingFor: string[];
  userLocation: string;

  // Prospect info
  prospectName: string;
  prospectSkills: string[];
  prospectIndustries: string[];
  prospectExperience: string;
  prospectLocation: string;
  prospectBio?: string;
  prospectCurrentCompany?: string;

  // Enrichment data
  linkedinData?: {
    headline?: string;
    currentPosition?: { title: string; company: string };
    topSkills?: string[];
  };

  githubData?: {
    bio?: string;
    topLanguages?: string[];
    notableProjects?: string[];
  };

  // Match score
  compatibilityScore: CompatibilityScore;

  // Comparative context (optional)
  averageScore?: number;
  topPercentile?: number;
}

/**
 * Generate natural language explanation for a match
 */
export async function generateMatchExplanation(
  context: ExplanationContext
): Promise<MatchExplanation> {
  // Analyze semantic skill matches
  const semanticAnalysis = calculateSemanticSkillScore(
    context.userSkills,
    context.prospectSkills
  );

  // Build prompt for LLM
  const prompt = buildExplanationPrompt(context, semanticAnalysis);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at explaining co-founder compatibility in clear, specific language.
Your explanations should:
- Be concise and actionable (2-3 sentences for summary)
- Reference specific skills, experiences, or projects
- Highlight genuine complementarity and shared vision
- Avoid generic statements
- Be encouraging but honest about potential challenges`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "match_explanation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description:
                  "One paragraph explaining why this is a good match",
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "3-5 specific strengths of this partnership",
              },
              considerations: {
                type: "array",
                items: { type: "string" },
                description: "1-3 things to discuss or clarify",
              },
              whyBetterThanOthers: {
                type: "string",
                description: "Why this match stands out compared to average",
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Confidence level in this match",
              },
            },
            required: ["summary", "strengths", "considerations", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr || "{}");

    return {
      summary:
        result.summary ||
        "This match shows strong potential for collaboration.",
      strengths: result.strengths || [],
      considerations: result.considerations || [],
      whyBetterThanOthers: result.whyBetterThanOthers,
      confidence: result.confidence || "medium",
    };
  } catch (error) {
    console.error("Failed to generate match explanation:", error);

    // Fallback to rule-based explanation
    return generateRuleBasedExplanation(context, semanticAnalysis);
  }
}

/**
 * Build prompt for LLM explanation
 */
function buildExplanationPrompt(
  context: ExplanationContext,
  semanticAnalysis: ReturnType<typeof calculateSemanticSkillScore>
): string {
  const { compatibilityScore } = context;

  let prompt = `Generate an explanation for why ${context.userName} and ${context.prospectName} are a ${compatibilityScore.overall}% match as potential co-founders.\n\n`;

  prompt += `## ${context.userName}'s Profile\n`;
  prompt += `- Skills: ${context.userSkills.join(", ")}\n`;
  prompt += `- Industries: ${context.userIndustries.join(", ")}\n`;
  prompt += `- Experience: ${context.userExperience}\n`;
  prompt += `- Looking for: ${context.userLookingFor.join(", ")}\n`;
  prompt += `- Location: ${context.userLocation}\n\n`;

  prompt += `## ${context.prospectName}'s Profile\n`;
  prompt += `- Skills: ${context.prospectSkills.join(", ")}\n`;
  prompt += `- Industries: ${context.prospectIndustries.join(", ")}\n`;
  prompt += `- Experience: ${context.prospectExperience}\n`;
  prompt += `- Location: ${context.prospectLocation}\n`;

  if (context.prospectBio) {
    prompt += `- Bio: ${context.prospectBio}\n`;
  }

  if (context.linkedinData?.currentPosition) {
    prompt += `- Current role: ${context.linkedinData.currentPosition.title} at ${context.linkedinData.currentPosition.company}\n`;
  }

  if (context.githubData?.notableProjects?.length) {
    prompt += `- Notable projects: ${context.githubData.notableProjects.join(", ")}\n`;
  }

  prompt += `\n## Compatibility Breakdown\n`;
  prompt += `- Overall Score: ${compatibilityScore.overall}%\n`;
  prompt += `- Skills: ${compatibilityScore.breakdown.skills}%\n`;
  prompt += `- Industries: ${compatibilityScore.breakdown.industries}%\n`;
  prompt += `- Experience: ${compatibilityScore.breakdown.experience}%\n`;
  prompt += `- Goals: ${compatibilityScore.breakdown.goals}%\n`;
  prompt += `- Location: ${compatibilityScore.breakdown.location}%\n\n`;

  prompt += `## Skill Analysis\n`;
  if (semanticAnalysis.exactMatches.length > 0) {
    prompt += `- Exact skill matches: ${semanticAnalysis.exactMatches.join(", ")}\n`;
  }
  if (semanticAnalysis.semanticMatches.length > 0) {
    prompt += `- Similar skills: ${semanticAnalysis.semanticMatches.map(m => `${m.userSkill} ↔ ${m.prospectSkill}`).join(", ")}\n`;
  }
  if (semanticAnalysis.complementarySkills.length > 0) {
    prompt += `- Complementary skills ${context.prospectName} brings: ${semanticAnalysis.complementarySkills.join(", ")}\n`;
  }

  if (context.averageScore) {
    prompt += `\n## Context\n`;
    prompt += `- Average match score: ${context.averageScore}%\n`;
    if (context.topPercentile) {
      prompt += `- This match is in the top ${context.topPercentile}% of all matches\n`;
    }
  }

  prompt += `\nGenerate a clear, specific explanation that helps ${context.userName} understand why this partnership could work and what to discuss first.`;

  return prompt;
}

/**
 * Generate rule-based explanation as fallback
 */
function generateRuleBasedExplanation(
  context: ExplanationContext,
  semanticAnalysis: ReturnType<typeof calculateSemanticSkillScore>
): MatchExplanation {
  const { compatibilityScore } = context;
  const strengths: string[] = [];
  const considerations: string[] = [];

  // Analyze strengths
  if (compatibilityScore.breakdown.skills >= 75) {
    if (semanticAnalysis.complementarySkills.length > 0) {
      strengths.push(
        `Strong skill complementarity: ${context.prospectName} brings ${semanticAnalysis.complementarySkills.slice(0, 3).join(", ")}`
      );
    }
  }

  if (compatibilityScore.breakdown.industries >= 80) {
    const sharedIndustries = context.userIndustries.filter(i =>
      context.prospectIndustries.some(
        pi => pi.toLowerCase() === i.toLowerCase()
      )
    );
    if (sharedIndustries.length > 0) {
      strengths.push(
        `Aligned industry focus in ${sharedIndustries.join(" and ")}`
      );
    }
  }

  if (compatibilityScore.breakdown.goals >= 75) {
    strengths.push(`Matching partnership goals and startup vision`);
  }

  if (compatibilityScore.breakdown.location >= 80) {
    if (
      context.userLocation.toLowerCase() ===
      context.prospectLocation.toLowerCase()
    ) {
      strengths.push(
        `Both based in ${context.userLocation} for easy in-person collaboration`
      );
    }
  }

  // Analyze considerations
  if (compatibilityScore.breakdown.experience < 60) {
    considerations.push(
      `Different experience levels - discuss how to leverage this diversity`
    );
  }

  if (compatibilityScore.breakdown.location < 50) {
    considerations.push(
      `Different locations - clarify remote work expectations`
    );
  }

  if (
    semanticAnalysis.exactMatches.length >
    semanticAnalysis.complementarySkills.length
  ) {
    considerations.push(
      `Significant skill overlap - ensure clear role differentiation`
    );
  }

  // Generate summary
  const summary = `You're a ${compatibilityScore.overall}% match with ${context.prospectName}. ${
    strengths.length > 0
      ? `Key strengths include ${strengths[0].toLowerCase()}.`
      : "This partnership shows potential across multiple dimensions."
  } ${
    context.linkedinData?.currentPosition
      ? `They're currently ${context.linkedinData.currentPosition.title} at ${context.linkedinData.currentPosition.company}.`
      : ""
  }`;

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "medium";
  if (compatibilityScore.overall >= 85) confidence = "high";
  if (compatibilityScore.overall < 60) confidence = "low";

  // Comparative reasoning
  let whyBetterThanOthers: string | undefined;
  if (
    context.averageScore &&
    compatibilityScore.overall > context.averageScore + 15
  ) {
    whyBetterThanOthers = `This match scores ${Math.round(compatibilityScore.overall - context.averageScore)}% higher than your average match, particularly strong in ${Object.entries(
      compatibilityScore.breakdown
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => key)
      .join(" and ")}.`;
  }

  return {
    summary,
    strengths:
      strengths.length > 0
        ? strengths
        : ["Potential for collaboration across shared interests"],
    considerations:
      considerations.length > 0
        ? considerations
        : ["Discuss partnership expectations and roles"],
    whyBetterThanOthers,
    confidence,
  };
}
