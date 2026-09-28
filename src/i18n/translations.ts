import { AppLanguage } from '../types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  appTagline: string;
  
  // Navigation
  nav: {
    home: string;
    library: string;
    chat: string;
    studio: string;
    settings: string;
  };

  // Header / Navbar
  navbar: {
    title: string;
    subtitle: string;
    kanjiSubtitle: string;
    themeDark: string;
    themeSepia: string;
    soundOn: string;
    soundOff: string;
    atmosphere: string;
    atmosphereLeaves: string;
    atmosphereDust: string;
    atmosphereBoth: string;
    atmosphereNone: string;
    notificationsTooltip: string;
  };

  // Settings
  settings: {
    title: string;
    subtitle: string;
    languageTitle: string;
    languageDesc: string;
    arabic: string;
    english: string;
    japanese: string;
    defaultBadge: string;
    activeLanguage: string;
    providerSection: string;
    providerSectionDesc: string;
    selectModel: string;
    selectModelDesc: string;
    apiKeyTitle: string;
    apiKeyDesc: string;
    saveLocal: string;
    clearKeys: string;
    savedSuccess: string;
    localSaveSuccessNotice: string;
    notificationTitle: string;
    notificationDesc: string;
    enableNotification: string;
    testNotification: string;
    dailyArchiveBtn: string;
    favoritesBtn: string;
    healthCheckBtn: string;
    testing: string;
    connected: string;
    disconnected: string;
  };

  // Chat
  chat: {
    personaDropdownTitle: string;
    personaDropdownSubtitle: string;
    selectPersonaModalTitle: string;
    newChat: string;
    clearChat: string;
    chatHistory: string;
    settingsBtn: string;
    inputPlaceholder: string;
    sendBtn: string;
    listen: string;
    stop: string;
    copy: string;
    copied: string;
    emptyCouncilTitle: string;
    emptyCouncilDesc: string;
    typingPrefix: string;
    clearModalTitle: string;
    clearModalDesc: string;
    clearModalConfirm: string;
    clearModalResetSession: string;
    cancel: string;
    you: string;
  };

  // Home View
  home: {
    dailyTitle: string;
    dailySubtitle: string;
    randomQuote: string;
    exploreLibrary: string;
    makeCard: string;
    chatWithDazai: string;
    dailyArchive: string;
    refreshDaily: string;
    categoriesTitle: string;
    categoriesSubtitle: string;
  };

  // Library View
  library: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    all: string;
    favorites: string;
    dailyQuotes: string;
    generateAiQuote: string;
    quotesCount: string;
    noQuotesFound: string;
  };

  // Studio
  studio: {
    title: string;
    subtitle: string;
    style: string;
    ratio: string;
    showJapanese: string;
    showHanko: string;
    showReflection: string;
    exportImage: string;
    copyText: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  ar: {
    appName: 'شذرات دازاي',
    appSubtitle: 'شمس الغروب ومذكرات العزلة',
    appTagline: 'تأملات أدبية كلاسيكية مستوحاة من أدب أوسامو دازاي',

    nav: {
      home: 'الرئيسية',
      library: 'الشذرات',
      chat: 'روح دازاي',
      studio: 'البطاقات',
      settings: 'الإعدادات',
    },

    navbar: {
      title: 'شذرات دازاي',
      subtitle: 'مذكرات العزلة وشمس الغروب',
      kanjiSubtitle: '人間失格 · 太宰 治 · 1909 - 1948',
      themeDark: 'الوضع الليلي (سبج)',
      themeSepia: 'وضع الرقاقة العتيق (واشي)',
      soundOn: 'المؤثرات الصوتية مفعلة',
      soundOff: 'المؤثرات الصوتية مكتومة',
      atmosphere: 'الأجواء التعبيرية',
      atmosphereLeaves: 'أوراق خريفية متساقطة',
      atmosphereDust: 'غبار الحبر العتيق',
      atmosphereBoth: 'الأوراق والحبر معاً',
      atmosphereNone: 'إيقاف الأجواء',
      notificationsTooltip: 'إشعارات شذرة اليوم',
    },

    settings: {
      title: 'الإعدادات وتكامل المزودين',
      subtitle: 'تخصيص المفاتيح ولغة الواجهة والمؤثرات الأدبية',
      languageTitle: 'لغة واجهة التطبيق',
      languageDesc: 'اختر لغة عناصر وأزرار الواجهة (مع الحفاظ الكامل على النصوص الأدبية الأصلية)',
      arabic: 'العربية (الأصيلة)',
      english: 'English (الإنجليزية)',
      japanese: '日本語 (اليابانية)',
      defaultBadge: 'الافتراضية',
      activeLanguage: 'اللغة الحالية',
      providerSection: 'مزود الذكاء الاصطناعي النشط',
      providerSectionDesc: 'اختر المحرك الأدبي للمحادثات وتوليد الاقتباسات اليومية',
      selectModel: 'طراز النموذج الذكي',
      selectModelDesc: 'اختر النموذج المناسب لعمق المحادثة الأدبية وسرعة الرد',
      apiKeyTitle: 'مفتاح API الخاص بك',
      apiKeyDesc: 'يتم حفظ المفتاح بأمان تام داخل متصفحك المحلي (LocalStorage)',
      saveLocal: 'حفظ الإعدادات محلياً',
      clearKeys: 'مسح المفاتيح المخزنة',
      savedSuccess: 'تم الحفظ محلياً',
      localSaveSuccessNotice: 'تم حفظ كافة الإعدادات واللغة محلياً في متصفحك بنجاح ✓',
      notificationTitle: 'إشعار شذرة اليوم',
      notificationDesc: 'تنبيه هادئ يومي مع تأمل أدبي جديد في موعدك المفضل',
      enableNotification: 'تفعيل إشعارات اليوم',
      testNotification: 'تجربة إشعار فوري',
      dailyArchiveBtn: 'سجل شذرات الأيام',
      favoritesBtn: 'المفضلة الأدبية',
      healthCheckBtn: 'فحص المزود',
      testing: 'جاري الفحص...',
      connected: 'متصل',
      disconnected: 'غير متصل',
    },

    chat: {
      personaDropdownTitle: 'الشخصية الحالية',
      personaDropdownSubtitle: 'انقر لتغيير شخصية المجلس الأدبي',
      selectPersonaModalTitle: 'اختر جليس المجلس الأدبي',
      newChat: 'حوار جديد',
      clearChat: 'مسح المحادثة',
      chatHistory: 'سجل المحادثات',
      settingsBtn: 'الإعدادات',
      inputPlaceholder: 'اكتب تأملك أو سؤالك إلى',
      sendBtn: 'إرسال',
      listen: 'استماع',
      stop: 'إيقاف',
      copy: 'نسخ',
      copied: 'تم',
      emptyCouncilTitle: 'المجلس الأدبي هادئ الليلة مع',
      emptyCouncilDesc: 'اختر سؤالاً من الأسئلة المقترحة أو اكتب تأملك لتبدأ الجلسة.',
      typingPrefix: 'يغمس ريشته في الحبر ويكتب تأمله...',
      clearModalTitle: 'مسح المحادثة الحالية بالكامل',
      clearModalDesc: 'هل أنت متأكد من رغبتك في مسح كافة رسائل هذا الحوار؟',
      clearModalConfirm: 'نعم، إفراغ رسائل هذه المحادثة',
      clearModalResetSession: 'حذف الجلسة بالكامل والبدء بجلسة جديدة',
      cancel: 'إلغاء التراجع',
      you: 'أنت',
    },

    home: {
      dailyTitle: 'شذرة اليوم المختارة',
      dailySubtitle: 'تأمل أدبي متجدد مع شمس كل يوم',
      randomQuote: 'شذرة عشوائية',
      exploreLibrary: 'تصفح المكتبة الأدبية',
      makeCard: 'صناعة بطاقة',
      chatWithDazai: 'حوار مع روح دازاي',
      dailyArchive: 'أرشيف الأيام السابقة',
      refreshDaily: 'تجديد شذرة اليوم',
      categoriesTitle: 'أبواب الأدب الدازايي',
      categoriesSubtitle: 'رحلة فلسفية عبر خمسة مسارات من الوجدان',
    },

    library: {
      title: 'مكتبة الشذرات الأدبية',
      subtitle: 'مجموعة متكاملة من اقتباسات وتأملات أوسامو دازاي المصنفة',
      searchPlaceholder: 'ابحث في الشذرات والكلمات وأسماء الأعمال...',
      all: 'كافة الشذرات',
      favorites: 'المفضلة',
      dailyQuotes: 'شذرات الأيام',
      generateAiQuote: 'توليد شذرة ذكية',
      quotesCount: 'شذرة أدبية',
      noQuotesFound: 'لم يتم العثور على شذرات تطابق بحثك',
    },

    studio: {
      title: 'محترف تصميم البطاقات الأدبية',
      subtitle: 'صمم بطاقات اقتباس فاخرة بأسلوب الواشي الياباني العتيق',
      style: 'النمط البصري',
      ratio: 'أبعاد البطاقة',
      showJapanese: 'إظهار النص الياباني الأصلي',
      showHanko: 'إظهار الختم الياباني (太宰)',
      showReflection: 'إظهار التأمل المصاحب',
      exportImage: 'تصدير كصورة عالية الدقة',
      copyText: 'نسخ نص الاقتباس',
    },
  },

  en: {
    appName: 'Dazai Fragments',
    appSubtitle: 'The Setting Sun & Solitude Notes',
    appTagline: 'Classical literary reflections inspired by Osamu Dazai',

    nav: {
      home: 'Home',
      library: 'Fragments',
      chat: 'Dazai’s Spirit',
      studio: 'Studio',
      settings: 'Settings',
    },

    navbar: {
      title: 'Dazai Fragments',
      subtitle: 'Notes of Solitude & The Setting Sun',
      kanjiSubtitle: 'No Longer Human · Osamu Dazai · 1909 - 1948',
      themeDark: 'Dark Mode (Obsidian)',
      themeSepia: 'Parchment Mode (Washi)',
      soundOn: 'Sound Enabled',
      soundOff: 'Sound Muted',
      atmosphere: 'Visual Atmosphere',
      atmosphereLeaves: 'Autumn Leaves',
      atmosphereDust: 'Ink Dust',
      atmosphereBoth: 'Leaves & Ink Dust',
      atmosphereNone: 'Turn Off',
      notificationsTooltip: 'Daily Fragment Notifications',
    },

    settings: {
      title: 'Settings & AI Integration',
      subtitle: 'Customize API keys, interface language, and literary ambiance',
      languageTitle: 'Interface Language',
      languageDesc: 'Choose the language for UI controls and buttons (Arabic literary texts are fully preserved)',
      arabic: 'العربية (Arabic Original)',
      english: 'English',
      japanese: '日本語 (Japanese)',
      defaultBadge: 'Default',
      activeLanguage: 'Active Language',
      providerSection: 'Active AI Provider',
      providerSectionDesc: 'Select the literary engine for dialogues and daily meditations',
      selectModel: 'Model Selection',
      selectModelDesc: 'Choose the model best suited for literary depth and responsiveness',
      apiKeyTitle: 'Your Private API Key',
      apiKeyDesc: 'Saved securely on your local device (LocalStorage)',
      saveLocal: 'Save Settings Locally',
      clearKeys: 'Clear Stored Keys',
      savedSuccess: 'Saved Locally',
      localSaveSuccessNotice: 'All settings and language preferences saved locally ✓',
      notificationTitle: 'Daily Fragment Notification',
      notificationDesc: 'A gentle daily reminder with fresh literary contemplation',
      enableNotification: 'Enable Daily Notifications',
      testNotification: 'Send Test Notification',
      dailyArchiveBtn: 'Daily Fragments Archive',
      favoritesBtn: 'Literary Favorites',
      healthCheckBtn: 'Health Check',
      testing: 'Testing...',
      connected: 'Connected',
      disconnected: 'Offline',
    },

    chat: {
      personaDropdownTitle: 'Current Persona',
      personaDropdownSubtitle: 'Click to switch literary companion',
      selectPersonaModalTitle: 'Select Literary Companion',
      newChat: 'New Dialogue',
      clearChat: 'Clear Chat',
      chatHistory: 'Chat History',
      settingsBtn: 'Settings',
      inputPlaceholder: 'Write your contemplation or question to',
      sendBtn: 'Send',
      listen: 'Listen',
      stop: 'Stop',
      copy: 'Copy',
      copied: 'Done',
      emptyCouncilTitle: 'The literary salon is quiet tonight with',
      emptyCouncilDesc: 'Pick a suggested prompt or write your contemplation to begin.',
      typingPrefix: 'dipping pen in ink to formulate thoughts...',
      clearModalTitle: 'Clear Current Dialogue Completely',
      clearModalDesc: 'Are you sure you want to clear all messages from this dialogue?',
      clearModalConfirm: 'Yes, clear messages in this chat',
      clearModalResetSession: 'Delete entire session and start new',
      cancel: 'Cancel',
      you: 'You',
    },

    home: {
      dailyTitle: 'Featured Daily Fragment',
      dailySubtitle: 'A renewed literary meditation with each dawn',
      randomQuote: 'Random Fragment',
      exploreLibrary: 'Explore Library',
      makeCard: 'Create Card',
      chatWithDazai: 'Dialogue with Dazai',
      dailyArchive: 'Previous Days Archive',
      refreshDaily: 'Refresh Daily Fragment',
      categoriesTitle: 'Themes of Dazai’s Literature',
      categoriesSubtitle: 'A philosophical journey across five emotional paths',
    },

    library: {
      title: 'Literary Fragments Library',
      subtitle: 'Comprehensive curated quotes and reflections from Osamu Dazai',
      searchPlaceholder: 'Search fragments, words, book titles...',
      all: 'All Fragments',
      favorites: 'Favorites',
      dailyQuotes: 'Daily Quotes',
      generateAiQuote: 'Generate AI Fragment',
      quotesCount: 'fragments',
      noQuotesFound: 'No fragments found matching your search',
    },

    studio: {
      title: 'Literary Card Studio',
      subtitle: 'Craft bespoke quote cards in vintage Japanese Washi aesthetic',
      style: 'Visual Style',
      ratio: 'Card Ratio',
      showJapanese: 'Show Original Japanese Text',
      showHanko: 'Show Hanko Seal (太宰)',
      showReflection: 'Show Literary Reflection',
      exportImage: 'Export High-Res Image',
      copyText: 'Copy Quote Text',
    },
  },

  ja: {
    appName: '太宰治 断片録',
    appSubtitle: '斜陽と孤愁の手記',
    appTagline: '太宰治の文学世界に捧ぐ、思索と対話の空間',

    nav: {
      home: 'ホーム',
      library: '断片録',
      chat: '太宰の魂',
      studio: 'カード制作',
      settings: '設定',
    },

    navbar: {
      title: '太宰治 断片録',
      subtitle: '斜陽と孤愁の手記',
      kanjiSubtitle: '人間失格 · 太宰 治 · 1909 - 1948',
      themeDark: '夜陰モード（黒曜）',
      themeSepia: '和紙モード（古典）',
      soundOn: '効果音 有効',
      soundOff: '効果音 消音',
      atmosphere: '空間の雰囲気',
      atmosphereLeaves: '散りゆく木の葉',
      atmosphereDust: '古書の墨塵',
      atmosphereBoth: '落葉と墨塵の両方',
      atmosphereNone: '効果を消去',
      notificationsTooltip: '本日の断片 通知',
    },

    settings: {
      title: '設定とAIプロバイダー接続',
      subtitle: 'APIキー、インターフェース言語、文学的演出の管理',
      languageTitle: 'インターフェース言語',
      languageDesc: '操作メニューやボタンの表示言語を選択します（アラビア語の文学テキストはそのまま保持されます）',
      arabic: 'العربية（アラビア語 原文）',
      english: 'English（英語）',
      japanese: '日本語（Japanese）',
      defaultBadge: '初期値',
      activeLanguage: '現在の言語',
      providerSection: '有効なAIプロバイダー',
      providerSectionDesc: '対話と思索生成に使用するAIエンジンを選択',
      selectModel: 'モデルの選択',
      selectModelDesc: '思索の深さと応答速度に合わせてモデルを指定',
      apiKeyTitle: '個人APIキー',
      apiKeyDesc: 'ブラウザのローカルストレージ（LocalStorage）に安全に保存されます',
      saveLocal: '設定をローカル保存',
      clearKeys: '保存キーを全消去',
      savedSuccess: '保存完了',
      localSaveSuccessNotice: 'すべての設定と言語設定がローカルに保存されました ✓',
      notificationTitle: '本日の断片 通知',
      notificationDesc: 'ご指定の時間に、静かな文学的思索をお届けします',
      enableNotification: '日々の通知を有効化',
      testNotification: 'テスト通知を送信',
      dailyArchiveBtn: '過去の断片録アーカイブ',
      favoritesBtn: 'お気に入り断片',
      healthCheckBtn: '接続テスト',
      testing: 'テスト中...',
      connected: '接続良好',
      disconnected: '未接続',
    },

    chat: {
      personaDropdownTitle: '現在の対話人物',
      personaDropdownSubtitle: 'クリックして対話相手を変更',
      selectPersonaModalTitle: '対話相手の選択',
      newChat: '新しい対話',
      clearChat: '対話を消去',
      chatHistory: '対話履歴',
      settingsBtn: '設定',
      inputPlaceholder: '問いや思索を書き込む：',
      sendBtn: '送信',
      listen: '朗読',
      stop: '停止',
      copy: 'コピー',
      copied: '完了',
      emptyCouncilTitle: '今宵の座敷は静寂に包まれています：',
      emptyCouncilDesc: '提案された問いを選ぶか、あなたの心境を綴って対話を始めましょう。',
      typingPrefix: '墨にペンを浸し、思索を綴っています...',
      clearModalTitle: 'この対話をすべて消去しますか？',
      clearModalDesc: 'この対話の全メッセージを消去してよろしいですか？',
      clearModalConfirm: 'はい、メッセージを消去します',
      clearModalResetSession: 'セッションを破棄して新しく開始',
      cancel: '戻る',
      you: 'あなた',
    },

    home: {
      dailyTitle: '本日の厳選断片',
      dailySubtitle: '日の出とともに訪れる文学の思索',
      randomQuote: '偶然の一節',
      exploreLibrary: '断片集を開く',
      makeCard: 'カードを作る',
      chatWithDazai: '太宰の魂と語る',
      dailyArchive: '過去の記録アーカイブ',
      refreshDaily: '本日の断片を更新',
      categoriesTitle: '太宰文学の五つの深淵',
      categoriesSubtitle: '魂の奥底を辿る五つの思索領域',
    },

    library: {
      title: '太宰治 文学断片録',
      subtitle: '太宰治の名言、思索、手記を網羅した集成',
      searchPlaceholder: '断片、言葉、著作名を検索...',
      all: 'すべての断片',
      favorites: 'お気に入り',
      dailyQuotes: '毎日の断片',
      generateAiQuote: 'AI断片を生成',
      quotesCount: '編の断片',
      noQuotesFound: '一致する断片は見つかりませんでした',
    },

    studio: {
      title: '文学カード制作スタジオ',
      subtitle: '日本の伝統的な和紙・墨黒の美学で言葉を飾る',
      style: '意匠スタイル',
      ratio: 'アスペクト比',
      showJapanese: '日本語原文を表示',
      showHanko: '太宰の角印（太宰）を表示',
      showReflection: '解題・思索を表示',
      exportImage: '高画質画像を出力',
      copyText: '引用文をコピー',
    },
  },
};
