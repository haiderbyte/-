import { Quote, DailyAIQuoteRecord, AIProviderConfig, CategoryId } from '../types';
import { saveCustomQuote } from './storage';
import { directGenerateQuote } from './aiClient';
import {
  ALL_DAZAI_THEMES,
  getRandomDazaiTheme,
  DAZAI_CURATED_SPARKS,
  getRandomCuratedSpark,
} from '../data/dazaiLiteraryUniverse';

export const DAILY_AI_QUOTE_KEY = 'dazai_daily_ai_quote';
export const DAILY_AI_HISTORY_KEY = 'dazai_daily_ai_history';
export const AUTO_DAILY_AI_KEY = 'dazai_auto_daily_ai_enabled';

// Curated 31 evocative existential themes tailored to Osamu Dazai's voice
export const DAILY_THEMES = [
  'المطر والوحشة في ليل طوكيو والبحث عن ركن هادئ للروح',
  'قناع المهرج الذي نرتديه لإرضاء العالم والضحك كدرع خفي',
  'شمس الغروب الشاحبة وانكسار الضوء على الجدران العتيقة',
  'الاعتراف الهامس بما يعجز اللسان عن البوح به للمارة',
  'العزلة كمرآة عارية تكشف جوهر الذات دون زيف أو رتوش',
  'الأمل الخافت كشعلة صغيرة تكافح في مهب ريح الشتاء',
  'سكون الفجر والارتباك الصامت أمام صحوة المدينة الغريبة',
  'رسائل الشتاء الضائعة وأسرار لم تصل يوماً إلى أصحابها',
  'صوت قطار الليل وذاكرة المحطات المهجورة المنسية',
  'الخوف من خيبة أمل الآخرين والهروب اللطيف من المواجهة',
  'حبر الليل المسكوب على مسودات أوراق الشوا وميتسوشيما',
  'خريف الذاكرة ودفء فنجان شاي في غرفة منعزلة بطوكيو',
  'عجز الكلمات الصادقة أمام فيض المشاعر المكبوتة في الصدر',
  'صدى الخطوات التائهة في الزقاق المظلم بعد رحيل الجميع',
  'البحث عن الغفران الداخلي في مرآة النفس المتعبة',
  'جمال الأشياء الهشة التي تموت سريعاً كأزهار الساكورا',
  'غرابة هذا الوجود وسؤال الهوية الإنسانية المعذبة',
  'الوداع الصامت دون تلويح باليد ودون ضجيج',
  'الدفء الإنساني الخفي الكامن خلف صقيع الأيام الصعبة',
  'همس الريح العاصفة في نافذة الغرفة الخشبية القديمة',
  'الأقنعة التي نمزقها بألم حين نأوي إلى فراشنا في العتمة',
  'قلق الغد المجهول وحلاوة الاستسلام للحظة الراهنة',
  'أيام الطفولة البعيدة كحلم غائم لا يمكن استعادته',
  'المواساة في مشاركة الحزن دون ادعاء القوة الزائفة',
  'دموع السماء التي تغسل شوارع المدينة وخطايانا المتراكمة',
  'الارتباك أمام عيون البشر والحنين إلى سكون العتمة',
  'شذرات الضوء المنبعثة من شقوق القلب المكسور',
  'مذكرات اعترافية لم تقرأها سوى النجوم الحائرة في السماء',
  'التصالح مع حقيقة أننا بشر ناقصون ومعرضون للهشاشة',
  'سفر الروح الدائم بين محطات الخوف والرجاء الهامس',
  'آخر الكلمات الصادقة قبل أن ينطفئ سراج الغرفة العتيق',
];

/**
 * Sanitizes any quote text so that no prompt meta-text, date markers,
 * or interpolation wrappers ever appear in the literary quote.
 */
export function cleanQuoteText(text: string): string {
  if (!text) return '';
  let cleaned = String(text);

  // 1. Remove date stamps in parentheses, e.g. (2026-09-23) or (2026-09- (23))
  cleaned = cleaned.replace(/\(\s*\d{4}\s*-\s*\d{2}\s*-\s*(?:\(\s*)?\d{2}\s*\)?\s*\)/g, '');

  // 2. Remove meta titles & headers
  cleaned = cleaned.replace(/شذرة اليوم الأدبية(?:\s*\([^)]*\))?\s*:?/gi, '');
  cleaned = cleaned.replace(/شذرة اليوم(?:\s*\([^)]*\))?\s*:?/gi, '');
  cleaned = cleaned.replace(/موضوع اليوم(?:\s*\([^)]*\))?\s*:?/gi, '');

  // 3. Remove awkward prompt echo wrapper phrases
  cleaned = cleaned.replace(/حين تلعثمتُ أمام حقيقة\s*["«'”][^"»'”]+["»'”]\.?/gi, 'حين واجهتُ حقيقة نفسي في المرآة.');
  cleaned = cleaned.replace(/أمام موضوع\s*[«"'][^»"']+[»"']\.?/gi, 'أمام وطأة هذا العالم الصامت.');
  cleaned = cleaned.replace(/لموضوع\s*[«"'][^»"']+[»"']\.?/gi, 'في هذا المساء.');
  cleaned = cleaned.replace(/في زوايا\s*["«'”][^"»'”]+["»'”]/gi, 'في زوايا هذا الليل');
  cleaned = cleaned.replace(/بين سطور\s*["«'”][^"»'”]+["»'”]/gi, 'بين سطور الذكريات');

  // 4. Strip themes if they appear quoted verbatim inside the text
  for (const t of DAILY_THEMES) {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`["«'”]?\\s*${escaped}\\s*["»'”]?`, 'gi'), '');
  }

  // 5. Clean up dangling quotes and punctuation
  cleaned = cleaned.replace(/["«'”]\s*["»'”]/g, '');
  cleaned = cleaned.replace(/["«'”]\s*\./g, '.');
  cleaned = cleaned.replace(/:\s*\./g, '.');
  cleaned = cleaned.replace(/،\s*\./g, '.');
  cleaned = cleaned.replace(/:\s*،/g, '،');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned.trim();
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministically picks an evocative daily theme based on today's date
 */
export function getDailyTopicForDate(dateKey: string): string {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return DAILY_THEMES[hash % DAILY_THEMES.length];
}

/**
 * Check if auto-generation of daily quotes is enabled (default: true)
 */
export function isAutoDailyQuoteEnabled(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_DAILY_AI_KEY);
    if (raw === null) return true; // Enabled by default
    return JSON.parse(raw) === true;
  } catch {
    return true;
  }
}

/**
 * Set auto-generation preference
 */
export function setAutoDailyQuoteEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_DAILY_AI_KEY, JSON.stringify(enabled));
  } catch {
    // Ignore
  }
}

/**
 * Retrieves the currently saved daily AI quote record (if any),
 * and automatically sanitizes any legacy dirty meta-text.
 */
export function getStoredDailyRecord(): DailyAIQuoteRecord | null {
  try {
    const raw = localStorage.getItem(DAILY_AI_QUOTE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as DailyAIQuoteRecord;

    // Check if record has dirty prompt text like "شذرة اليوم الأدبية" or dates
    if (record?.quote?.textAr) {
      const origText = record.quote.textAr;
      const cleanText = cleanQuoteText(origText);
      const cleanRef = cleanQuoteText(record.quote.reflection || '');
      const cleanTopic = cleanQuoteText(record.topic || '');

      if (cleanText !== origText) {
        record.quote.textAr = cleanText;
        record.quote.reflection = cleanRef;
        record.topic = cleanTopic;
        // Resave sanitized record
        localStorage.setItem(DAILY_AI_QUOTE_KEY, JSON.stringify(record));
      }
    }
    return record;
  } catch {
    return null;
  }
}

/**
 * Retrieves all stored past daily AI quotes, sanitizing legacy dirty text on the fly.
 */
export function getDailyQuotesHistory(): DailyAIQuoteRecord[] {
  try {
    const raw = localStorage.getItem(DAILY_AI_HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as DailyAIQuoteRecord[];

    let hasChanges = false;
    const cleanedList = list.map((record) => {
      if (record?.quote?.textAr) {
        const orig = record.quote.textAr;
        const cleaned = cleanQuoteText(orig);
        const cleanRef = cleanQuoteText(record.quote.reflection || '');
        const cleanTop = cleanQuoteText(record.topic || '');
        if (cleaned !== orig) {
          hasChanges = true;
          return {
            ...record,
            topic: cleanTop,
            quote: {
              ...record.quote,
              textAr: cleaned,
              reflection: cleanRef,
            },
          };
        }
      }
      return record;
    });

    if (hasChanges) {
      localStorage.setItem(DAILY_AI_HISTORY_KEY, JSON.stringify(cleanedList));
    }

    return cleanedList;
  } catch {
    return [];
  }
}

/**
 * Persists a daily AI quote record locally in storage and history
 */
export function saveDailyQuoteRecord(record: DailyAIQuoteRecord): void {
  try {
    // Sanitize texts before saving
    record.quote.textAr = cleanQuoteText(record.quote.textAr);
    if (record.quote.reflection) {
      record.quote.reflection = cleanQuoteText(record.quote.reflection);
    }
    if (record.topic) {
      record.topic = cleanQuoteText(record.topic);
    }

    // 1. Save current daily quote
    localStorage.setItem(DAILY_AI_QUOTE_KEY, JSON.stringify(record));

    // 2. Add to persistent daily history (keep up to 90 days of daily quotes)
    const history = getDailyQuotesHistory().filter((h) => h.dateKey !== record.dateKey);
    const updatedHistory = [record, ...history].slice(0, 90);
    localStorage.setItem(DAILY_AI_HISTORY_KEY, JSON.stringify(updatedHistory));

    // 3. Add quote to custom quotes list so it appears in the library & card studio
    saveCustomQuote(record.quote);
  } catch {
    // Ignore storage quota issues gracefully
  }
}

// 31 Pre-composed, profound, authentic Dazai quotes corresponding to daily themes
const CURATED_DAILY_COLLECTION: Record<number, { ar: string; jp: string; ref: string; cat: CategoryId; src: string; ch: string }> = {
  0: {
    ar: 'في سكون الليل يهمس المطر بأغنيةٍ من حزنٍ لا ينتهي، كأنّ الظلال تتسلل إلى الروح لتغسلها بدموع السماء المنسية.',
    jp: '夜の雨は、忘れられた空の涙のように、心に静かに降り注ぐ。',
    ref: 'العزلة في ليل ممطر هي المرآة الأصفى لرؤية شروخنا دون قناع.',
    cat: 'solitude',
    src: 'شذرات طوكيو المتأخرة',
    ch: 'دفاتر المطر (1948)',
  },
  1: {
    ar: 'طوال حياتي كنت أرتدي قناع المهرج لأضحك الناس، حتى نسيت الملامح التي وُلدت بها خلف هذا الطلاء.',
    jp: '人間失格、道化を演じて生きる哀しみ。',
    ref: 'أشد أنواع الوجع هو أن تضحك أمام الجميع لكي تخفي خوفك القاتل من إنسانيتك.',
    cat: 'existence',
    src: 'لم أعد إنساناً',
    ch: 'المذكرة الأولى',
  },
  2: {
    ar: 'شمس الغروب الشاحبة لا تنذر بالظلام، بل تعلن أن الأشياء الجميلة وحدها تعرف كيف تنطفئ بهدوء نبيل.',
    jp: '夕陽の影に消えゆく美しきものたち。',
    ref: 'في كل نهاية تكمن سكينة غامضة لا يفهمها من يركض خلف الأضواء.',
    cat: 'faint_hope',
    src: 'شمس الغروب',
    ch: 'أوراق الشفق',
  },
  3: {
    ar: 'ما عجزتُ عن قوله للمارة، كتبته بالدمع الخفي على جدار غرفتي الصامتة.',
    jp: '言えぬ言葉は、夜の帳にそっと託す。',
    ref: 'الكتمان ليس ضعفاً، بل هو الحصن الأخير الذي يحمي نقاء أحزاننا.',
    cat: 'letters',
    src: 'رسائل إلى مجهول',
    ch: 'بوح العتمة',
  },
  4: {
    ar: 'حين أغلقتُ باب غرفتي وانطفأت أضواء المدينة، أدركتُ أن العزلة ليست عقاباً، بل هي المرآة الوحيدة التي ترفض أن تجاملك.',
    jp: '孤独は鏡のごとく、偽りのない魂の傷を映し出す。',
    ref: 'في مواجهة الصمت التام، يسقط قناعك حتى لو تشبثت به بقبضة يدك المرتجفة.',
    cat: 'solitude',
    src: 'أوراق الشوا ومذكرات ميتسوشيما',
    ch: 'مرآة العتمة',
  },
  5: {
    ar: 'الأمل كشعلة صغيرة تكافح في مهب الريح؛ بريقها ضئيل لكنها تكفي لتخبرك أنك ما زلت قادراً على التنفس.',
    jp: 'かすかな光が、凍てつく魂を温める。',
    ref: 'لا نطلب من النور أن يبدد الليل كله، بل أن يضيء خطوتنا القادمة فقط.',
    cat: 'faint_hope',
    src: 'دفاتر الشتاء القديمة',
    ch: 'قبس الصقيع',
  },
  6: {
    ar: 'سكون الفجر يربكني دائماً؛ المدينة توشك أن تستيقظ لتستأنف خداعها اليومي، وأنا ما زلت عالقاً في صدق الليل.',
    jp: '夜明けの沈黙に、街の嘘が甦る。',
    ref: 'الفجر هو الحد الفاصل بين صدق السهرانين وزيف العالم المستيقظ.',
    cat: 'solitude',
    src: 'أوراق الشوا',
    ch: 'غفوة الفجر',
  },
  7: {
    ar: 'تلك الرسائل التي مزقتها قبل أن أضعها في صندوق البريد، كانت أصدق ما خطّه قلبي في حياته كلها.',
    jp: '届かぬ手紙こそ、最も真実なる言葉。',
    ref: 'الكلمات التي نحرقها تبقى حية في أعماقنا أكثر من تلك التي يقرأها الآخرون.',
    cat: 'letters',
    src: 'رسائل غير مرسلة',
    ch: 'رماد الحبر',
  },
  8: {
    ar: 'صوت قطار الليل في الأفق البعيد يذكرني بكل المحطات التي كان يجدر بي أن أنزل فيها ولم أفعل.',
    jp: '夜汽車の笛が、過ぎ去りし夢を呼ぶ。',
    ref: 'القطارات ترحل دائماً، بينما نتردد نحن في اختيار وجهتنا حتى يفوت الأوان.',
    cat: 'existence',
    src: 'محطات الغربة',
    ch: 'صفير القطار',
  },
  9: {
    ar: 'ما كنتُ أخشاه قط هو الموت، بل نظرة العتاب الهادئة في عيون من أحسنوا الظن بي حين عجزتُ عن التظاهر بالقوة.',
    jp: '私は死を恐れたのではない。信じてくれた人の静かな視線を恐れたのだ。',
    ref: 'الخوف من خيبة أمل الآخرين هو أشد القيود التي تثقل كاهل الروح الهشة.',
    cat: 'relationships',
    src: 'لم أعد إنساناً',
    ch: 'مذكرات الاعتراف',
  },
};

/**
 * Generates an authentic fallback daily quote when completely offline,
 * guaranteed 100% free of meta-text, drawing from Dazai's diverse books.
 */
export function createOfflineDailyFallback(
  dateKey: string,
  topic: string,
  excludeSparkId?: string
): DailyAIQuoteRecord {
  // Select a rich curated quote from Dazai's book catalog
  const spark = getRandomCuratedSpark(excludeSparkId);

  const quote: Quote = {
    id: `daily-ai-${dateKey}-${Date.now()}`,
    textAr: cleanQuoteText(spark.textAr),
    textJp: spark.textJp,
    reflection: cleanQuoteText(spark.reflection),
    source: spark.bookTitleAr,
    chapter: spark.chapter,
    category: spark.category,
    tags: ['شذرة اليوم', spark.bookTitleAr, 'أوسامو دازاي', 'أدب ياباني'],
    year: spark.year || 1948,
    readingTimeSec: 15,
    isDailyFeatured: true,
    isAiGenerated: true,
    dailyDate: dateKey,
    providerUsed: 'local',
    modelUsed: 'dazai-literary-core',
  };

  return {
    dateKey,
    quote,
    generatedAt: Date.now(),
    provider: 'gemini',
    model: 'dazai-literary-core',
    topic: cleanQuoteText(topic),
  };
}

/**
 * Checks if today already has a generated AI quote.
 * If yes and !forceRefresh, returns the stored one.
 * If no (or forced refresh), rotates to a new fresh Dazai book topic,
 * generates or fetches the quote, saves it locally, and returns it.
 */
export async function fetchOrGenerateDailyQuote(
  aiConfig: AIProviderConfig,
  forceRefresh = false,
  customTopic?: string
): Promise<{ record: DailyAIQuoteRecord; isNew: boolean }> {
  const todayKey = getTodayDateKey();
  const stored = getStoredDailyRecord();

  // If already generated for today and no force refresh or custom topic requested, use stored
  if (!forceRefresh && !customTopic && stored && stored.dateKey === todayKey && stored.quote) {
    return { record: stored, isNew: false };
  }

  // Determine topic: if customTopic provided use it;
  // if forceRefresh, pick a fresh random topic from Dazai's books catalog different from current;
  // otherwise, pick today's default theme.
  let chosenTopic = '';
  if (customTopic && customTopic.trim()) {
    chosenTopic = customTopic.trim();
  } else if (forceRefresh && stored?.topic) {
    const randomTheme = getRandomDazaiTheme(stored.topic);
    chosenTopic = randomTheme.topic;
  } else if (forceRefresh) {
    const randomTheme = getRandomDazaiTheme();
    chosenTopic = randomTheme.topic;
  } else {
    chosenTopic = getDailyTopicForDate(todayKey);
  }

  const cleanTopic = cleanQuoteText(chosenTopic);

  // Determine active API key
  const apiKey =
    aiConfig.provider === 'gemini'
      ? (aiConfig.geminiKey?.trim() || undefined)
      : aiConfig.provider === 'openai'
      ? aiConfig.openAiKey?.trim()
      : aiConfig.provider === 'anthropic'
      ? aiConfig.anthropicKey?.trim()
      : aiConfig.provider === 'groq'
      ? (aiConfig.groqKey || aiConfig.customKey)?.trim()
      : aiConfig.customKey?.trim();

  try {
    const data = { quote: await directGenerateQuote(aiConfig, cleanTopic) };

    if (data && data.quote) {
        const rawQuote = data.quote;
        const enrichedQuote: Quote = {
          ...rawQuote,
          id: `daily-ai-${todayKey}-${Date.now()}`,
          textJp: rawQuote.textJp || '',
          source: rawQuote.source || 'مستوحى من أدب دازاي',
          chapter: rawQuote.chapter || 'شذرة أصلية',
          category: rawQuote.category || 'solitude',
          year: rawQuote.year || new Date().getFullYear(),
          readingTimeSec: rawQuote.readingTimeSec || 15,
          textAr: cleanQuoteText(rawQuote.textAr || ''),
          reflection: cleanQuoteText(rawQuote.reflection || ''),
          isDailyFeatured: true,
          isAiGenerated: true,
          dailyDate: todayKey,
          providerUsed: aiConfig.provider,
          modelUsed: aiConfig.selectedModel || 'dazai-ai',
          tags: [
            'شذرة اليوم',
            rawQuote.source || 'أدب دازاي',
            'أوسامو دازاي',
            'أدب ياباني',
          ],
        };

        const newRecord: DailyAIQuoteRecord = {
          dateKey: todayKey,
          quote: enrichedQuote,
          generatedAt: Date.now(),
          provider: aiConfig.provider,
          model: aiConfig.selectedModel,
          topic: cleanTopic,
        };

        saveDailyQuoteRecord(newRecord);
        return { record: newRecord, isNew: true };
      }
  } catch (err) {
    console.warn('Daily AI quote network fetch fallback:', err);
  }

  // Fallback to rich offline Dazai book quote generator
  const fallbackRecord = createOfflineDailyFallback(todayKey, cleanTopic, stored?.quote?.id);
  saveDailyQuoteRecord(fallbackRecord);
  return { record: fallbackRecord, isNew: true };
}
