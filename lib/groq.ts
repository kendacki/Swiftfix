import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY in environment variables");
}

export const groqClient = new Groq({
  apiKey,
});

export default groqClient;

