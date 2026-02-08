import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
// import { PisteSearchResult } from "./pisteService";

// Load API key from environment variable (from parent .env file)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Validate API key on initialization
if (!API_KEY) {
  console.error("❌ VITE_GEMINI_API_KEY is not set! Gemini AI features will not work.");
} else {
  console.log("✅ Gemini API key loaded successfully");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const generationConfig = {
  temperature: 0.3, // Low temperature for high precision and adherence to facts
  topK: 20,
  topP: 0.8,
  maxOutputTokens: 4096,
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

// Helper function to create model with timeout
const createModelWithTimeout = () => {
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings,
    generationConfig,
  });
};

const model = createModelWithTimeout();

// Helper to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

// System instruction for the expert lawyer persona (Base)
const SYSTEM_INSTRUCTION_BASE = `
Tu es un assistant juridique francais, reconnu pour ton excellence juridique et ta pédagogie.
RÈGLES FONDAMENTALES :
1. **Persona** : Profesionnel, objectif, clair.
2. **Méthodologie** : Syllogisme (Faits -> Problème -> Majeure -> Mineure -> Conclusion).
3. **Formatage** : Markdown riche (Titres ###, **Gras**, Listes).
4. **Citations & Liens (CRITIQUE)** :
   - Pour CHAQUE citation juridique, tu DOIS générer un lien hypertexte Markdown menant vers Légifrance.

`;

export async function* streamLegalChat(history: any[], userMessage: string) {
  // Check if API key is available
  if (!API_KEY) {
    yield { error: "L'API Gemini n'est pas configurée. Veuillez vérifier la configuration." };
    return;
  }

  try {
    const modelWithSystem = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
      generationConfig,
      systemInstruction: SYSTEM_INSTRUCTION_BASE,
    });

    const chat = modelWithSystem.startChat({
      history: history,
    });

    const result = await chat.sendMessageStream(userMessage);

    for await (const chunk of result.stream) {
      try {
        const chunkText = chunk.text();
        if (chunkText) yield { text: chunkText };
      } catch (error: any) {
        // Handle SAFETY blocks gracefully
        if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
          console.warn("⚠️ Response blocked by safety filter:", error.message);
          yield { text: "\n\n*Je ne peux pas répondre à cette question car elle a été bloquée par les filtres de sécurité. Veuillez reformuler votre question.*" };
          return;
        }
        console.error("Error processing stream chunk:", error);
        yield { error: "Erreur lors du traitement de la réponse." };
        return;
      }
    }
  } catch (error: any) {
    console.error("Error in streamLegalChat:", error);
    if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
      yield { text: "*Votre question a été bloquée par les filtres de sécurité. Veuillez reformuler.*" };
    } else {
      yield { error: "Une erreur est survenue avec l'assistant IA. Veuillez réessayer." };
    }
  }
}

/**
 * Service de chat avancé pour l'Assistant Workspace
 * Intègre le contexte administratif (RDV, Profil) dans le prompt système
 */
export async function* streamWorkspaceChat(
  history: any[],
  userMessage: string,
  contextData: {
    userName: string;
    currentTime: string;
    appointments: any[];
  }
) {
  // Check if API key is available
  if (!API_KEY) {
    yield { error: "L'API Gemini n'est pas configurée. Veuillez vérifier la configuration." };
    return;
  }

  try {
    // Construire un contexte riche à partir des données réelles
    const contextString = `
    CONTEXTE ADMINISTRATIF (Données Réelles du Cabinet) :
    - Avocat connecté : ${contextData.userName}
    - Date et Heure actuelles : ${contextData.currentTime}
    
    AGENDA (Prochains Rendez-vous) :
    ${contextData.appointments.length > 0 ? JSON.stringify(contextData.appointments, null, 2) : "Aucun rendez-vous prévu."}
    
    INSTRUCTIONS SPÉCIFIQUES "ASSISTANT EXÉCUTIF" :
    - Tu as accès à l'agenda réel de l'avocat ci-dessus.
    - Si l'utilisateur demande "mon prochain rdv", utilise les données JSON pour répondre précisément (Nom, Date, Notes).
    - Si l'utilisateur demande un résumé d'un rdv spécifique, analyse les notes et détails disponibles.
    - Tu restes AUSSI un expert juridique capable de répondre aux questions de droit avec des liens Légifrance.
    `;

    // Combiner l'instruction de base juridique avec le contexte administratif
    const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\n\n${contextString}`;

    const modelWithSystem = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
      generationConfig,
      systemInstruction: fullSystemInstruction,
    });

    const chat = modelWithSystem.startChat({
      history: history,
    });

    const result = await chat.sendMessageStream(userMessage);

    for await (const chunk of result.stream) {
      try {
        const chunkText = chunk.text();
        if (chunkText) yield { text: chunkText };
      } catch (error: any) {
        // Handle SAFETY blocks gracefully
        if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
          console.warn("⚠️ Response blocked by safety filter:", error.message);
          yield { text: "\n\n*Je ne peux pas répondre à cette question car elle a été bloquée par les filtres de sécurité. Veuillez reformuler votre question.*" };
          return;
        }
        console.error("Error stream workspace chat:", error);
        yield { error: "Erreur de traitement." };
        return;
      }
    }
  } catch (error: any) {
    console.error("Error in streamWorkspaceChat:", error);
    if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
      yield { text: "*Votre question a été bloquée par les filtres de sécurité. Veuillez reformuler.*" };
    } else {
      yield { error: "Une erreur est survenue avec l'assistant. Veuillez réessayer." };
    }
  }
}

/**
 * Generic message streaming function for the workspace assistant
 * Used by backendService for conversation management
 */
export async function* sendMessageToGemini(
  userMessage: string,
  history: any[] = []
): AsyncGenerator<{ text?: string; error?: string; done?: boolean }> {
  // Check if API key is available
  if (!API_KEY) {
    yield { error: "L'API Gemini n'est pas configurée." };
    return;
  }

  try {
    const modelWithSystem = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
      generationConfig,
      systemInstruction: SYSTEM_INSTRUCTION_BASE,
    });

    // Convert history to Gemini format
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const chat = modelWithSystem.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessageStream(userMessage);

    for await (const chunk of result.stream) {
      try {
        const chunkText = chunk.text();
        if (chunkText) {
          yield { text: chunkText };
        }
      } catch (error: any) {
        // Handle SAFETY blocks gracefully
        if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
          console.warn("⚠️ Response blocked by safety filter:", error.message);
          yield { text: "\n\n*Je ne peux pas répondre à cette question car elle a été bloquée par les filtres de sécurité. Veuillez reformuler votre question.*" };
          yield { done: true };
          return;
        }
        console.error("Error processing stream chunk:", error);
        yield { error: "Erreur lors du traitement de la réponse." };
        return;
      }
    }

    yield { done: true };
  } catch (error: any) {
    console.error("Error in sendMessageToGemini:", error);
    if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
      yield { text: "*Votre question a été bloquée par les filtres de sécurité. Veuillez reformuler.*" };
      yield { done: true };
    } else {
      yield { error: "Une erreur est survenue. Veuillez réessayer." };
    }
  }
}

export async function analyzeLegalCase(userQuery: string): Promise<{ specialty: string; summary: string }> {
  // Check if API key is available
  if (!API_KEY) {
    console.warn("⚠️ Gemini API key not configured, using fallback");
    return {
      summary: "Votre cas semble concerner une question juridique. Utilisez les filtres ci-dessous pour affiner votre recherche.",
      specialty: 'General Practice'
    };
  }

  const specialties = [
    'Criminal Law', 'Family Law', 'Corporate Law', 'Real Estate',
    'Labor Law', 'Intellectual Property', 'Immigration', 'Tax Law', 'General Practice'
  ];

  const prompt = `
    Tu es un assistant juridique expert. Analyse la requête suivante d'un utilisateur cherchant un avocat.
    
    Requête de l'utilisateur : "${userQuery}"

    Spécialités disponibles : ${specialties.join(', ')}.

    Instructions :
    1. Détermine la spécialité juridique la plus pertinente pour cette requête.
    2. Rédige une phrase d'analyse en français qui :
       - Commence par "Votre cas semble concerner"
       - Décrit spécifiquement le problème juridique mentionné par l'utilisateur
       - Mentionne le domaine du droit concerné de façon naturelle
       - Soit empathique et professionnelle
       - Fasse entre 15 et 30 mots
    3. Sur une nouvelle ligne, écris UNIQUEMENT la spécialité choisie (en anglais, exactement comme dans la liste).

  `;

  try {
    console.log("🤖 Calling Gemini API for legal case analysis...");
    
    // Add 15 second timeout
    const result = await withTimeout(
      model.generateContent(prompt),
      15000,
      "Gemini API timeout - the service is taking too long to respond"
    );
    
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini response received");

    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.warn("⚠️ AI response format unexpected, using fallback");
      return {
        summary: "Votre cas semble concerner une question juridique. Utilisez les filtres ci-dessous pour affiner votre recherche.",
        specialty: 'General Practice'
      };
    }

    const summary = lines[0].trim();
    const specialty = lines[lines.length - 1].trim();

    // Relaxed check: find the specialty in the string instead of exact match
    const foundSpecialty = specialties.find(s => specialty.includes(s)) || 'General Practice';

    console.log(`✅ Legal case analyzed: ${foundSpecialty}`);
    return { summary, specialty: foundSpecialty };
  } catch (error: any) {
    console.error("❌ Error analyzing legal case:", error);
    
    // Return a helpful fallback instead of throwing
    if (error.message?.includes('timeout')) {
      return {
        summary: "Le service d'analyse IA est temporairement lent. Utilisez les filtres pour trouver un avocat.",
        specialty: 'General Practice'
      };
    }
    
    if (error.message?.includes('API_KEY') || error.message?.includes('403') || error.message?.includes('401')) {
      console.error("❌ Gemini API key issue - check your VITE_GEMINI_API_KEY");
      return {
        summary: "Service d'analyse temporairement indisponible. Utilisez les filtres ci-dessous.",
        specialty: 'General Practice'
      };
    }
    
    // Generic fallback
    return {
      summary: "Votre recherche a été comprise. Utilisez les filtres pour affiner les résultats.",
      specialty: 'General Practice'
    };
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
// End of service
