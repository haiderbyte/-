import { AIProvider, AIProviderConfig, ChatMessage, Quote } from '../types';

function keyFor(c: AIProviderConfig) {
  return c.provider === 'gemini' ? c.geminiKey : c.provider === 'openai' ? c.openAiKey : c.provider === 'anthropic' ? c.anthropicKey : c.provider === 'groq' ? (c.groqKey || c.customKey) : c.customKey;
}
function baseFor(c: AIProviderConfig) { return c.provider === 'groq' ? 'https://api.groq.com/openai/v1' : c.provider === 'openai' ? 'https://api.openai.com/v1' : c.customBaseUrl.replace(/\/$/, ''); }
function systemPrompt(persona: string) { return `أنت روح أوسامو دازاي الأدبية (${persona}). أجب بالعربية الفصيحة بأسلوب إنساني عميق ومكثف، دون ادعاء أنك دازاي الحقيقي ودون إطالة غير لازمة.`; }

export async function directChat(config: AIProviderConfig, message: string, persona: string, history: ChatMessage[]) {
  const key = keyFor(config)?.trim();
  if (!key && config.provider !== 'custom') throw new Error('أدخل مفتاح API أولاً من الإعدادات.');
  const model = config.selectedModel;
  if (config.provider === 'gemini') {
    const contents = [...history.slice(-8), { role: 'user', content: message }].map((m: any) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key || '')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt(persona) }] }, contents, generationConfig: { temperature: config.temperature, maxOutputTokens: 900 } }) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error?.message || `فشل Gemini (${r.status})`);
    return { reply: d?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '', provider: 'gemini', model };
  }
  if (config.provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'Content-Type': 'application/json' }, body: JSON.stringify({ model, system: systemPrompt(persona), max_tokens: 900, temperature: config.temperature, messages: [...history.slice(-8), { role: 'user', content: message }].map((m: any) => ({ role: m.role, content: m.content })) }) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error?.message || `فشل Claude (${r.status})`);
    return { reply: d?.content?.map((p: any) => p.text || '').join('') || '', provider: 'anthropic', model };
  }
  const r = await fetch(`${baseFor(config)}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key || ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, temperature: config.temperature, max_tokens: 900, messages: [{ role: 'system', content: systemPrompt(persona) }, ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: message }] }) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error?.message || `فشل الاتصال بالمزود (${r.status})`);
  return { reply: d?.choices?.[0]?.message?.content || '', provider: config.provider, model };
}

export async function directGenerateQuote(config: AIProviderConfig, topic: string): Promise<Partial<Quote>> {
  const prompt = `اكتب شذرة أدبية أصلية مستوحاة من موضوع: ${topic}. أعد JSON فقط بهذا الشكل: {"textAr":"...","textJp":"","source":"اسم عمل دازاي مناسب","chapter":"فصل","reflection":"تأمل قصير"}. لا تنسب نصًا مختلقًا إلى دازاي؛ اكتب أنها مستوحاة.`;
  const r = await directChat(config, prompt, 'دازاي', []);
  const raw = r.reply.replace(/```json|```/g, '').trim();
  try { return JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error('رد المزود ليس JSON صالحًا.'); }
}
