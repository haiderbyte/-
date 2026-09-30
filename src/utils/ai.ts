import { AIProvider, AIProviderConfig, ProviderTestResult } from '../types';

export interface ValidateProviderOptions {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  customBaseUrl?: string;
}

export interface ProviderValidationResult extends ProviderTestResult {
  success: boolean;
}

export interface DetectedProviderInfo {
  provider: AIProvider;
  name: string;
  recommendedModel: string;
  keyField: 'geminiKey' | 'openAiKey' | 'anthropicKey' | 'groqKey' | 'customKey';
}

/** Direct provider ping for Capacitor builds where the Express API is not bundled. */
async function directProviderPing(provider: AIProvider, apiKey: string, model: string, customBaseUrl?: string) {
  if (!apiKey && provider !== 'custom') throw new Error('مفتاح API مطلوب قبل فحص الاتصال.');
  if (provider === 'groq') {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: model || 'openai/gpt-oss-120b', messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 }) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error?.message || 'مفتاح Groq غير صالح أو النموذج غير متاح.');
    return { message: 'تم الاتصال بـ Groq بنجاح من التطبيق.', model: model || 'openai/gpt-oss-120b' };
  }
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey.trim()}` } });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error?.message || 'مفتاح OpenAI غير صالح.');
    return { message: 'تم الاتصال بـ OpenAI بنجاح من التطبيق.', model: model || 'gpt-4o-mini' };
  }
  if (provider === 'gemini') {
    const selected = model || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selected}:generateContent?key=${encodeURIComponent(apiKey.trim())}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with one word: connected' }] }] }) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error?.message || 'مفتاح Gemini غير صالح أو النموذج غير متاح.');
    return { message: 'تم الاتصال بـ Gemini بنجاح من التطبيق.', model: selected };
  }
  if (provider === 'custom') {
    if (!customBaseUrl) throw new Error('عنوان المزود المخصص مطلوب.');
    const r = await fetch(`${customBaseUrl.replace(/\/$/, '')}/models`, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} });
    if (!r.ok) throw new Error(`فشل الاتصال بالمزود المخصص (${r.status}).`);
    return { message: 'تم الاتصال بالمزود المخصص بنجاح من التطبيق.', model: model || 'default' };
  }
  throw new Error('الاتصال المباشر بهذا المزود غير مدعوم.');
}

/**
 * Automatically inspects the raw text of an API key to identify
 * which AI provider it belongs to (e.g. gsk_ for Groq, AIza for Gemini, etc.)
 */
export function detectProviderFromKey(rawKey: string): DetectedProviderInfo | null {
  if (!rawKey || typeof rawKey !== 'string') return null;
  const key = rawKey.trim();
  if (!key) return null;

  if (key.startsWith('gsk_')) {
    return {
      provider: 'groq',
      name: 'Groq Cloud',
      recommendedModel: 'openai/gpt-oss-120b',
      keyField: 'groqKey',
    };
  }

  if (key.startsWith('AIza')) {
    return {
      provider: 'gemini',
      name: 'Google Gemini',
      recommendedModel: 'gemini-3.8-flash',
      keyField: 'geminiKey',
    };
  }

  if (key.startsWith('sk-ant-')) {
    return {
      provider: 'anthropic',
      name: 'Anthropic Claude',
      recommendedModel: 'claude-3-5-haiku-20241022',
      keyField: 'anthropicKey',
    };
  }

  if (key.startsWith('sk-')) {
    return {
      provider: 'openai',
      name: 'OpenAI GPT',
      recommendedModel: 'gpt-4o-mini',
      keyField: 'openAiKey',
    };
  }

  return null;
}

/**
 * Sends a lightweight test ping to the selected AI provider
 * to verify API key validity, latency, and operational health.
 * 
 * @param optionsOrConfig ValidateProviderOptions or the full AIProviderConfig
 * @param specificProvider Optional override for which provider to test
 * @returns Promise<ProviderValidationResult>
 */
export async function validateProvider(
  optionsOrConfig: ValidateProviderOptions | AIProviderConfig,
  specificProvider?: AIProvider
): Promise<ProviderValidationResult> {
  const startTime = Date.now();
  let provider: AIProvider;
  let apiKey = '';
  let model = '';
  let customBaseUrl: string | undefined;

  // Check if passed a full AIProviderConfig
  if ('selectedModel' in optionsOrConfig && 'geminiKey' in optionsOrConfig) {
    const config = optionsOrConfig as AIProviderConfig;
    provider = specificProvider || config.provider;

    if (provider === 'gemini') {
      apiKey = config.geminiKey;
      model = config.selectedModel && config.selectedModel.startsWith('gemini') ? config.selectedModel : 'gemini-3.8-flash';
    } else if (provider === 'openai') {
      apiKey = config.openAiKey;
      model = config.selectedModel && (config.selectedModel.startsWith('gpt') || config.selectedModel.startsWith('o'))
        ? config.selectedModel
        : 'gpt-4o-mini';
    } else if (provider === 'anthropic') {
      apiKey = config.anthropicKey;
      model = config.selectedModel && config.selectedModel.startsWith('claude')
        ? config.selectedModel
        : 'claude-3-5-haiku-20241022';
    } else if (provider === 'groq') {
      apiKey = config.groqKey || config.customKey;
      model = (config.selectedModel && !config.selectedModel.includes('llama-3') && !config.selectedModel.includes('mixtral'))
        ? config.selectedModel
        : 'openai/gpt-oss-120b';
      customBaseUrl = 'https://api.groq.com/openai/v1';
    } else {
      apiKey = config.customKey;
      model = config.selectedModel || 'deepseek-chat';
      customBaseUrl = config.customBaseUrl;
    }
  } else {
    const opts = optionsOrConfig as ValidateProviderOptions;
    provider = opts.provider;
    apiKey = opts.apiKey || '';
    model = opts.model || '';
    customBaseUrl = opts.customBaseUrl;
  }

  // Auto-detect if key is clearly a Groq key (gsk_) or Gemini key (AIza)
  const detected = detectProviderFromKey(apiKey);
  if (detected && detected.provider !== provider) {
    provider = detected.provider;
    if (!model || model.includes('llama-3') || model.includes('mixtral')) {
      model = detected.recommendedModel;
    }
  }

  // Auto-upgrade any deprecated Gemini models
  if (
    provider === 'gemini' &&
    (!model ||
      model.includes('2.5') ||
      model.includes('2.0') ||
      model.includes('1.5'))
  ) {
    model = 'gemini-3.8-flash';
  }

  // Auto-upgrade any deprecated Groq models
  if (
    provider === 'groq' &&
    (!model ||
      model.includes('llama-3') ||
      model.includes('mixtral') ||
      model === 'default')
  ) {
    model = 'openai/gpt-oss-120b';
  }

  // Auto-upgrade any deprecated OpenAI models
  if (
    provider === 'openai' &&
    (!model || model.includes('gpt-3.5') || model === 'default')
  ) {
    model = 'gpt-4o-mini';
  }

  // Auto-upgrade any deprecated Anthropic models
  if (
    provider === 'anthropic' &&
    (!model || (!model.startsWith('claude-3-5') && !model.startsWith('claude-3-opus')) || model === 'default')
  ) {
    model = 'claude-3-5-haiku-20241022';
  }

  try {
    const direct = await directProviderPing(provider, apiKey, model, customBaseUrl);
    return { success: true, testedAt: Date.now(), status: 'success', message: direct.message, latencyMs: Date.now() - startTime, provider, model: direct.model };
  } catch (err: any) {
    return {
      success: false,
      testedAt: Date.now(),
      status: 'error',
      message: err.message || `انقطع الاتصال بخادم الفحص أثناء إرسال Ping للمزود (${provider}).`,
      latencyMs: Date.now() - startTime,
      provider,
      model,
    };
  }
}
