import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = "AIzaSyDKD-ca9QFpkmajrHnFj8rQjXfPLQIVt78";

const genAI = new GoogleGenerativeAI(API_KEY);

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  safetySettings,
  generationConfig,
});

export async function* streamLegalChat(history: any[], userMessage: string) {
  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessageStream(userMessage);

  for await (const chunk of result.stream) {
    try {
      const chunkText = chunk.text();
      // Ensure we only yield non-empty strings
      if (chunkText) {
        yield { text: chunkText };
      }
    } catch (error) {
      console.error("Error processing stream chunk:", error);
      // Optionally yield an error object or handle it gracefully
      yield { error: "Failed to process a part of the response." };
    }
  }
}

export async function analyzeLegalCase(userQuery: string): Promise<{ specialty: string; summary: string }> {
  const specialties = [
    'Criminal Law', 'Family Law', 'Corporate Law', 'Real Estate', 
    'Labor Law', 'Intellectual Property', 'Immigration', 'Tax Law', 'General Practice'
  ];

  const prompt = `
    Analyze the following user query and determine the most relevant legal specialty.
    The user is looking for a lawyer.
    Query: "${userQuery}"

    Available specialties are: ${specialties.join(', ')}.

    Your task:
    1.  Provide a brief, one-sentence summary in French explaining your choice. Start with "Votre cas semble concerner...".
    2.  On a new line, state ONLY the chosen specialty from the provided list that best matches the query. Do not add any extra text or punctuation.

    Example:
    Votre cas semble concerner un problème avec votre employeur.
    Labor Law
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("AI response is not in the expected format.");
    }

    const summary = lines[0].trim();
    const specialty = lines[lines.length - 1].trim();

    if (!specialties.includes(specialty)) {
      throw new Error(`AI returned an invalid specialty: ${specialty}`);
    }

    return { summary, specialty };
  } catch (error) {
    console.error("Error analyzing legal case:", error);
    throw new Error("Failed to analyze the legal case with the AI.");
  }
}
