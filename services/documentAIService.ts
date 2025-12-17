/**
 * Document AI Service
 * Provides AI-powered document analysis using Gemini API
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Initialize Google Generative AI
let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

interface AIResponse {
    text: string;
    error?: string;
}

/**
 * Call Gemini API with a prompt
 */
async function callGemini(prompt: string): Promise<AIResponse> {
    if (!genAI) {
        return { text: '', error: 'Gemini API key not configured' };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { text };
    } catch (error: any) {
        console.error('❌ Error calling Gemini:', error);
        return { text: '', error: error.message || 'Unknown error' };
    }
}

/**
 * Generate a summary of the document for clients (simple language)
 */
export async function summarizeDocumentForClient(content: string, documentName: string): Promise<string> {
    const prompt = `Tu es un assistant juridique qui aide les clients à comprendre leurs documents légaux.

Voici un document juridique intitulé "${documentName}":

${content.substring(0, 8000)}

Génère un résumé SIMPLE et ACCESSIBLE pour le client. Utilise:
- Un langage simple, sans jargon juridique
- Des phrases courtes
- Des bullet points pour les points importants
- Maximum 300 mots

Commence directement par le résumé sans introduction.`;

    const response = await callGemini(prompt);
    return response.text || 'Impossible de générer le résumé.';
}

/**
 * Generate a professional summary for lawyers
 */
export async function summarizeDocumentForLawyer(content: string, documentName: string): Promise<string> {
    const prompt = `Tu es un assistant juridique expert.

Voici un document juridique intitulé "${documentName}":

${content.substring(0, 8000)}

Génère un résumé PROFESSIONNEL pour l'avocat incluant:
1. **Nature du document** - Type et objet
2. **Parties concernées** - Qui est impliqué
3. **Clauses clés** - Les points juridiquement importants
4. **Dates et délais** - Échéances mentionnées
5. **Risques identifiés** - Points d'attention

Sois précis et utilise la terminologie juridique appropriée.`;

    const response = await callGemini(prompt);
    return response.text || 'Impossible de générer le résumé.';
}

/**
 * Explain a document in simple terms for clients
 */
export async function explainDocument(content: string, documentName: string): Promise<string> {
    const prompt = `Tu es un assistant qui explique les documents juridiques aux personnes sans formation juridique.

Document: "${documentName}"

${content.substring(0, 8000)}

Explique ce document comme si tu parlais à quelqu'un qui n'a jamais vu de document juridique:
- Utilise des analogies de la vie quotidienne
- Explique CHAQUE terme juridique en parenthèses
- Dis clairement ce que le client doit faire ou comprendre
- Sois rassurant mais précis

Format ta réponse avec des sections claires.`;

    const response = await callGemini(prompt);
    return response.text || 'Impossible de générer l\'explication.';
}

/**
 * Extract key points from a document (for lawyers)
 */
export async function extractKeyPoints(content: string, documentName: string): Promise<string> {
    const prompt = `Tu es un assistant juridique expert en analyse de documents.

Document: "${documentName}"

${content.substring(0, 8000)}

Extrais les POINTS CLÉS de ce document sous forme de liste à puces:
- Identifie les clauses principales
- Note les obligations de chaque partie
- Relève les montants et dates importantes
- Signale les clauses inhabituelles ou risquées avec ⚠️
- Maximum 15 points

Format: bullet points concis et directs.`;

    const response = await callGemini(prompt);
    return response.text || 'Impossible d\'extraire les points clés.';
}

/**
 * Answer a question about a document
 */
export async function answerDocumentQuestion(
    content: string,
    documentName: string,
    question: string,
    isLawyer: boolean
): Promise<string> {
    const roleContext = isLawyer
        ? "Tu parles à un avocat, utilise la terminologie juridique appropriée."
        : "Tu parles à un client sans formation juridique, utilise un langage simple.";

    const prompt = `${roleContext}

Document: "${documentName}"

${content.substring(0, 6000)}

Question du ${isLawyer ? "l'avocat" : 'client'}: "${question}"

Réponds de manière claire et directe. Si la réponse n'est pas dans le document, dis-le clairement.`;

    const response = await callGemini(prompt);
    return response.text || 'Impossible de répondre à la question.';
}

/**
 * Generate a legal draft based on a description
 */
export async function generateLegalDraft(topic: string, outputType: 'EMAIL' | 'CLAUSE' | 'DOCUMENT' = 'CLAUSE'): Promise<string> {
    const typeContext = outputType === 'EMAIL' ? "un email professionnel" :
        outputType === 'CLAUSE' ? "une clause juridique précise" :
            "un document juridique court";

    const prompt = `Tu es un assistant avocat expérimenté.
    Tâche: Rédiger ${typeContext}.
    Sujet/Besoin: "${topic}"
    
    Rédige le contenu directement, sans introduction ni conclusion conversationnelle. 
    Utilise un ton formel et juridique approprié.
    Indique les champs à remplir par l'utilisateur entre crochets [COMME CECI].`;

    const response = await callGemini(prompt);
    return response.text || 'Impossible de générer le brouillon.';
}

/**
 * Suggest tasks based on upcoming appointments
 */
export async function suggestTasksFromAppointments(appointmentsContext: string): Promise<string[]> {
    const prompt = `Tu es un assistant d'organisation pour avocat.
    Voici les prochains rendez-vous de l'avocat:
    ${appointmentsContext}
    
    Suggère 3 à 5 tâches préparatoires concrètes et courtes (max 10 mots chacune) pour ces rendez-vous.
    Exemple: "Relire dossier Client X", "Préparer pièces pour audience Y".
    
    Format: Une tâche par ligne, sans tirets ni numéros au début.`;

    const response = await callGemini(prompt);
    if (!response.text) return [];

    return response.text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
}
