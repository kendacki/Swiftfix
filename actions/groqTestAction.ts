"use server";

import groqClient from "@/lib/groq";

export async function generateGroqSampleReply(prompt: string): Promise<string> {
  const completion = await groqClient.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 1,
    max_completion_tokens: 512,
    top_p: 1,
    reasoning_effort: "medium",
    stream: false,
    stop: null,
  });

  return completion.choices[0]?.message?.content ?? "";
}

