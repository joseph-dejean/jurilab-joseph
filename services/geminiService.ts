import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Load API key from environment variable (from parent .env file)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

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

/**
 * Génère un résumé structuré d'une réunion de consultation juridique
 * à partir du transcript de la visioconférence
 */
export async function generateMeetingSummary(
  transcript: string,
  lawyerName: string,
  clientName: string,
  date: string
): Promise<string> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Transcript is empty or invalid");
  }

  const prompt = `
Tu es un assistant juridique expert. Analyse le transcript suivant d'une consultation juridique entre un avocat et son client, puis génère un résumé professionnel et structuré.

**Informations de la consultation :**
- Avocat : ${lawyerName}
- Client : ${clientName}
- Date : ${date}

**Transcript de la réunion :**
${transcript}

**Instructions :**
Génère un résumé en français, structuré de la manière suivante :

1. **Contexte** : Résume brièvement le contexte de la consultation et le problème du client (2-3 phrases)

2. **Points clés discutés** : Liste les principaux sujets abordés pendant la consultation (3-5 points avec puces)

3. **Décisions prises** : Indique les décisions ou accords pris pendant la consultation (si applicable)

4. **Actions à suivre** : Liste les prochaines étapes à entreprendre, avec qui est responsable de chaque action (avocat ou client)

5. **Recommandations** : Résume les recommandations de l'avocat (si applicable)

**Format :**
- Utilise des titres clairs pour chaque section
- Sois concis mais complet
- Utilise un langage professionnel et juridique approprié
- Ne mentionne pas de détails personnels sensibles
- Si certaines sections ne sont pas applicables, indique "Aucune information disponible"

Génère uniquement le résumé, sans introduction ni conclusion supplémentaire.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (!summary || summary.trim().length === 0) {
      throw new Error("AI generated an empty summary");
    }

    console.log(`✅ Meeting summary generated successfully (${summary.length} characters)`);
    
    return summary.trim();
  } catch (error) {
    console.error("❌ Error generating meeting summary:", error);
    throw new Error("Failed to generate meeting summary with Gemini AI.");
  }
}
