import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
// import { PisteSearchResult } from "./pisteService";

// Load API key from environment variable (from parent .env file)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

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

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  safetySettings,
  generationConfig,
});

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
    } catch (error) {
      console.error("Error processing stream chunk:", error);
      yield { error: "Failed to process a part of the response." };
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
    } catch (error) {
      console.error("Error stream workspace chat:", error);
      yield { error: "Erreur de traitement." };
    }
  }
}

export async function analyzeLegalCase(userQuery: string): Promise<{ specialty: string; summary: string }> {
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("AI response is not in the expected format.");
    }

    const summary = lines[0].trim();
    const specialty = lines[lines.length - 1].trim();

    // Relaxed check: find the specialty in the string instead of exact match
    const foundSpecialty = specialties.find(s => specialty.includes(s)) || 'General Practice';

    return { summary, specialty: foundSpecialty };
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
// End of service
