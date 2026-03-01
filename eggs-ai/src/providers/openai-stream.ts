/**
 * Shared streaming logic for OpenAI-compatible APIs.
 * Used by: OpenAI, Groq, Mistral, Custom providers.
 */
export async function openaiStreamChat(
  url: string,
  headers: Record<string, string>,
  model: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stream error: ${response.status} — ${err}`);
  }

  let full = '';
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data) as {
          choices: Array<{ delta?: { content?: string } }>;
        };
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          full += content;
          onChunk(content);
        }
      } catch {
        // partial JSON, skip
      }
    }
  }

  return full;
}
