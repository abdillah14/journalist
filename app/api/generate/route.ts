import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getSerpApiKey() {
  return process.env.SERPAPI_API_KEY || "";
}

// ─── Searcher Agent ─────────────────────────────────────────────────────────

async function searcherAgent(topic: string): Promise<string[]> {
  // Step 1: Use GPT to generate search queries from the topic
  const openai = getOpenAIClient();
  const queryResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a research assistant. Given a topic, generate 3 concise and diverse web search queries that would help gather information for writing a news article. Return only the queries, one per line, no numbering.",
      },
      {
        role: "user",
        content: `Topic: ${topic}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 200,
  });

  const queriesText = queryResponse.choices[0]?.message?.content || topic;
  const queries = queriesText
    .split("\n")
    .map((q: string) => q.trim())
    .filter(Boolean)
    .slice(0, 3);

  // Step 2: Fetch search results from SerpAPI
  const allSnippets: string[] = [];

  for (const query of queries) {
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", getSerpApiKey());
      url.searchParams.set("num", "3");
      url.searchParams.set("engine", "google");

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });

      if (!res.ok) continue;

      const data = await res.json();
      const results = data.organic_results || [];

      for (const result of results.slice(0, 3)) {
        const snippet = [
          result.title || "",
          result.snippet || "",
          result.link ? `Source: ${result.link}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        if (snippet) allSnippets.push(snippet);
      }
    } catch {
      // Continue on individual query failure
      continue;
    }
  }

  if (allSnippets.length === 0) {
    allSnippets.push(
      `No search results were found. Write the article based on your general knowledge of: ${topic}`
    );
  }

  return allSnippets;
}

// ─── Writer Agent ───────────────────────────────────────────────────────────

async function writerAgent(
  topic: string,
  researchData: string[]
): Promise<string> {
  const researchContext = researchData.join("\n\n---\n\n");

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert journalist and article writer. Using the research data provided, write a well-structured, factual, and engaging news article.

Requirements:
- Write a compelling headline
- Include a strong lead paragraph
- Organize with clear sections
- Maintain a neutral, professional journalistic tone
- Use facts from the research data where available
- Aim for 600-900 words
- Do not fabricate quotes or statistics not present in the research`,
      },
      {
        role: "user",
        content: `Topic: ${topic}\n\nResearch Data:\n${researchContext}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "";
}

// ─── Editor Agent ───────────────────────────────────────────────────────────

async function editorAgent(draft: string): Promise<string> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a senior newspaper editor with decades of experience. Refine the following article draft to meet professional journalism standards.

Your editorial pass should:
- Improve clarity and readability
- Tighten prose and eliminate redundancy
- Ensure a consistent professional tone
- Fix any grammatical or structural issues
- Strengthen the headline and lead
- Ensure smooth paragraph transitions
- Maintain factual accuracy — do not add new information

Return only the final polished article, no commentary.`,
      },
      {
        role: "user",
        content: draft,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || draft;
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid topic is required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    // Step 1: Search
    const researchData = await searcherAgent(topic.trim());

    // Step 2: Write
    const draft = await writerAgent(topic.trim(), researchData);

    if (!draft) {
      return NextResponse.json(
        { error: "Failed to generate article draft." },
        { status: 500 }
      );
    }

    // Step 3: Edit
    const article = await editorAgent(draft);

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Agent orchestration error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
