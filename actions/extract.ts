"use server";
import { Groq } from 'groq-sdk';

// Initialize Groq outside the function
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function extractRequestDetails(promptText: string) {
  console.log("🟢 [STEP 1] Starting extraction for prompt:", promptText);
  
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing from environment variables.");
    }

    console.log("🟢 [STEP 2] Calling Groq API (openai/gpt-oss-120b)...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a data extractor. Extract the Trade, Location, and Urgency from the user's prompt. Return ONLY valid JSON. Do not use markdown formatting."
        },
        { role: "user", content: promptText }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0, // 0 is required for strict JSON data extraction
      stream: false,
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content || "";
    console.log("🟢 [STEP 3] Raw Groq Response:", rawResponse);

    // FAILSAFE: AI models often wrap JSON in ```json ... ``` markdown. We must strip this before parsing.
    const cleanedResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    console.log("🟢 [STEP 4] Cleaned Response (Ready for Tinyfish):", cleanedResponse);

    // TODO: Pass cleanedResponse to your tinyfish parser here
    // Example: const parsedData = tinyfish.parse(cleanedResponse);
    
    // For now, we will do a standard JSON parse to test the pipeline
    const parsedData = JSON.parse(cleanedResponse);
    console.log("🟢 [STEP 5] Successfully Parsed Data:", parsedData);

    return { success: true, data: parsedData };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("🚨 [EXTRACTION FATAL ERROR]:", message);
    return { success: false, error: "Analysis failed. Please try again." };
  }
}

