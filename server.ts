import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

const PORT = 3000;

// Shared Gemini instance
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: geminiApiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to normalize Groq models (auto-upgrades old/deprecated models like llama-3 to active models)
function normalizeGroqModel(model?: string): string {
  if (
    !model ||
    model === 'default' ||
    model.includes('llama-3') ||
    model.includes('mixtral')
  ) {
    return 'openai/gpt-oss-120b';
  }
  return model;
}

// Helper to normalize OpenAI models
function normalizeOpenAiModel(model?: string): string {
  if (!model || model === 'default' || model.includes('gpt-3.5')) {
    return 'gpt-4o-mini';
  }
  return model;
}

// Helper to normalize Anthropic models
function normalizeAnthropicModel(model?: string): string {
  if (!model || model === 'default' || (!model.startsWith('claude-3-5') && !model.startsWith('claude-3-opus'))) {
    return 'claude-3-5-sonnet-20241022';
  }
  return model;
}

// Helper to normalize Gemini models
function normalizeGeminiModel(model?: string): string {
  if (
    !model ||
    model === 'default' ||
    model.includes('2.5') ||
    model.includes('2.0') ||
    model.includes('1.5')
  ) {
    return 'gemini-3.8-flash';
  }
  return model;
}

// Smart auto-detection of provider from API key format
function detectProviderFromApiKey(key?: string): string | null {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed.startsWith('gsk_')) return 'groq';
  if (trimmed.startsWith('AIza')) return 'gemini';
  if (trimmed.startsWith('sk-ant-')) return 'anthropic';
  if (trimmed.startsWith('sk-')) return 'openai';
  return null;
}

// Persona prompts for Osamu Dazai
const PERSONA_PROMPTS: Record<string, string> = {
  dazai: `أنت الكاتب الياباني "أوسامو دازاي" (Osamu Dazai - 太宰治)، مؤلف "لم أعد إنساناً" (人間失格) و"شمس الغروب" (斜陽).
تتحدث باللغة العربية الأدبية الكلاسيكية الفصيحة، بنبرة هادئة، سوداوية، اعترافية، وصادقة للغاية.
أنت شخص يعيش في طوكيو في أواخر أربعينيات القرن العشرين، تشعر باغتراب دائم عن المجتمع البشري، تخشى الأقنعة الاجتماعية لكنك تتفهم هشاشة النفس البشرية بعمق ومحبة معذبة.
لا تقدم نصائح سطحية أو تفاؤلاً زائفاً؛ بل استمع بصدق وتحدث عن الوجود، الحزن الجميل، العزلة، والبحث عن بصيص صدق.
أجب باختصار أدبي بليغ (فقرة إلى فقرتين شاعريتين عميقتين).`,

  friend: `أنت الصديق الأدبي الوفي لدازاي، مستمع حنون ومتأمل في ليل هادئ وماطر.
تتحدث بعربية فصيحة عذبة ودافئة، تشارك السائل هواجسه دون إطلاق أحكام، وتواسيه بفهم عميق لثقل الحياة دون وعظ أو تكلّف.
أسلوبك حميمي ورقيق، كحديث بين رفيقين تحت شرفة خشبية في طوكيو القديمة.`,

  sensei: `أنت معلم وأديب ياباني حكيم من حقبة الشوا، خبير في الأدب الكلاسيكي والنفس الإنسانية وتفاصيل حياة وأعمال أوسامو دازاي.
تتحدث برصانة وهدوء فلسفي عميق باللغة العربية الفصيحة، تشرح العواطف المعقدة بنظرة تحليلية واعية تجمع بين الفلسفة الشرقية والجماليات الأدبية (المونو نو أواري - تأمل زوال الأشياء).`,

  yozo: `أنت "يوزو أوبا" (Yozo Oba)، بطل وراوي رواية "لم أعد إنساناً".
شخصيتك تتسم بالسخرية المريرة من الذات، الاعتراف بالرعب الدائم من كشف الآخرين لحقيقتك وارتداء قناع المهرج للتأقلم مع عالم لا تفهمه.
تتحدث بصراحة لاذعة، وأسلوب ساخر حزين ومؤلم عن عبثية التوقعات الاجتماعية ورهبة الانخراط بين البشر.`
};

// Test AI Provider endpoint
app.post('/api/ai/test-provider', async (req, res) => {
  try {
    let { provider, apiKey, model, customBaseUrl } = req.body;
    const startTime = Date.now();

    // Smart auto-detection if apiKey format strongly dictates provider
    const detected = detectProviderFromApiKey(apiKey);
    if (detected && detected !== provider) {
      provider = detected;
    }

    // 1. Groq provider
    if (provider === 'groq') {
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'مفتاح Groq API مطلوب لفحص الاتصال.',
        });
      }

      const groqModel = normalizeGroqModel(model);
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!groqRes.ok) {
        const errData = await groqRes.json().catch(() => ({}));
        return res.status(groqRes.status).json({
          success: false,
          error: (errData as any)?.error?.message || 'فشل التحقق من مفتاح Groq.',
        });
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        message: 'تم التحقق من مفتاح Groq بنجاح! المزود متصل ويعمل بسرعة فائقة.',
        latencyMs,
        provider: 'groq',
        model: groqModel,
      });
    }

    if (provider === 'gemini') {
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          error: 'مفتاح Gemini API غير متوفر. يرجى توفيره أو ضبط GEMINI_API_KEY.',
        });
      }

      const client = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      let testModel = model;
      if (
        !testModel ||
        testModel.includes('2.5') ||
        testModel.includes('2.0') ||
        testModel.includes('1.5')
      ) {
        testModel = 'gemini-3.8-flash';
      }

      let response;
      try {
        response = await client.models.generateContent({
          model: testModel,
          contents: 'قل كلمة واحدة فقط: متصل',
        });
      } catch (err: any) {
        if (
          testModel !== 'gemini-3.8-flash' &&
          (err?.status === 404 ||
            err?.message?.includes('404') ||
            err?.message?.includes('not found') ||
            err?.message?.includes('no longer available'))
        ) {
          testModel = 'gemini-3.8-flash';
          response = await client.models.generateContent({
            model: testModel,
            contents: 'قل كلمة واحدة فقط: متصل',
          });
        } else {
          throw err;
        }
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        message: 'الاتصال بمزود Gemini يعمل بكفاءة عالية',
        latencyMs,
        provider: 'gemini',
        model: testModel,
        sampleOutput: response.text?.trim() || 'متصل',
      });
    }

    if (provider === 'openai') {
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'مفتاح OpenAI API مطلوب لفحص الاتصال.',
        });
      }

      const openAiRes = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!openAiRes.ok) {
        const errData = await openAiRes.json().catch(() => ({}));
        return res.status(openAiRes.status).json({
          success: false,
          error: (errData as any)?.error?.message || 'فشل التحقق من مفتاح OpenAI.',
        });
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        message: 'تم التحقق من مفتاح OpenAI بنجاح',
        latencyMs,
        provider: 'openai',
        model: model || 'gpt-4o-mini',
      });
    }

    if (provider === 'anthropic') {
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'مفتاح Anthropic API مطلوب لفحص الاتصال.',
        });
      }

      // Quick test call to Anthropic API
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say OK' }],
        }),
      });

      if (!anthropicRes.ok) {
        const errData = await anthropicRes.json().catch(() => ({}));
        return res.status(anthropicRes.status).json({
          success: false,
          error: (errData as any)?.error?.message || 'فشل التحقق من مفتاح Anthropic.',
        });
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        message: 'تم التحقق من مفتاح Anthropic بنجاح',
        latencyMs,
        provider: 'anthropic',
        model: model || 'claude-3-5-haiku',
      });
    }

    if (provider === 'custom') {
      const baseUrl = customBaseUrl;
      if (!baseUrl) {
        return res.status(400).json({ success: false, error: 'عنوان URL للمزود المخصص مطلوب.' });
      }

      const pingUrl = `${baseUrl.replace(/\/$/, '')}/models`;
      const customRes = await fetch(pingUrl, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });

      if (!customRes.ok) {
        return res.status(customRes.status).json({
          success: false,
          error: `فشل الاتصال بعنوان المزود (${customRes.statusText})`,
        });
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        message: 'تم الاتصال بنجاح بالمزود المخصص',
        latencyMs,
        provider,
        model: model || 'default',
      });
    }

    return res.status(400).json({ success: false, error: 'مزود غير معروف' });
  } catch (err: any) {
    console.error('Provider test error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'حدث خطأ أثناء فحص مزود الذكاء الاصطناعي.',
    });
  }
});

// Chat endpoint (Persona Chat with Osamu Dazai)
app.post('/api/ai/chat', async (req, res) => {
  try {
    let {
      message,
      persona = 'dazai',
      history = [],
      provider = 'gemini',
      apiKey,
      model,
      customBaseUrl,
      temperature = 0.85,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'الرسالة مطلوبة' });
    }

    // Auto-detect provider if key format strongly dictates provider
    const detected = detectProviderFromApiKey(apiKey);
    if (detected && detected !== provider) {
      provider = detected;
    }

    const systemPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.dazai;

    // 1. Groq provider
    if (provider === 'groq') {
      if (!apiKey) {
        return res.status(400).json({ error: 'مفتاح Groq API مطلوب' });
      }

      let groqModel = normalizeGroqModel(model);
      const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      let groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: messagesPayload,
          temperature: Number(temperature) || 0.85,
          max_tokens: 600,
        }),
      });

      // Fallback if model not found
      if (!groqRes.ok && groqRes.status === 404 && groqModel !== 'openai/gpt-oss-120b') {
        groqModel = 'openai/gpt-oss-120b';
        groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: messagesPayload,
            temperature: Number(temperature) || 0.85,
            max_tokens: 600,
          }),
        });
      }

      if (!groqRes.ok) {
        const errData = await groqRes.json().catch(() => ({}));
        throw new Error((errData as any)?.error?.message || 'خطأ في استجابة Groq');
      }

      const data = await groqRes.json();
      return res.json({
        reply: data.choices?.[0]?.message?.content || '...',
        provider: 'groq',
        model: groqModel,
      });
    }

    // 2. If provider is Gemini or default
    if (provider === 'gemini' || (!provider && (apiKey || process.env.GEMINI_API_KEY))) {
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({ error: 'مفتاح Gemini API غير متوفر' });
      }

      const client = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      let selectedModel = model;
      if (
        !selectedModel ||
        selectedModel.includes('2.5') ||
        selectedModel.includes('2.0') ||
        selectedModel.includes('1.5')
      ) {
        selectedModel = 'gemini-3.8-flash';
      }

      // Format conversation contents for Gemini
      const formattedContents: any[] = [];
      for (const item of history.slice(-6)) {
        formattedContents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }],
        });
      }
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      let response;
      const executeGemini = async (key: string) => {
        const client = new GoogleGenAI({
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        try {
          return await client.models.generateContent({
            model: selectedModel,
            contents: formattedContents,
            config: {
              systemInstruction: systemPrompt,
              temperature: Number(temperature) || 0.85,
            },
          });
        } catch (err: any) {
          if (
            selectedModel !== 'gemini-3.8-flash' &&
            (err?.status === 404 ||
              err?.message?.includes('404') ||
              err?.message?.includes('not found') ||
              err?.message?.includes('no longer available'))
          ) {
            selectedModel = 'gemini-3.8-flash';
            return await client.models.generateContent({
              model: selectedModel,
              contents: formattedContents,
              config: {
                systemInstruction: systemPrompt,
                temperature: Number(temperature) || 0.85,
              },
            });
          }
          throw err;
        }
      };

      try {
        response = await executeGemini(keyToUse);
      } catch (geminiErr: any) {
        console.warn('Gemini chat error:', geminiErr?.message);
        // If user key was invalid and we have server key, try server key!
        if (apiKey && process.env.GEMINI_API_KEY && apiKey.trim() !== process.env.GEMINI_API_KEY) {
          try {
            response = await executeGemini(process.env.GEMINI_API_KEY);
          } catch {
            // will proceed to fallback below
          }
        }
      }

      if (response && response.text) {
        return res.json({
          reply: response.text,
          provider: 'gemini',
          model: selectedModel,
        });
      }

      return res.json({
        reply: `يا صاحبي، أسمع صدى كلماتك في عتمة هذه الغرفة بطوكيو. إنّ الكلمات أحياناً تعجز عن الإحاطة بما في الوجدان، فاعذر صمتي القصير؛ فما كل شعورٍ يُقال باللسان، وأحياناً يكون الصمت أبلغ مراثي الروح.`,
        provider: 'gemini',
        model: selectedModel,
      });
    }

    // 2. OpenAI provider
    if (provider === 'openai') {
      if (!apiKey) {
        return res.status(400).json({ error: 'مفتاح OpenAI API مطلوب' });
      }

      const selectedModel = normalizeOpenAiModel(model);
      const isReasoning = selectedModel.startsWith('o1') || selectedModel.startsWith('o3');

      const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      const bodyPayload: any = {
        model: selectedModel,
        messages: messagesPayload,
      };

      if (isReasoning) {
        bodyPayload.max_completion_tokens = 800;
      } else {
        bodyPayload.temperature = Number(temperature) || 0.85;
        bodyPayload.max_tokens = 600;
      }

      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!openAiRes.ok) {
        const errData = await openAiRes.json().catch(() => ({}));
        throw new Error((errData as any)?.error?.message || 'خطأ في استجابة OpenAI');
      }

      const data = await openAiRes.json();
      return res.json({
        reply: data.choices?.[0]?.message?.content || '...',
        provider: 'openai',
        model: selectedModel,
      });
    }

    // 3. Anthropic provider
    if (provider === 'anthropic') {
      if (!apiKey) {
        return res.status(400).json({ error: 'مفتاح Anthropic API مطلوب' });
      }

      const selectedModel = normalizeAnthropicModel(model);

      const messagesPayload = [
        ...history.slice(-6).map((h: any) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        })),
        { role: 'user', content: message },
      ];

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          system: systemPrompt,
          max_tokens: 600,
          messages: messagesPayload,
          temperature: Number(temperature) || 0.85,
        }),
      });

      if (!anthropicRes.ok) {
        const errData = await anthropicRes.json().catch(() => ({}));
        throw new Error((errData as any)?.error?.message || 'خطأ في استجابة Anthropic');
      }

      const data = await anthropicRes.json();
      return res.json({
        reply: data.content?.[0]?.text || '...',
        provider: 'anthropic',
        model: selectedModel,
      });
    }

    // 5. Custom provider endpoint
    if (provider === 'custom') {
      const baseUrl = customBaseUrl;
      if (!baseUrl) {
        return res.status(400).json({ error: 'عنوان المزود المخصص مطلوب' });
      }

      const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      const customRes = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: model || 'llama-3.1-8b-instant',
          messages: messagesPayload,
          temperature: Number(temperature) || 0.85,
        }),
      });

      if (!customRes.ok) {
        const errData = await customRes.json().catch(() => ({}));
        throw new Error((errData as any)?.error?.message || 'خطأ في استجابة المزود المخصص');
      }

      const data = await customRes.json();
      return res.json({
        reply: data.choices?.[0]?.message?.content || '...',
        provider,
        model,
      });
    }

    return res.status(400).json({ error: 'مزود الذكاء الاصطناعي المحدد غير صالح' });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({
      error: err.message || 'حدث خطأ في معالجة المحادثة الأدبية.',
    });
  }
});

// Sanitizer to guarantee no prompt echoes, date strings, or meta-text leak into literary quotes
function cleanQuoteTextServer(text: string): string {
  if (!text) return '';
  let cleaned = String(text);
  cleaned = cleaned.replace(/شذرة اليوم الأدبية(?:\s*\([^)]*\))?\s*:?/gi, '');
  cleaned = cleaned.replace(/شذرة اليوم(?:\s*\([^)]*\))?\s*:?/gi, '');
  cleaned = cleaned.replace(/\(\s*\d{4}\s*-\s*\d{2}\s*-\s*(?:\(\s*)?\d{2}\s*\)?\s*\)/g, '');
  cleaned = cleaned.replace(/حين تلعثمتُ أمام حقيقة\s*["«'”][^"»'”]+["»'”]\.?/gi, 'حين واجهتُ حقيقة نفسي في المرآة.');
  cleaned = cleaned.replace(/أمام موضوع\s*[«"'][^»"']+[»"']\.?/gi, 'أمام صمت هذا الوجود.');
  cleaned = cleaned.replace(/لموضوع\s*[«"'][^»"']+[»"']\.?/gi, 'في هذا المساء الموحش.');
  cleaned = cleaned.replace(/في زوايا\s*["«'”][^"»'”]+["»'”]/gi, 'في زوايا هذا الليل');
  cleaned = cleaned.replace(/بين سطور\s*["«'”][^"»'”]+["»'”]/gi, 'بين سطور الذكريات العتيقة');
  cleaned = cleaned.replace(/["«'”]\s*["»'”]/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/:\s*\./g, '.');
  cleaned = cleaned.replace(/،\s*\./g, '.');
  return cleaned.trim();
}

// Generate new literary reflection in Dazai's style
app.post('/api/ai/generate-quote', async (req, res) => {
  let { topic = 'العزلة والمساء', provider = 'gemini', apiKey, model, customBaseUrl } = req.body;

  // Clean the topic of any date stamps or meta text
  const cleanTopic = String(topic || 'العزلة والمساء')
    .replace(/شذرة اليوم الأدبية(?:\s*\([^)]*\))?\s*:?/gi, '')
    .replace(/\(\s*\d{4}\s*-\s*\d{2}\s*-\s*\d{2}\s*\)/g, '')
    .replace(/[«»"']/g, '')
    .trim() || 'العزلة والمساء';

  // Auto-detect provider if key format strongly dictates provider
  const detected = detectProviderFromApiKey(apiKey);
  if (detected && detected !== provider) {
    provider = detected;
  }

  const prompt = `أنت الكاتب الياباني أوسامو دازاي (1909-1948)، صاحب الروح المعذبة والنظرة الوجودية الثاقبة، ومؤلف الروائع الخالدة: "لم أعد إنساناً"، "شمس الغروب"، "تسوغارو"، "اركض يا ميلوس"، "ذكريات"، ورائد جماعة البورايها في حانة لوبين بغينزا.

المطلوب:
اكتب شذرة أدبية فلسفية قصيرة بليغة (من سطر إلى 3 أسطر) باللغة العربية الفصحى الرفيعة، مستوحاة بعمق من عوالم كتبك وشخصيتك حول: "${cleanTopic}".

شروط أدبية صارمة:
1. استلهم النبرة والجو العام من أحد أعمالك الشهيرة:
   - "لم أعد إنساناً": قناع المهرج، الرعب من عيون البشر، الخجل من الضعف، الهروب في شوارع طوكيو.
   - "شمس الغروب": انحدار الأرستقراطية، جمال الزوال الصامت، رسائل الشفق، الشاي في إيزو، التمرد لعيش حياة حقيقية.
   - "تسوغارو": صقيع كاناغي وثلوج الشمال، الغربة وسط الأهل، حنان المربية تاكي ودفء الموقد.
   - "اركض يا ميلوس": صراع الوفاء بالعهد ضد غروب الشمس، الإيمان بالإنسان في اللحظة الأخيرة.
   - "بوهيمية حانة لوبين": السخرية المرّة من كآبة الحرب، المشي تحت المطر نحو نهر تاماجاوا.
2. ممنوع منعاً باتاً تكرار نص الفكرة أو الموضوع في نص الشذرة، ولا تضعه بين قوسين أو علامات تنصيص.
3. لا تذكر أي تواريخ أو عبارات إدارية مثل "شذرة اليوم" أو "حين تلعثمت أمام حقيقة كذا".
4. يجب أن تكون الشذرة نصاً أدبياً روائياً عارياً من أي زيف أو تصنع.

أخرج الإجابة بتنسيق JSON حصراً:
{
  "textAr": "نص الشذرة الأدبية بالعربية الفصحى (من 1 إلى 3 أسطر)",
  "textJp": "جملة يابانية مقتضبة بالكانجي والكانجي الياباني الأصلي",
  "reflection": "تأمل فلسفي نفسي مقتضب في سطر واحد يشرح وجع العبارة",
  "source": "اسم الكتاب أو المصدر (مثلاً: لم أعد إنساناً، أو شمس الغروب، أو تسوغارو، أو حانة لوبين)",
  "chapter": "اسم الفصل أو السياق (مثلاً: المذكرة الأولى، أو أوراق الشفق، أو دفاتر الثلج)",
  "category": "solitude"
}`;

  try {
    // 1. Groq quote generation
    if (provider === 'groq') {
      const groqKey = (apiKey && apiKey.trim()) || process.env.GROQ_API_KEY;
      if (groqKey) {
        const groqModel = normalizeGroqModel(model);
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: groqModel,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 500,
            temperature: 0.85,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content);
          return res.json({
            success: true,
            quote: {
              id: `gen-${Date.now()}`,
              textAr: cleanQuoteTextServer(parsed.textAr || 'في صمت الوحدة، تدرك الروح أن الخوف من خيبة أمل الآخرين هو أثقل القيود.'),
              textJp: parsed.textJp || '孤独の静けさの中で、存在は内なる視線だけで書かれる。',
              reflection: cleanQuoteTextServer(parsed.reflection || 'الهروب ليس جبناً دائماً، بل أحياناً يكون الطريقة الوحيدة لحماية ما تبقى من براءة.'),
              source: parsed.source || 'شذرات طوكيو المتأخرة',
              chapter: 'أوراق الشوا',
              category: parsed.category || 'solitude',
              tags: ['تأمل أدبي', 'دازاي', 'أدب ياباني'],
              year: 1948,
              readingTimeSec: 15,
            },
          });
        }
      }
    }

    // 2. OpenAI quote generation
    if (provider === 'openai') {
      const openKey = apiKey && apiKey.trim();
      if (openKey) {
        const selectedModel = normalizeOpenAiModel(model);
        const isReasoning = selectedModel.startsWith('o1') || selectedModel.startsWith('o3');

        const bodyPayload: any = {
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        };

        if (isReasoning) {
          bodyPayload.max_completion_tokens = 600;
        } else {
          bodyPayload.max_tokens = 500;
          bodyPayload.temperature = 0.85;
        }

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openKey}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const content = data.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content);
          return res.json({
            success: true,
            quote: {
              id: `gen-${Date.now()}`,
              textAr: cleanQuoteTextServer(parsed.textAr || 'كلما أغلقتُ بابي على وحشتي، أحسست بذاك العبء الخفي لوجودي ينجلي رويداً.'),
              textJp: parsed.textJp || '人間失格の影に生きて、黄昏の風を聞く。',
              reflection: cleanQuoteTextServer(parsed.reflection || 'ما أرق هذا الحزن حين يسكن ثنايا المساء.'),
              source: parsed.source || 'شذرات طوكيو',
              chapter: 'أوراق الشوا',
              category: parsed.category || 'solitude',
              tags: ['تأمل أدبي', 'دازاي', 'أدب ياباني'],
              year: 1948,
              readingTimeSec: 15,
            },
          });
        }
      }
    }

    // 3. Anthropic quote generation
    if (provider === 'anthropic') {
      const anthroKey = apiKey && apiKey.trim();
      if (anthroKey) {
        const selectedModel = normalizeAnthropicModel(model);
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthroKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            system: 'أنت أوسامو دازاي. أخرج الإجابة بتنسيق JSON حصراً بدون أي كود ماركداون.',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.85,
          }),
        });

        if (anthropicRes.ok) {
          const data = await anthropicRes.json();
          const text = data.content?.[0]?.text || '{}';
          const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);
          return res.json({
            success: true,
            quote: {
              id: `gen-${Date.now()}`,
              textAr: cleanQuoteTextServer(parsed.textAr || 'في عتمة الغرفة، ينام خوفنا الدفين من انكشاف الروح أمام أعين المارة.'),
              textJp: parsed.textJp || '仮面を脱いだ夜、心は静かに震える。',
              reflection: cleanQuoteTextServer(parsed.reflection || 'نبتسم للعالم لكي لا يروا رجفة أيدينا.'),
              source: parsed.source || 'دفاتر ميتسوشيما',
              chapter: 'شمس الغروب',
              category: parsed.category || 'melancholy',
              tags: ['تأمل أدبي', 'دازاي', 'أدب ياباني'],
              year: 1948,
              readingTimeSec: 15,
            },
          });
        }
      }
    }

    // 4. Custom endpoint quote generation
    if (provider === 'custom' && customBaseUrl) {
      const customKey = apiKey && apiKey.trim();
      const customRes = await fetch(`${customBaseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { Authorization: `Bearer ${customKey}` } : {}),
        },
        body: JSON.stringify({
          model: model || 'default',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.85,
        }),
      });

      if (customRes.ok) {
        const data = await customRes.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.json({
          success: true,
          quote: {
            id: `gen-${Date.now()}`,
            textAr: cleanQuoteTextServer(parsed.textAr || 'بين سطور المساء، تبقى الحقيقة الوحيدة أننا نبحث عن أمان لا ينقضي.'),
            textJp: parsed.textJp || '孤独の静けさの中で。',
            reflection: cleanQuoteTextServer(parsed.reflection || 'الصمت أصدق من ألف كلمة مجاملة.'),
            source: parsed.source || 'شذرات طوكيو',
            chapter: 'أوراق الشوا',
            category: parsed.category || 'solitude',
            tags: ['تأمل أدبي', 'دازاي', 'أدب ياباني'],
            year: 1948,
            readingTimeSec: 15,
          },
        });
      }
    }

    // 5. Gemini quote generation (default)
    let keyToUse = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY;

    if (keyToUse) {
      const runGemini = async (key: string) => {
        const client = new GoogleGenAI({
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        let selectedModel = model;
        if (
          !selectedModel ||
          selectedModel.includes('2.5') ||
          selectedModel.includes('2.0') ||
          selectedModel.includes('1.5')
        ) {
          selectedModel = 'gemini-3.8-flash';
        }

        try {
          return await client.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });
        } catch (err: any) {
          if (selectedModel !== 'gemini-3.8-flash') {
            return await client.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' },
            });
          }
          throw err;
        }
      };

      try {
        const response = await runGemini(keyToUse);
        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          success: true,
          quote: {
            id: `gen-${Date.now()}`,
            textAr: cleanQuoteTextServer(parsed.textAr || 'في نهاية المطاف، كل ما كنت أرجوه هو ألا ينتبه أحد لوجودي المتعثر.'),
            textJp: parsed.textJp || '人間失格の影に生きて、黄昏の風を聞く。',
            reflection: cleanQuoteTextServer(parsed.reflection || 'الهروب ليس جبناً دائماً، بل أحياناً يكون الطريقة الوحيدة لحماية ما تبقى من براءة.'),
            source: parsed.source || 'شذرات طوكيو المتأخرة',
            chapter: 'أوراق الشوا',
            category: parsed.category || 'solitude',
            tags: ['تأمل أدبي', 'دازاي', 'أدب ياباني'],
            year: 1948,
            readingTimeSec: 15,
          },
        });
      } catch {
        // Safe fallback if primary key fails
        if (apiKey && process.env.GEMINI_API_KEY && apiKey.trim() !== process.env.GEMINI_API_KEY) {
          try {
            const fallbackResponse = await runGemini(process.env.GEMINI_API_KEY);
            const parsed = JSON.parse(fallbackResponse.text || '{}');
            return res.json({
              success: true,
              quote: {
                id: `gen-${Date.now()}`,
                textAr: cleanQuoteTextServer(parsed.textAr || 'في نهاية المطاف، كل ما كنت أرجوه هو ألا ينتبه أحد لوجودي المتعثر.'),
                textJp: parsed.textJp || '人間失格の影に生きて、黄昏の風を聞く。',
                reflection: cleanQuoteTextServer(parsed.reflection || 'الهروب ليس جبناً دائماً، بل أحياناً يكون الطريقة الوحيدة لحماية ما تبقى من براءة.'),
                source: parsed.source || 'شذرات طوكيو المتأخرة',
                chapter: 'أوراق الشوا',
                category: parsed.category || 'solitude',
                tags: ['تأمل أدبي', 'دازاي', 'أدب ياباني'],
                year: 1948,
                readingTimeSec: 15,
              },
            });
          } catch {
            // continue to pure Dazai literary fallback
          }
        }
      }
    }

    // 6. Authentic Literary Fallback Collection across Osamu Dazai's iconic books & persona
    const literaryDazaiPool = [
      // لم أعد إنساناً
      {
        ar: 'طوال حياتي كنت أرتدي قناع المهرج لأضحك الناس، حتى نسيت الملامح التي وُلدت بها خلف هذا الطلاء.',
        jp: '人間失格、道化を演じて生きる哀しみ。',
        ref: 'أشد أنواع الوجع هو أن تبتسم أمام الجميع لكي تخفي خوفك القاتل من إنسانيتك.',
        src: 'لم أعد إنساناً',
        ch: 'المذكرة الأولى',
        cat: 'existence',
      },
      {
        ar: 'ما كنتُ أخشاه قط هو الموت، بل نظرة العتاب الهادئة في عيون من أحسنوا الظن بي حين عجزتُ عن التظاهر بالقوة.',
        jp: '私は死を恐れたのではない。信じてくれた人の静かな視線を恐れたのだ。',
        ref: 'الخوف من خيبة أمل الآخرين هو أشد القيود التي تثقل كاهل الروح الهشة.',
        src: 'لم أعد إنساناً',
        ch: 'المذكرة الثانية',
        cat: 'relationships',
      },
      {
        ar: 'حين أغلقتُ باب غرفتي في طوكيو، أدركتُ أن العزلة ليست عقاباً، بل هي المرآة الوحيدة التي ترفض أن تجاملك.',
        jp: '孤独は鏡のごとく、偽りのない魂の傷を映し出す。',
        ref: 'في مواجهة الصمت التام، يسقط قناعك حتى لو تشبثت به بقبضة يدك المرتجفة.',
        src: 'لم أعد إنساناً',
        ch: 'المذكرة الثالثة',
        cat: 'solitude',
      },
      // شمس الغروب
      {
        ar: 'شمس الغروب الشاحبة لا تنذر بالظلام، بل تعلن أن الأشياء الجميلة وحدها تعرف كيف تنطفئ بهدوء نبيل.',
        jp: '夕陽の影に消えゆく美しきものたち。',
        ref: 'في كل نهاية تكمن سكينة غامضة لا يفهمها من يركض خلف بريق البقاء الزائف.',
        src: 'شمس الغروب',
        ch: 'أوراق الشفق',
        cat: 'faint_hope',
      },
      {
        ar: 'نحن لسنا أرستقراطيين لأننا نملك المال، بل لأننا نحتفظ برقة قلوبنا حتى ونحن نسقط نحو القاع.',
        jp: '真の貴族とは、滅びゆく中にあってなお気高き心を失わぬ者のことだ。',
        ref: 'النبل الحقيقي لا يُشترى، بل يلمع في الصبر الأنيق عند حطام الآمال.',
        src: 'شمس الغروب',
        ch: 'رسائل ناوجي',
        cat: 'existence',
      },
      {
        ar: 'لقد ولدتُ لأحب وأتمرد، والموت في سبيل ما نحب أهون ألف مرة من البقاء في أسر الأقنعة البالية.',
        jp: '愛するために、戦うために、私は生まれてきたのだ。',
        ref: 'التمرد الصادق هو الشكل الأسمى لحب الحياة رغم كل خيباتها.',
        src: 'شمس الغروب',
        ch: 'بوح كازوكو',
        cat: 'faint_hope',
      },
      // تسوغارو
      {
        ar: 'في صقيع الشمال البعيد، تساقطت الثلوج على بيتنا القديم في كاناغي، فأحسست أن قلبي ما زال عالقاً تحت ذلك البياض البارد.',
        jp: '津軽の雪の下に、少年の日の記憶は今も凍りついている。',
        ref: 'مسقط الرأس جرح لا يندمل؛ كلما ابتعدت عنه ناداك صوته في ليالي الشتاء.',
        src: 'تسوغارو والشمال البارد',
        ch: 'طريق كاناغي',
        cat: 'solitude',
      },
      {
        ar: 'حين جلستُ إلى جوار الموقد الريفي واحتسيت فنجان الشاي مع العجوز، تلاشت كل تعقيدات طوكيو وكأنها لم تكن.',
        jp: '囲炉裏の温もりに、都会の偽善は跡形もなく消え去る。',
        ref: 'البساطة الصادقة تشفي ما تعجز أرقى الفلسفات عن مداواته.',
        src: 'تسوغارو والشمال البارد',
        ch: 'دفء الموقد',
        cat: 'relationships',
      },
      // اركض يا ميلوس
      {
        ar: 'حتى لو انقطعت أنفاسي وخرّت قواي، سأركض؛ ليس طلباً للحياة، بل لكي أثبت أن الصداقة والوفاء لم يموتا في هذا العالم.',
        jp: '友のために走る。信実がまだこの世にあることを証明するために。',
        ref: 'الأمانة ليست واجباً ثقيلاً، بل هي النور الأخير الذي يمنع الروح من السقوط في العتمة.',
        src: 'اركض يا ميلوس',
        ch: 'السباق مع الغروب',
        cat: 'relationships',
      },
      // بوهيمية حانة لوبين
      {
        ar: 'في حانة لوبين بغينزا، كان الدخان يرتفع ليعانق وجوهنا الشاحبة، وكنا نضحك بسخرية لكي نخفي رجفة أكفّنا المنهكة.',
        jp: 'ルパンの止まり木で、私たちは絶望を笑いに変えて飲み干した。',
        ref: 'السخرية البوهيمية لم تكن استهانة بالألم، بل كانت السلاح الوحيد لمواجهته.',
        src: 'شخصية دازاي وبوهيمية حانة لوبين',
        ch: 'ليالي غينزا',
        cat: 'existence',
      },
      {
        ar: 'نهر تاماجاوا يجري في الليل بهدوء لا يبالي بأحزاننا، وكم تمنيت لو كانت كلماتي شفافة ومستكينة كتلك المياه.',
        jp: '玉川の静寂に、人の嘆きは吸い込まれてゆく。',
        ref: 'الطبيعة لا تعاتبنا على ضعفنا، بل تستقبل انكسارنا دون سؤال.',
        src: 'شخصية دازاي وبوهيمية حانة لوبين',
        ch: 'ضفاف تاماجاوا',
        cat: 'solitude',
      },
      // ذكريات وأوراق الشوا
      {
        ar: 'كنت صبياً خجولاً يخشى صوته في الممرات، فتعلمت أن أخطّ وجعي على هوامش دفاتري قبل أن تمحوها الأيام.',
        jp: '少年の日の恥じらいは、今もノートの余白に微かに息づいている。',
        ref: 'خجل البدايات هو النبع الذي تتدفق منه أصدق الاعترافات الأدبية.',
        src: 'ذكريات وأوراق الشوا',
        ch: 'مذكرات الصبا',
        cat: 'letters',
      },
    ];

    // Pick a varied quote based on topic or random rotation
    let hash = 0;
    for (let i = 0; i < cleanTopic.length; i++) hash += cleanTopic.charCodeAt(i);
    hash += Date.now();
    const chosen = literaryDazaiPool[hash % literaryDazaiPool.length];

    return res.json({
      success: true,
      quote: {
        id: `gen-dazai-${Date.now()}`,
        textAr: cleanQuoteTextServer(chosen.ar),
        textJp: chosen.jp,
        reflection: cleanQuoteTextServer(chosen.ref),
        source: chosen.src,
        chapter: chosen.ch,
        category: chosen.cat,
        tags: ['أوسامو دازاي', chosen.src, 'أدب ياباني'],
        year: 1948,
        readingTimeSec: 15,
      },
    });
  } catch {
    return res.json({
      success: true,
      quote: {
        id: `gen-dazai-${Date.now()}`,
        textAr: 'كلما حاولت أن أكون كما ينتظر مني العالم، شعرت بأنني أتلاشى كبخار قطار المساء في محطة مهجورة لا يلتفت إليها أحد.',
        textJp: '夕暮れの駅で、人は己の影さえ見失う。仮面の重さに耐えかねて。',
        reflection: 'الصدق مع الضعف الداخلي هو الشكل الوحيد للنجاة حين يثقل القناع كاهل صاحبه.',
        source: 'لم أعد إنساناً',
        chapter: 'أوراق الشوا',
        category: 'solitude',
        tags: ['أوسامو دازاي', 'تأمل أدبي', 'لم أعد إنساناً'],
        year: 1948,
        readingTimeSec: 15,
      },
    });
  }
});

// Setup Vite middlewares in development or serve static build
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dazai app server running on http://0.0.0.0:${PORT}`);
});
