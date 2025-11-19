import { GoogleGenerativeAI } from "@google/generative-ai";
import { LegalSpecialty } from '../types';

// In a real app, ensure API_KEY is handled securely via backend proxy.
// Here we use process.env.API_KEY as instructed.
const getAI = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenerativeAI(apiKey);
};

// Helper function to retry API calls with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is a 503 (overload) or 429 (rate limit)
      const errorCode = error?.error?.code || error?.status;
      const isRetryable = errorCode === 503 || errorCode === 429 || 
                          error?.message?.includes('overloaded') ||
                          error?.message?.includes('UNAVAILABLE');
      
      if (!isRetryable || i === maxRetries - 1) {
        throw error; // Not retryable or last attempt
      }
      
      const delay = initialDelay * Math.pow(2, i); // Exponential backoff
      console.log(`⏳ API surchargée, tentative ${i + 2}/${maxRetries} dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export const analyzeLegalCase = async (userQuery: string, availableLawyers: any[]): Promise<{
  recommendedSpecialty: LegalSpecialty | null;
  summary: string;
  reasoning: string;
  recommendedLawyers: string[];
}> => {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    console.log(`Analyzing case with ${availableLawyers.length} lawyers available`);
    
    // STEP 1: First, identify the legal specialty
    const specialtyPrompt = `
      You are an expert legal intake assistant for the French market. 
      Analyze the following user query describing a legal situation (which may be in English or French): "${userQuery}".
      
      1. Identify the most appropriate LegalSpecialty from this English list (internal use): 
         [${Object.values(LegalSpecialty).join(', ')}].
      2. Provide a very brief (1 sentence) professional summary of the case type IN FRENCH.
      3. Explain in 1 sentence IN FRENCH why this specialty is the match.

      Format the response as a JSON object with keys: 
      - "specialty" (the legal specialty enum value from the list above)
      - "summary" (case summary in French)
      - "reasoning" (why this specialty in French)
      
      If the query is nonsense or not legal related, return "specialty": null.
    `;

    const specialtyResponse = await retryWithBackoff(() => 
      model.generateContent(specialtyPrompt)
    );

    const specialtyText = specialtyResponse.response.text();
    if (!specialtyText) throw new Error('No response from AI for specialty detection');
    
    const specialtyResult = JSON.parse(specialtyText);
    console.log('Specialty detection result:', specialtyResult);
    
    // Validate against enum
    const specialtyEnum = Object.values(LegalSpecialty).find(s => s === specialtyResult.specialty);
    
    if (!specialtyEnum) {
      console.log('No valid specialty detected');
      return {
        recommendedSpecialty: null,
        summary: specialtyResult.summary || "Demande juridique générale",
        reasoning: specialtyResult.reasoning || "Veuillez sélectionner une catégorie manuellement.",
        recommendedLawyers: []
      };
    }
    
    // STEP 2: Filter lawyers by detected specialty
    const filteredLawyers = availableLawyers.filter(l => l.specialty === specialtyEnum);
    console.log(`Found ${filteredLawyers.length} lawyers with specialty ${specialtyEnum}`);
    
    if (filteredLawyers.length === 0) {
      console.log('No lawyers found for this specialty');
      return {
        recommendedSpecialty: specialtyEnum,
        summary: specialtyResult.summary || "Demande juridique générale",
        reasoning: specialtyResult.reasoning || "Basé sur votre description.",
        recommendedLawyers: []
      };
    }
    
    // STEP 3: Ask AI to rank the filtered lawyers
    const lawyersData = filteredLawyers.map(lawyer => ({
      id: lawyer.id,
      name: lawyer.name,
      bio: lawyer.bio,
      yearsExperience: lawyer.yearsExperience,
      rating: lawyer.rating,
      location: lawyer.location,
      languages: lawyer.languages
    }));
    
    const rankingPrompt = `
      Based on this legal situation: "${userQuery}"
      
      Rank the following ${filteredLawyers.length} lawyers specialized in ${specialtyEnum} from BEST to WORST match.
      Consider:
      - Relevance of their bio to the specific legal issue
      - Years of experience
      - Rating
      - Location (prefer nearby lawyers if location is mentioned)
      - Languages (if relevant to the case)
      
      Lawyers:
      ${JSON.stringify(lawyersData, null, 2)}
      
      Return a JSON object with:
      - "recommendedLawyers": array of the TOP 3-5 lawyer IDs, ordered by best match first
      
      Format: {"recommendedLawyers": ["id1", "id2", "id3"]}
    `;
    
    const rankingResponse = await retryWithBackoff(() =>
      model.generateContent(rankingPrompt)
    );
    
    const rankingText = rankingResponse.response.text();
    if (!rankingText) throw new Error('No response from AI for lawyer ranking');
    
    const rankingResult = JSON.parse(rankingText);
    console.log('Lawyer ranking result:', rankingResult);

    return {
      recommendedSpecialty: specialtyEnum,
      summary: specialtyResult.summary || "Demande juridique générale",
      reasoning: specialtyResult.reasoning || "Basé sur votre description.",
      recommendedLawyers: rankingResult.recommendedLawyers || []
    };

  } catch (error: any) {
    console.error("❌ AI Analysis failed:", error);
    console.error("Error details:", error.message || error);
    
    // Better error messages based on error type
    const errorCode = error?.error?.code || error?.status;
    let userMessage = "Veuillez sélectionner une catégorie manuellement.";
    
    if (errorCode === 503 || error?.message?.includes('overloaded') || error?.message?.includes('UNAVAILABLE')) {
      userMessage = "🔄 Le service IA est temporairement surchargé. Veuillez réessayer dans quelques instants ou utilisez les filtres manuels.";
    } else if (errorCode === 429) {
      userMessage = "⏸️ Trop de requêtes. Veuillez attendre quelques secondes avant de réessayer.";
    } else if (errorCode === 401 || errorCode === 403) {
      userMessage = "🔑 Erreur d'authentification API. Contactez le support.";
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      userMessage = "📊 Quota API atteint. Utilisez les filtres manuels en attendant.";
    } else if (error?.message) {
      userMessage = `Erreur technique: ${error.message.substring(0, 100)}`;
    }
    
    return {
      recommendedSpecialty: null,
      summary: "Analyse automatique temporairement indisponible",
      reasoning: userMessage,
      recommendedLawyers: []
    };
  }
};

export const streamLegalChat = async function* (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[], 
  currentMessage: string
) {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `
      Tu es Juribot, l'assistant virtuel intelligent de Jurilab.
      Ta mission est d'aider les utilisateurs à comprendre le droit français, à vulgariser des termes juridiques complexes (contrats, actes) et à trouver des jurisprudences pertinentes.

      RÈGLES STRICTES :
      1. **CLAUSE DE NON-RESPONSABILITÉ** : Tu n'es PAS un avocat. Tu ne donnes pas de conseils juridiques personnalisés, mais uniquement des informations à caractère documentaire. Rappelle souvent à l'utilisateur de consulter un avocat pour son cas précis.
      2. **SOURCES** : Pour tes recherches, tu dois privilégier EXCLUSIVEMENT les sources officielles :
         - legifrance.gouv.fr
         - service-public.fr
         - dalloz.fr
         - courdecassation.fr
         - autres sites en .gouv.fr
      3. Si une question est floue, demande des précisions.
      4. Sois clair, concis et pédagogique. Utilise un ton professionnel mais bienveillant.
      5. Cite toujours tes sources à la fin.
    `,
  });
  
  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    })),
  });

  const result = await chat.sendMessageStream(currentMessage);

  for await (const chunk of result.stream) {
    yield {
      text: chunk.text(),
      groundingMetadata: chunk.candidates?.[0]?.groundingMetadata
    };
  }
};