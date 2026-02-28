/**
 * Gemini Service — proxies all AI calls through the FastAPI backend.
 * No Gemini API key is needed or stored in the browser.
 */

const BASE = "/api/v1/gemini";

// ─────────────────────────────────────────────────────────────────────────────
// SSE streaming helper
// ─────────────────────────────────────────────────────────────────────────────

async function* fetchSSE(
  url: string,
  body: object
): AsyncGenerator<{ text?: string; error?: string }> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    yield { error: "Impossible de joindre le serveur backend." };
    return;
  }

  if (!response.ok || !response.body) {
    yield { error: `Erreur serveur : ${response.status}` };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        yield JSON.parse(data) as { text?: string; error?: string };
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API (same signatures as before — components unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export async function* streamLegalChat(history: any[], userMessage: string) {
  yield* fetchSSE(`${BASE}/legal-chat`, { history, message: userMessage });
}

export async function* streamWorkspaceChat(
  history: any[],
  userMessage: string,
  contextData: { userName: string; currentTime: string; appointments: any[] }
) {
  yield* fetchSSE(`${BASE}/workspace-chat`, {
    history,
    message: userMessage,
    contextData,
  });
}

export async function* sendMessageToGemini(
  userMessage: string,
  history: any[] = []
): AsyncGenerator<{ text?: string; error?: string; done?: boolean }> {
  for await (const chunk of fetchSSE(`${BASE}/legal-chat`, {
    history,
    message: userMessage,
  })) {
    yield chunk;
  }
  yield { done: true };
}

export async function analyzeLegalCase(
  userQuery: string
): Promise<{ specialty: string; summary: string }> {
  try {
    const res = await fetch(`${BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userQuery }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      summary:
        "Votre cas semble concerner une question juridique. Utilisez les filtres ci-dessous pour affiner votre recherche.",
      specialty: "General Practice",
    };
  }
}

export async function generateMeetingSummary(
  transcript: string,
  lawyerName: string,
  clientName: string,
  date: string
): Promise<string> {
  const res = await fetch(`${BASE}/meeting-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, lawyerName, clientName, date }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.summary as string;
}
