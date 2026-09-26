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
    const response = await fetch('/api/ai/test-provider', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        apiKey,
        model,
        customBaseUrl,
      }),
    });

    const data = await response.json().catch(() => ({}));
    const latencyMs = typeof data.latencyMs === 'number' ? data.latencyMs : (Date.now() - startTime);

    if (response.ok && data.success) {
      return {
        success: true,
        testedAt: Date.now(),
        status: 'success',
        message: data.message || `المزود (${provider}) متصل ومفتاح الـ API صالح ويعمل بنجاح.`,
        latencyMs,
        provider,
        model: data.model || model,
      };
    } else {
      return {
        success: false,
        testedAt: Date.now(),
        status: 'error',
        message: data.error || `تعذر التحقق من مفتاح المزود (${provider}). يرجى التأكد من صحة المفتاح.`,
        latencyMs,
        provider,
        model,
      };
    }
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
