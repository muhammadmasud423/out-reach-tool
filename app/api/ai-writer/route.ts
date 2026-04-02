import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const { apiKey, tone, length, industry, goal, context } = await request.json();

  if (!apiKey) {
    return new Response("ERROR:No API key. Add your Anthropic API key in Settings → AI.", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const lengthGuide: Record<string, string> = {
    "Ultra-short (1-2 lines)": "extremely brief — 1 to 2 lines only",
    "Short (3-5 lines)": "short — 3 to 5 lines",
    "Medium (5-8 lines)": "medium length — 5 to 8 lines",
    "Long (8-12 lines)": "longer — 8 to 12 lines",
  };

  const prompt = `You are a world-class cold email copywriter. Generate exactly 2 high-converting cold email variants.

WHAT'S BEING SOLD:
${context?.trim() || "A B2B product or service (user didn't provide details — infer a reasonable example)"}

REQUIREMENTS:
- Tone: ${tone}
- Target industry: ${industry}
- Primary goal: ${goal}
- Length: ${lengthGuide[length] || "5-8 lines"}

Use merge tags like {first_name}, {company}, {role}, {your_name} naturally where they add personalization.
Each variant must have a distinct angle, hook, or framing — not just rephrased versions of each other.
No pleasantries, no "I hope this finds you well", no obvious templates. Write like a sharp human.

Return ONLY valid JSON — no markdown, no explanation, no code blocks. Exactly this structure:
{
  "variants": [
    {
      "subject": "Subject line for variant 1",
      "body": "Full email body for variant 1\\nWith real line breaks as \\\\n"
    },
    {
      "subject": "Subject line for variant 2",
      "body": "Full email body for variant 2\\nWith real line breaks as \\\\n"
    }
  ]
}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 1800,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\nERROR:${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
