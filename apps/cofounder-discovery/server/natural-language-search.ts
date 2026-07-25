import { invokeLLM } from "./_core/llm";

/**
 * Parse natural language query into structured search criteria
 * Example: "Find technical co-founders in San Francisco with ML experience"
 * Returns: { skills: ["Machine Learning"], location: "San Francisco", ... }
 */
export async function parseNaturalLanguageQuery(query: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a search query parser for a co-founder matching platform. 
Extract structured criteria from natural language queries.
Return JSON with these fields (all optional):
- skills: string[] - technical or business skills mentioned
- industries: string[] - industries or sectors mentioned
- location: string - city, state, or country
- experienceLevel: "junior" | "mid" | "senior" | "executive"
- commitment: "full-time" | "part-time" | "flexible"
- fundingStage: "idea" | "mvp" | "launched" | "funded"
- lookingFor: string - what they're looking for in a co-founder

Examples:
"technical co-founder in SF with ML experience" → {"skills":["Machine Learning"],"location":"San Francisco"}
"business co-founder for fintech startup" → {"industries":["FinTech"],"lookingFor":"business co-founder"}
"senior engineer who wants to build SaaS" → {"experienceLevel":"senior","industries":["SaaS"]}`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "search_criteria",
        strict: true,
        schema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: { type: "string" },
              description: "Technical or business skills",
            },
            industries: {
              type: "array",
              items: { type: "string" },
              description: "Industries or sectors",
            },
            location: {
              type: "string",
              description: "Geographic location",
            },
            experienceLevel: {
              type: "string",
              enum: ["junior", "mid", "senior", "executive"],
              description: "Experience level",
            },
            commitment: {
              type: "string",
              enum: ["full-time", "part-time", "flexible"],
              description: "Time commitment",
            },
            fundingStage: {
              type: "string",
              enum: ["idea", "mvp", "launched", "funded"],
              description: "Startup stage",
            },
            lookingFor: {
              type: "string",
              description: "What they're looking for",
            },
          },
          required: [],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== "string") {
    throw new Error("Expected string content from LLM");
  }

  return JSON.parse(content);
}

/**
 * Generate search suggestions based on partial query
 */
export async function generateSearchSuggestions(partialQuery: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a search suggestion generator for a co-founder matching platform.
Given a partial query, suggest 3-5 complete search queries that the user might be looking for.
Focus on common co-founder search patterns.

Examples:
"technical" → ["technical co-founder in San Francisco", "technical co-founder with AI experience", "technical co-founder for SaaS startup"]
"business" → ["business co-founder with sales experience", "business co-founder for fintech", "business co-founder in New York"]`,
      },
      {
        role: "user",
        content: partialQuery,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "search_suggestions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: { type: "string" },
              description: "List of suggested complete queries",
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== "string") {
    throw new Error("Expected string content from LLM");
  }

  return JSON.parse(content);
}
