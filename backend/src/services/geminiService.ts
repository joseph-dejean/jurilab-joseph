/**
 * Gemini AI Service - Communication avec l'API Gemini
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION (lazy-loaded pour permettre à dotenv de charger d'abord)
// ═══════════════════════════════════════════════════════════════════════════════

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

const generationConfig = {
  temperature: 0.3,
  topK: 20,
  topP: 0.8,
  maxOutputTokens: 8192,
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

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS SYSTÈME
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT_DOCUMENT_GENERATION = `Tu es un juriste expert en rédaction d'actes juridiques français.

CONTEXTE IMPORTANT - PROTECTION DES DONNÉES PERSONNELLES (PII) :
- Le modèle fourni contient des PLACEHOLDERS au format [TPL_TYPE_N] (ex: [TPL_NOM_COMPLET_1])
- Les données client contiennent des PLACEHOLDERS au format [CLIENT_TYPE_N] (ex: [CLIENT_NOM_COMPLET_1])
- Tu DOIS utiliser les placeholders CLIENT pour générer le nouvel acte
- NE JAMAIS inventer de vraies données personnelles
- Le résultat final utilisera UNIQUEMENT les placeholders fournis

MISSION :
Génère un NOUVEL acte complet en mimant fidèlement le style du modèle.

INSTRUCTIONS :
1. Analyse la structure du modèle (articles, clauses, sections)
2. Identifie les correspondances entre placeholders TPL et CLIENT
3. Génère le nouvel acte en remplaçant [TPL_*] par [CLIENT_*]
4. Conserve le style, le formalisme et les conventions du modèle
5. Adapte le genre et les accords grammaticaux si nécessaire

RÈGLES ABSOLUES :
- TOUJOURS utiliser les placeholders [CLIENT_*] dans le résultat
- JAMAIS de vraies données personnelles
- JAMAIS inventer d'informations absentes
- TOUJOURS respecter le droit français
`;

const SYSTEM_PROMPT_CHAT = `Tu es un assistant juridique français expert.

RÈGLES FONDAMENTALES :
1. Persona : Professionnel, objectif, clair
2. Méthodologie : Syllogisme juridique (Faits → Problème → Majeure → Mineure → Conclusion)
3. Formatage : Markdown riche (titres, gras, listes)
4. Citations : Toujours citer les sources (articles de loi, jurisprudence)
5. Limites : Tu informes mais ne conseilles pas (rappeler de consulter un avocat)

STYLE :
- Pédagogique et accessible
- Professionnel mais chaleureux
- Concis mais complet
`;

// ═══════════════════════════════════════════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Génère un document juridique à partir d'un template et de données client (anonymisés)
 */
export async function generateDocument(
  templateAnonymized: string,
  clientDataAnonymized: string,
  actType: string,
  customInstructions?: string
): Promise<{ generatedText: string; confidence: number }> {
  const model = getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    safetySettings,
    generationConfig,
    systemInstruction: SYSTEM_PROMPT_DOCUMENT_GENERATION,
  });

  const prompt = `
TYPE D'ACTE : ${actType}

MODÈLE (avec placeholders TPL) :
${templateAnonymized}

DONNÉES CLIENT (avec placeholders CLIENT) :
${clientDataAnonymized}

${customInstructions ? `INSTRUCTIONS SUPPLÉMENTAIRES :\n${customInstructions}\n` : ''}

Génère le nouvel acte complet en utilisant les placeholders CLIENT.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Calculer la confiance basée sur la présence de placeholders non résolus
    const hasUnresolvedTplPlaceholders = /\[TPL_[A-Z_]+_\d+\]/.test(generatedText);
    const hasClientPlaceholders = /\[CLIENT_[A-Z_]+_\d+\]/.test(generatedText);
    
    let confidence = 0.9;
    if (hasUnresolvedTplPlaceholders) confidence -= 0.2;
    if (!hasClientPlaceholders && clientDataAnonymized.includes('[CLIENT_')) confidence -= 0.1;

    return { generatedText, confidence };
  } catch (error) {
    console.error('❌ Error generating document:', error);
    throw error;
  }
}

/**
 * Chat streaming avec historique
 */
export async function* streamChat(
  history: Array<{ role: 'user' | 'model'; text: string }>,
  userMessage: string,
  contextData?: {
    userName?: string;
    currentTime?: string;
    appointments?: {
      upcoming?: any[];
      recent?: any[];
    };
  }
): AsyncGenerator<{ text?: string; error?: string }> {
  if (!isGeminiConfigured()) {
    yield { error: 'L\'API Gemini n\'est pas configurée. Veuillez définir GEMINI_API_KEY dans le fichier .env du backend.' };
    return;
  }

  let contextString = '';
  
  if (contextData) {
    contextString = `
CONTEXTE ADMINISTRATIF (Données Réelles du Cabinet) :
- Avocat connecté : ${contextData.userName || 'Maître'}
- Date et Heure actuelles : ${contextData.currentTime || new Date().toLocaleString('fr-FR')}
`;

    if (contextData.appointments && contextData.appointments.upcoming && contextData.appointments.upcoming.length > 0) {
      contextString += `
  
AGENDA (Prochains Rendez-vous) :
${contextData.appointments.upcoming.map((apt: any, idx: number) => `
${idx + 1}. ${apt.formattedDate}
   - Client : ${apt.clientName || 'Non spécifié'}
   - Type : ${apt.type === 'VIDEO' ? 'Visioconférence' : apt.type === 'PHONE' ? 'Téléphone' : 'En personne'}
   - Durée : ${apt.duration || 60} minutes
   - Statut : ${apt.status === 'CONFIRMED' ? 'Confirmé' : apt.status === 'PENDING' ? 'En attente' : apt.status}
   ${apt.notes ? `- Notes : ${apt.notes}` : ''}
`).join('\n')}

${contextData.appointments.recent && contextData.appointments.recent.length > 0 ? `
HISTORIQUE RÉCENT :
${contextData.appointments.recent.map((apt: any, idx: number) => `
${idx + 1}. ${apt.formattedDate} avec ${apt.clientName || 'Non spécifié'} - ${apt.status}
`).join('')}
` : ''}

INSTRUCTIONS SPÉCIFIQUES "ASSISTANT EXÉCUTIF" :
- Tu as accès à l'agenda réel de l'avocat ci-dessus.
- Si l'utilisateur demande "mon prochain rdv" ou "mes prochains rendez-vous", utilise les données ci-dessus pour répondre précisément (Client, Date, Notes).
- Si l'utilisateur demande un résumé d'un rdv spécifique, analyse les notes et détails disponibles.
- Tu restes AUSSI un expert juridique capable de répondre aux questions de droit avec des liens Légifrance.
- Adapte ton ton : tu es un assistant personnel ET juridique.
`;
    } else {
      contextString += `
  
AGENDA : Aucun rendez-vous à venir actuellement.

Tu peux informer l'avocat qu'il n'a pas de rendez-vous prévus si demandé.
`;
    }
  }

  const model = getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    safetySettings,
    generationConfig,
    systemInstruction: SYSTEM_PROMPT_CHAT + contextString,
  });

  const formattedHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  try {
    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessageStream(userMessage);

    for await (const chunk of result.stream) {
      try {
        const chunkText = chunk.text();
        if (chunkText) {
          yield { text: chunkText };
        }
      } catch (error) {
        console.error('Error processing chunk:', error);
        yield { error: 'Failed to process response chunk' };
      }
    }
  } catch (error) {
    console.error('❌ Error in chat stream:', error);
    yield { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Chat simple (non-streaming)
 */
export async function chat(
  history: Array<{ role: 'user' | 'model'; text: string }>,
  userMessage: string
): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    safetySettings,
    generationConfig,
    systemInstruction: SYSTEM_PROMPT_CHAT,
  });

  const formattedHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const chatSession = model.startChat({ history: formattedHistory });
  const result = await chatSession.sendMessage(userMessage);
  return result.response.text();
}
