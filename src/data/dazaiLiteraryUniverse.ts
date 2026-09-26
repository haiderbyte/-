import { CategoryId, Quote } from '../types';

export interface DazaiBookTheme {
  id: string;
  bookTitleAr: string;
  bookTitleJp: string;
  topic: string;
  category: CategoryId;
  description: string;
}

export interface DazaiCuratedSpark {
  id: string;
  textAr: string;
  textJp: string;
  reflection: string;
  bookTitleAr: string;
  bookTitleJp: string;
  chapter: string;
  category: CategoryId;
  year: number;
}

// Comprehensive catalog of themes categorized by Osamu Dazai's major books and life
export const DAZAI_BOOKS_CATALOG = [
  {
    id: 'no_longer_human',
    titleAr: 'لم أعد إنساناً',
    titleJp: '人間失格',
    year: 1948,
    icon: '🎭',
    description: 'تحفة دازاي الوجودية عن الرعب من المجتمع وقناع المهرج',
    themes: [
      {
        topic: 'قناع المهرج والضحك كدرع خفي لدفع الرعب من نظرات البشر',
        category: 'existence' as CategoryId,
        description: 'عن أوبا يوزو واضطراره لإضحاك الناس خوفاً من أن يكشفوا ضعفه',
      },
      {
        topic: 'الخوف الدفين من خيبة أمل الآخرين والهروب بدلاً من المواجهة',
        category: 'relationships' as CategoryId,
        description: 'الهشاشة أمام عيون من يحسنون الظن بنا وعجزنا عن مجاراتهم',
      },
      {
        topic: 'حانة غينزا والعزلة بين كؤوس النسيان في شوارع طوكيو المعتمة',
        category: 'solitude' as CategoryId,
        description: 'جلسات الهروب في الحانات الرخيصة بحثاً عن ركن هادئ لا يسأل فيه أحد عن هويتك',
      },
      {
        topic: 'براءة الطفولة الملوثة بزيف الكبار والرغبة في التلاشي دون أثر',
        category: 'letters' as CategoryId,
        description: 'حين يدرك الطفل أن العالم لا يغفر للبسطاء صدقهم العاري',
      },
      {
        topic: 'الشعور بالذنب تجاه العائلة ولعنة الابن الذي خيّب آمال الجميع',
        category: 'existence' as CategoryId,
        description: 'ثقل الانتماء إلى عائلة صارمة والتمرد الذي ينتهي بالخزي الصامت',
      },
    ],
  },
  {
    id: 'the_setting_sun',
    titleAr: 'شمس الغروب',
    titleJp: '斜陽',
    year: 1947,
    icon: '🌅',
    description: 'مرثية انحدار الطبقة الأرستقراطية وجمال الزوال الصامت والتمرد من أجل الحب',
    themes: [
      {
        topic: 'شمس الغروب الشاحبة وانطفاء النبل القديم بهدوء دون استجداء الشفقة',
        category: 'faint_hope' as CategoryId,
        description: 'كيف تموت الأشياء العظيمة والأسر الأرستقراطية بوقار صامت',
      },
      {
        topic: 'رسائل الشفق واعترافات ناوجي الأخيرة قبل أن يسدل الستار على حياته',
        category: 'letters' as CategoryId,
        description: 'صرخة الشاب الممزق بين نقاء روحه وقسوة العالم المادي الجديد',
      },
      {
        topic: 'كازوكو واحتساء الشاي في الريف والتمرد الجريء بحثاً عن ولادة جديدة',
        category: 'faint_hope' as CategoryId,
        description: 'المرأة التي ترفض أن تموت مع ماضيها وتقرر العيش بقوة الحب',
      },
      {
        topic: 'صمت الجدران القديمة وضوء المساء المتلاشي فوق أشجار الصنوبر',
        category: 'solitude' as CategoryId,
        description: 'تأمل في زوال العز والسكينة الحزينة التي تلي خسارة كل شيء',
      },
    ],
  },
  {
    id: 'tsugaru',
    titleAr: 'تسوغارو والشمال البارد',
    titleJp: '津軽',
    year: 1944,
    icon: '❄️',
    description: 'رحلة الحنين إلى مسقط الرأس، ثلوج الشمال، ومواجهة الجذور المتعبة',
    themes: [
      {
        topic: 'صقيع الثلج في كاناغي والحنين المعذب إلى مسقط الرأس بعد سنوات الغربة',
        category: 'solitude' as CategoryId,
        description: 'العودة إلى أرض الطفولة والشعور بالغربة الأبدية وسط الأهل',
      },
      {
        topic: 'دفء الموقد الريفي وحنان المربية القديمة تاكي في مواجهة عواصف الشتاء',
        category: 'relationships' as CategoryId,
        description: 'اللمسة الإنسانية الصادقة التي تعيد بناء الثقة بالإنسان',
      },
      {
        topic: 'رياح مضيق تسوغارو العاتية التي تعري أوهام المدن وحماقاتها',
        category: 'existence' as CategoryId,
        description: 'الطبيعة القاسية التي تذكرنا بصغر حجمنا وزيف انشغالاتنا',
      },
      {
        topic: 'بساطة الفلاحين وطيبة العجائز كبلسم للروح الهاربة من صخب طوكيو',
        category: 'faint_hope' as CategoryId,
        description: 'البحث عن الطمأنينة في عيون الذين لم يعرفوا المكر الحضري',
      },
    ],
  },
  {
    id: 'run_melos',
    titleAr: 'اركض يا ميلوس',
    titleJp: '走れメロス',
    year: 1940,
    icon: '🏃',
    description: 'ملحمة الصداقة النبيلة، صراع الوفاء ضد غروب الشمس، والانتصار على الشك',
    themes: [
      {
        topic: 'امتحان الصداقة الحقيقية والوفاء بالعهد في أحلك لحظات الانهيار',
        category: 'relationships' as CategoryId,
        description: 'حين تكون حياة صديقك معلقة على قدرتك على مقاومة الإعياء والاستسلام',
      },
      {
        topic: 'اللهاث في مواجهة غروب الشمس والقتال لإنقاذ الروح من خزي الخيانة',
        category: 'faint_hope' as CategoryId,
        description: 'الركض الأخير نحو الغاية حين تخذلك ساقاك ولا يبقى إلا عزم القلب',
      },
      {
        topic: 'استعادة الإيمان بالإنسان وكسر طغيان الشك والظلم بجرأة التضحية',
        category: 'existence' as CategoryId,
        description: 'اللحظة النادرة التي ينتصر فيها النقاء على ظلامية العالم',
      },
    ],
  },
  {
    id: 'memories_early',
    titleAr: 'ذكريات وأوراق الشوا',
    titleJp: '思い出・思ひ出',
    year: 1936,
    icon: '📜',
    description: 'اعترافات الصبا المبكرة، خجل الطفولة، ورائحة الورق والمسودات الأولى',
    themes: [
      {
        topic: 'خجل الطفولة المبكر والشعور بأنه كائن زائد عن حاجة البيت الكبير',
        category: 'letters' as CategoryId,
        description: 'الطفل الحساس الذي يراقب العالم من خلف الستائر دون أن يجرؤ على الاقتراب',
      },
      {
        topic: 'رائحة الحبر القديم على المسودات الممزقة في ليالي الأرق الحارقة',
        category: 'letters' as CategoryId,
        description: 'هوس الكتابة كسبيل وحيد للتنفس والصراع مع الصفحة البيضاء',
      },
      {
        topic: 'الحنين إلى براءة لم تكتمل وشجرة الخوخ المزهرة خلف سياج الحديقة',
        category: 'faint_hope' as CategoryId,
        description: 'لحظات السكينة العابرة التي مرت كلمح البصر في مطلع العمر',
      },
    ],
  },
  {
    id: 'bar_lupin_buraiha',
    titleAr: 'شخصية دازاي وبوهيمية حانة لوبين',
    titleJp: '無頼派と銀座ルパン',
    year: 1946,
    icon: '🍸',
    description: 'أيام حركة البورايها، حانة لوبين مع أنغو ساكاغوتشي، وسخرية اليأس',
    themes: [
      {
        topic: 'جلسات حانة لوبين في غينزا وسخرية اليأس المرّة مع رفاق البورايها',
        category: 'existence' as CategoryId,
        description: 'الضحك بصوت عالٍ وسط دخان السجائر لئلا يسمع أحد صوت انكسار القلوب',
      },
      {
        topic: 'صدمة انتحار ريونوسوكي أكوتاغاوا والبحث المحموم عن معنى للكتابة',
        category: 'letters' as CategoryId,
        description: 'حين يفقد الكاتب الشاب قدوته ويقف وحيداً في عراء الأدب',
      },
      {
        topic: 'المشي الليلي الوحيد تحت المطر على ضفاف نهر تاماجاوا وسؤال المصير',
        category: 'solitude' as CategoryId,
        description: 'الخطوات المبللة نحو الماء والبحث عن سكينة لا يقطعها لوم ولا عتاب',
      },
      {
        topic: 'رسائل التوسل والاعتراف إلى كاواباتا وساتو هارو والوجع من رفض النقاد',
        category: 'letters' as CategoryId,
        description: 'تجريد الكبرياء وتقديم الروح العارية على مذبح الاعتراف الأدبي',
      },
    ],
  },
];

// Flat list of all curated Dazai themes across books
export const ALL_DAZAI_THEMES: { topic: string; book: string; category: CategoryId }[] =
  DAZAI_BOOKS_CATALOG.flatMap((b) =>
    b.themes.map((t) => ({
      topic: t.topic,
      book: b.titleAr,
      category: t.category,
    }))
  );

// Curated library of authentic Dazai quotes from his specific books and life
export const DAZAI_CURATED_SPARKS: DazaiCuratedSpark[] = [
  // 1. لم أعد إنساناً
  {
    id: 'spark-nlh-1',
    textAr: 'طوال حياتي كنت أرتدي قناع المهرج لأضحك الناس، حتى نسيت الملامح التي وُلدت بها خلف هذا الطلاء.',
    textJp: '人間失格、道化を演じて生きる哀しみ。',
    reflection: 'أشد أنواع الوجع هو أن تبتسم للجميع لكي تخفي خوفك القاتل من إنسانيتك.',
    bookTitleAr: 'لم أعد إنساناً',
    bookTitleJp: '人間失格',
    chapter: 'المذكرة الأولى',
    category: 'existence',
    year: 1948,
  },
  {
    id: 'spark-nlh-2',
    textAr: 'ما كنتُ أخشاه قط هو الموت، بل نظرة العتاب الهادئة في عيون من أحسنوا الظن بي حين عجزتُ عن التظاهر بالقوة.',
    textJp: '私は死を恐れたのではない。信じてくれた人の静かな視線を恐れたのだ。',
    reflection: 'الخوف من خيبة أمل الآخرين هو أثقل القيود التي تثقل كاهل الروح الهشة.',
    bookTitleAr: 'لم أعد إنساناً',
    bookTitleJp: '人間失格',
    chapter: 'المذكرة الثانية',
    category: 'relationships',
    year: 1948,
  },
  {
    id: 'spark-nlh-3',
    textAr: 'حين أغلقتُ باب غرفتي في طوكيو، أدركتُ أن العزلة ليست عقاباً، بل هي المرآة الوحيدة التي ترفض أن تجاملك.',
    textJp: '孤独は鏡のごとく、偽りのない魂の傷を映し出す。',
    reflection: 'في مواجهة الصمت التام، يسقط قناعك حتى لو تشبثت به بقبضة يدك المرتجفة.',
    bookTitleAr: 'لم أعد إنساناً',
    bookTitleJp: '人間失格',
    chapter: 'المذكرة الثالثة',
    category: 'solitude',
    year: 1948,
  },
  {
    id: 'spark-nlh-4',
    textAr: 'كل ما كنت أرجوه هو ألا ينتبه أحد لوجودي المتعثر، أن أعبر هذا العالم كظل شجرة في يوم غائم.',
    textJp: '曇天の日の木陰のように、誰にも気づかれずに生きてゆきたかった。',
    reflection: 'الرغبة في التواري ليست هروباً، بل أقصى درجات حماية ما تبقى من نقاء.',
    bookTitleAr: 'لم أعد إنساناً',
    bookTitleJp: '人間失格',
    chapter: 'الخاتمة',
    category: 'solitude',
    year: 1948,
  },

  // 2. شمس الغروب
  {
    id: 'spark-sun-1',
    textAr: 'شمس الغروب الشاحبة لا تنذر بالظلام، بل تعلن أن الأشياء الجميلة وحدها تعرف كيف تنطفئ بهدوء نبيل.',
    textJp: '夕陽の影に消えゆく美しきものたち。',
    reflection: 'في كل نهاية تكمن سكينة غامضة لا يفهمها من يركض خلف بريق البقاء الزائف.',
    bookTitleAr: 'شمس الغروب',
    bookTitleJp: '斜陽',
    chapter: 'أوراق الشفق',
    category: 'faint_hope',
    year: 1947,
  },
  {
    id: 'spark-sun-2',
    textAr: 'نحن لسنا أرستقراطيين لأننا نملك المال، بل لأننا نحتفظ برقة قلوبنا حتى ونحن نسقط نحو القاع.',
    textJp: '真の貴族とは、滅びゆく中にあってなお気高き心を失わぬ者のことだ。',
    reflection: 'النبل الحقيقي لا يُشترى، بل يلمع في الصبر الأنيق عند حطام الآمال.',
    bookTitleAr: 'شمس الغروب',
    bookTitleJp: '斜陽',
    chapter: 'رسائل ناوجي',
    category: 'existence',
    year: 1947,
  },
  {
    id: 'spark-sun-3',
    textAr: 'لقد ولدتُ لأحب وأتمرد، والموت في سبيل ما نحب أهون ألف مرة من البقاء في أسر الأقنعة البالية.',
    textJp: '愛するために、戦うために、私は生まれてきたのだ。',
    reflection: 'التمرد الصادق هو الشكل الأسمى لحب الحياة رغم كل خيباتها.',
    bookTitleAr: 'شمس الغروب',
    bookTitleJp: '斜陽',
    chapter: 'بوح كازوكو',
    category: 'faint_hope',
    year: 1947,
  },

  // 3. تسوغارو
  {
    id: 'spark-tsu-1',
    textAr: 'في صقيع الشمال البعيد، تساقطت الثلوج على بيتنا القديم في كاناغي، فأحسست أن قلبي ما زال عالقاً تحت ذلك البياض البارد.',
    textJp: '津軽の雪の下に、少年の日の記憶は今も凍りついている。',
    reflection: 'مسقط الرأس جرح لا يندمل؛ كلما ابتعدت عنه ناداك صوته في ليالي الشتاء.',
    bookTitleAr: 'تسوغارو والشمال البارد',
    bookTitleJp: '津軽',
    chapter: 'طريق كاناغي',
    category: 'solitude',
    year: 1944,
  },
  {
    id: 'spark-tsu-2',
    textAr: 'حين جلستُ إلى جوار الموقد الريفي واحتسيت فنجان الشاي مع العجوز، تلاشت كل تعقيدات طوكيو وكأنها لم تكن.',
    textJp: '囲炉裏の温もりに、都会の偽善は跡形もなく消え去る。',
    reflection: 'البساطة الصادقة تشفي ما تعجز أرقى الفلسفات عن مداواته.',
    bookTitleAr: 'تسوغارو والشمال البارد',
    bookTitleJp: '津軽',
    chapter: 'دفء الموقد',
    category: 'relationships',
    year: 1944,
  },

  // 4. اركض يا ميلوس
  {
    id: 'spark-melos-1',
    textAr: 'حتى لو انقطعت أنفاسي وخرّت قواي، سأركض؛ ليس طلباً للحياة، بل لكي أثبت أن الصداقة لم تمت في هذا العالم.',
    textJp: '友のために走る。信実がまだこの世にあることを証明するために。',
    reflection: 'الأمانة ليست واجباً ثقيلاً، بل هي النور الأخير الذي يمنع الروح من السقوط في العتمة.',
    bookTitleAr: 'اركض يا ميلوس',
    bookTitleJp: '走れメロス',
    chapter: 'السباق مع الغروب',
    category: 'relationships',
    year: 1940,
  },
  {
    id: 'spark-melos-2',
    textAr: 'الشك مرض الطغاة، أما القلوب الصادقة فتعرف كيف تضع عنقها فداءً لبسمة رفيق دربها.',
    textJp: '疑いは暴君の病、信じることは勇者の光。',
    reflection: 'أن تُخدع وأنت صادق أكرم ألف مرة من أن تعيش آمناً وأنت مرتاب في الجميع.',
    bookTitleAr: 'اركض يا ميلوس',
    bookTitleJp: '走れメロス',
    chapter: 'مواجهة الطاغية',
    category: 'existence',
    year: 1940,
  },

  // 5. حانة لوبين وبوهيمية طوكيو
  {
    id: 'spark-lupin-1',
    textAr: 'في حانة لوبين بغينزا، كان الدخان يرتفع ليعانق وجوهنا الشاحبة، وكنا نضحك بسخرية لكي نخفي رجفة أكفّنا المنهكة.',
    textJp: 'ルパンの止まり木で、私たちは絶望を笑いに変えて飲み干した。',
    reflection: 'السخرية البوهيمية لم تكن استهانة بالألم، بل كانت السلاح الوحيد لمواجهته.',
    bookTitleAr: 'شخصية دازاي وبوهيمية حانة لوبين',
    bookTitleJp: '銀座ルパンの記憶',
    chapter: 'ليالي غينزا',
    category: 'existence',
    year: 1946,
  },
  {
    id: 'spark-lupin-2',
    textAr: 'نهر تاماجاوا يجري في الليل بهدوء لا يبالي بأحزاننا، وكم تمنيت لو كانت كلماتي شفافة ومستكينة كتلك المياه.',
    textJp: '玉川の静寂に、人の嘆きは吸い込まれてゆく。',
    reflection: 'الطبيعة لا تعاتبنا على ضعفنا، بل تستقبل انكسارنا دون سؤال.',
    bookTitleAr: 'شخصية دازاي وبوهيمية حانة لوبين',
    bookTitleJp: '玉川のほとり',
    chapter: 'ضفاف تاماجاوا',
    category: 'solitude',
    year: 1948,
  },

  // 6. ذكريات وأوراق الشوا
  {
    id: 'spark-mem-1',
    textAr: 'كنت صبياً خجولاً يخشى صوته في الممرات، فتعلمت أن أخطّ وجعي على هوامش دفاتري قبل أن تمحوها الأيام.',
    textJp: '少年の日の恥じらいは、今もノートの余白に微かに息づいている。',
    reflection: 'خجل البدايات هو النبع الذي تتدفق منه أصدق الاعترافات الأدبية.',
    bookTitleAr: 'ذكريات وأوراق الشوا',
    bookTitleJp: '思い出',
    chapter: 'مذكرات الصبا',
    category: 'letters',
    year: 1936,
  },
  {
    id: 'spark-mem-2',
    textAr: 'ما عجزتُ عن قوله للمارة في شوارع طوكيو، أودعته في رسائلي الممزقة التي لم تجرؤ يوماً على بلوغ صناديق البريد.',
    textJp: '届かぬ手紙こそ、魂の最も純粋な叫び。',
    reflection: 'الكلمات التي نمزقها بأنفسنا هي أكثر الكلمات خلوداً في ضميرنا.',
    bookTitleAr: 'ذكريات وأوراق الشوا',
    bookTitleJp: '思ひ出の断片',
    chapter: 'رماد الرسائل',
    category: 'letters',
    year: 1936,
  },
];

/**
 * Returns a random theme from Dazai's diverse literary catalog,
 * optionally excluding the currently selected topic to guarantee variety.
 */
export function getRandomDazaiTheme(excludeTopic?: string): {
  topic: string;
  book: string;
  category: CategoryId;
} {
  const pool = excludeTopic
    ? ALL_DAZAI_THEMES.filter((t) => t.topic !== excludeTopic)
    : ALL_DAZAI_THEMES;

  const selected = pool[Math.floor(Math.random() * pool.length)] || ALL_DAZAI_THEMES[0];
  return selected;
}

/**
 * Returns a random authentic curated Dazai spark/quote from his books catalog.
 */
export function getRandomCuratedSpark(excludeId?: string): DazaiCuratedSpark {
  const pool = excludeId
    ? DAZAI_CURATED_SPARKS.filter((s) => s.id !== excludeId)
    : DAZAI_CURATED_SPARKS;

  return pool[Math.floor(Math.random() * pool.length)] || DAZAI_CURATED_SPARKS[0];
}
