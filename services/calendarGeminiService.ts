import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedEventIntent, CalendarEvent } from "../types/calendarTypes";

/**
 * Converts a date string to a local Date object.
 * If the date has Z suffix (UTC), it treats it as if it was local time instead.
 */
function parseAsLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // If the date ends with Z, remove it to treat as local time
  // This is because Gemini sometimes returns UTC when we want local
  let cleanDateStr = dateStr;
  if (dateStr.endsWith('Z')) {
    cleanDateStr = dateStr.slice(0, -1);
  }
  
  // Parse the date without timezone (will be treated as local)
  const date = new Date(cleanDateStr);
  
  // If invalid, try the original string
  if (isNaN(date.getTime())) {
    return new Date(dateStr);
  }
  
  return date;
}

const parseEventSystemInstruction = `
Tu es un assistant de calendrier intelligent. Tu dois extraire les détails d'un événement à partir du texte de l'utilisateur (en français ou anglais).
Tu dois retourner un objet JSON strict avec les champs suivants:
- title: le titre de l'événement
- start: date/heure de début en format ISO 8601 SANS le suffixe Z (heure locale)
- end: date/heure de fin en format ISO 8601 SANS le suffixe Z (heure locale)
- description: description optionnelle
- location: lieu optionnel
- isAllDay: true si c'est un événement sur toute la journée

IMPORTANT: 
- Les heures doivent être en heure LOCALE (France/Paris), PAS en UTC
- Format: "2026-02-06T18:00:00" (sans Z à la fin)
- Utilise la date actuelle fournie pour calculer les dates relatives ("demain", "lundi prochain", "dans 2 jours")
- Si aucune durée n'est spécifiée, assume 1 heure
- Si aucune heure n'est spécifiée mais que ça semble être une réunion, utilise 9h00 par défaut

Retourne UNIQUEMENT du JSON valide, sans markdown ni texte supplémentaire.
`;

export const parseNaturalLanguageEvent = async (
  input: string,
  currentDate: Date,
  apiKey: string
): Promise<ParsedEventIntent | null> => {
  try {
    if (!apiKey) {
      console.warn("⚠️ Calendar Gemini: API Key is missing.");
      return null;
    }

    console.log("📅 Parsing calendar event from:", input);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    });

    // Format current date for French locale
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const formattedDate = currentDate.toLocaleDateString('fr-FR', dateOptions);

    const prompt = `${parseEventSystemInstruction}

Date et heure actuelles: ${formattedDate}
Date ISO actuelle: ${currentDate.toISOString()}

Texte de l'utilisateur: "${input}"

Extrais les détails de l'événement et retourne un JSON valide.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      console.warn("⚠️ Calendar Gemini: Empty response");
      return null;
    }

    console.log("📅 Gemini raw response:", text);

    // Robust JSON extraction: Find first '{' and last '}'
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    
    let rawParsed: any;
    if (firstOpen !== -1 && lastClose !== -1) {
        const jsonStr = text.substring(firstOpen, lastClose + 1);
        rawParsed = JSON.parse(jsonStr);
    } else {
        // Fallback if strict parsing failed but simple cleanup works
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        rawParsed = JSON.parse(cleanText);
    }
    
    // Convert dates to proper local time format
    const parsed: ParsedEventIntent = {
      title: rawParsed.title,
      start: parseAsLocalDate(rawParsed.start).toISOString(),
      end: parseAsLocalDate(rawParsed.end).toISOString(),
      description: rawParsed.description || '',
      location: rawParsed.location || '',
      isAllDay: rawParsed.isAllDay || false
    };
    
    console.log("✅ Parsed event (local time):", parsed);
    console.log("   Start:", new Date(parsed.start).toLocaleString('fr-FR'));
    console.log("   End:", new Date(parsed.end).toLocaleString('fr-FR'));
    
    return parsed;
  } catch (error) {
    console.error("❌ Error parsing event with Gemini:", error);
    return null;
  }
};

export const answerScheduleQuery = async (
  query: string,
  events: CalendarEvent[],
  currentDate: Date,
  apiKey: string
): Promise<string> => {
  try {
    if (!apiKey) return "Veuillez configurer votre clé API pour utiliser l'assistant IA.";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    // Simplify events for the context window
    const simplifiedEvents = events.map(e => ({
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      source: e.source
    }));

    const prompt = `
    Date et heure actuelles: ${currentDate.toISOString()}
    Événements du calendrier: ${JSON.stringify(simplifiedEvents)}
    
    Question de l'utilisateur: "${query}"
    
    Réponds à la question de l'utilisateur concernant son emploi du temps basé sur les événements fournis. 
    Sois concis et utile. Réponds en français.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Je n'ai pas pu analyser votre emploi du temps pour le moment.";
  } catch (error) {
    console.error("Gemini schedule query error:", error);
    return "Désolé, j'ai rencontré une erreur en vérifiant votre emploi du temps.";
  }
};
