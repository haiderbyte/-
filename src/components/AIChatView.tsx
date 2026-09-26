import React, { useState, useRef, useEffect } from 'react';
import { PersonaType, ChatMessage, ChatSession, AIProviderConfig } from '../types';
import { PERSONAS } from '../data/quotesData';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  User,
  Sliders,
  AlertCircle,
  Activity,
  History,
  Plus,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Trash2,
  Maximize2,
  Minimize2,
  Share2,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import {
  getChatSessions,
  saveChatSessions,
  getActiveSessionId,
  saveActiveSessionId,
  createNewChatSession,
  updateChatSession,
  deleteChatSession,
  clearAllChatSessions,
} from '../utils/storage';
import { validateProvider } from '../utils/ai';
import { ChatHistoryModal } from './ChatHistoryModal';

interface AIChatViewProps {
  aiConfig: AIProviderConfig;
  theme: 'dark' | 'sepia';
  onOpenSettings: () => void;
}

export const AIChatView: React.FC<AIChatViewProps> = ({
  aiConfig,
  theme,
  onOpenSettings,
}) => {
  // Sessions & History state
  const [sessions, setSessions] = useState<ChatSession[]>(() => getChatSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = getActiveSessionId();
    const existing = getChatSessions();
    if (saved && existing.some((s) => s.id === saved)) {
      return saved;
    }
    if (existing.length > 0) {
      return existing[0].id;
    }
    const fresh = createNewChatSession('dazai');
    return fresh.id;
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(() => {
    return activeSession?.persona || 'dazai';
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return activeSession?.messages || [];
  });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPersonaDropdownOpen, setIsPersonaDropdownOpen] = useState(false);
  const [isConfirmingDeleteCurrent, setIsConfirmingDeleteCurrent] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveProviderStatus, setLiveProviderStatus] = useState<
    'idle' | 'testing' | 'online' | 'offline'
  >('idle');
  const [liveLatency, setLiveLatency] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const personaDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close persona dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        personaDropdownRef.current &&
        !personaDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPersonaDropdownOpen(false);
      }
    };
    if (isPersonaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPersonaDropdownOpen]);

  // Sync activeSession changes to state
  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages);
      setSelectedPersona(activeSession.persona);
      saveActiveSessionId(activeSession.id);
    }
  }, [activeSessionId]);

  // Quick Inline Provider Health Check
  const handleQuickHealthCheck = async () => {
    audioManager.playInkDrop();
    setLiveProviderStatus('testing');
    try {
      const result = await validateProvider(aiConfig);
      if (result.success) {
        audioManager.playSingingBowl();
        setLiveProviderStatus('online');
        setLiveLatency(result.latencyMs || null);
        setTimeout(() => setLiveProviderStatus('idle'), 6000);
      } else {
        setLiveProviderStatus('offline');
        setErrorMsg(result.message || 'المزود غير متاح حالياً');
      }
    } catch {
      setLiveProviderStatus('offline');
      setErrorMsg('تعذر الاتصال بالخادم لفحص المزود');
    }
  };

  const currentPersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  const quickPrompts: Record<PersonaType, string[]> = {
    dazai: [
      'لماذا يشعر الإنسان بالرعب من حقيقة نفسه؟',
      'حدثني عن شمس الغروب حين تنطفئ في سماء طوكيو...',
      'هل كان قناع المهرج حماية أم سجناً؟',
      'ما معنى أن تحب عالماً يعجز عن فهمك؟',
    ],
    friend: [
      'أشعر بثقل عظيم في قلبي هذه الليلة...',
      'كيف يتعامل المرء مع صمت البيت في أواخر الليل؟',
      'هل تعتقد أننا سنعثر على السكينة يوماً ما؟',
      'أنا متعب من التظاهر بأن كل شيء على ما يرام.',
    ],
    sensei: [
      'ما هي فلسفة "المونو نو أواري" في الأدب الياباني؟',
      'كيف ترى الفارق بين أدب دازاي وأدب أوتوشيما؟',
      'هل الألم ضروري لولادة النص الأدبي الخالد؟',
      'حلل لي المعنى العميق خلف جملة "لم أعد إنساناً".',
    ],
    yozo: [
      'كيف استطعت إضحاك الناس وأنت ترتعد خوفاً؟',
      'ألا تخشى أن يكتشف أحدهم أنك تمثّل؟',
      'ما هي أسخف التقاليد التي يمارسها البشر برأيك؟',
      'ماذا تفعل حين تنتهي المسرحية وتعود لغرفتك؟',
    ],
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    audioManager.playInkDrop();
    setErrorMsg(null);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      persona: selectedPersona,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // Update session immediately with user message
    const updatedSessions = updateChatSession(activeSessionId, newMessages);
    setSessions(updatedSessions);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          persona: selectedPersona,
          history: newMessages.slice(-6),
          provider: aiConfig.provider,
          apiKey:
            aiConfig.provider === 'gemini'
              ? (aiConfig.geminiKey?.trim() || undefined)
              : aiConfig.provider === 'openai'
              ? aiConfig.openAiKey?.trim()
              : aiConfig.provider === 'anthropic'
              ? aiConfig.anthropicKey?.trim()
              : aiConfig.provider === 'groq'
              ? (aiConfig.groqKey || aiConfig.customKey)?.trim()
              : aiConfig.customKey?.trim(),
          model: aiConfig.selectedModel,
          customBaseUrl: aiConfig.customBaseUrl,
          temperature: aiConfig.temperature,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل الاتصال بالخادم الأدبي');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.reply || '... (صمت متأمل في هواء الغرفة البارد)',
        persona: selectedPersona,
        timestamp: Date.now(),
        providerUsed: data.provider,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      const afterAssistantSessions = updateChatSession(activeSessionId, finalMessages);
      setSessions(afterAssistantSessions);
      audioManager.playPaperRustle();
    } catch {
      // High-eloquence fallback if offline/no key to guarantee deep experience
      const fallbackReplies: Record<PersonaType, string> = {
        dazai:
          'آه... كم أفهم هذا السؤال الذي يقطر مرارة. كلما أردت أن أجيبك بصدق، تذكرت أن الكلمات أحياناً تفضح أكثر مما تستر. في الحقيقة، لم أكن يوماً سوى كائن ضعيف يخشى أن يُنبذ. لكن في سؤالك هذا، ألمح روحاً تشبهني في خوفها النبيل من هذا العالم الزائف.',
        friend:
          'دعنا نجلس قليلاً ولا نحمل أنفسنا فوق طاقتها. الشاي يوشك أن يبرد، والمطر في الخارج يغسل غبار المدينة. سؤالك هذا لا يحتاج إلى حل جاهز، بل إلى قلب يصغي إليك بهدوء. أنا معك، ولا داعي للركض الليلة.',
        sensei:
          'إن ما تشير إليه هو جوهر التراجيديا الإنسانية في حقبة الشوا وما بعدها. حين يدرك الوعي هشاشته أمام آليات المجتمع القاسية، ينشأ ذلك الصراع الوجودي الخالد الذي أبدع دازاي في تصويره. تأمل في زوال الأشياء (Mono no aware)، ففي الاعتراف بالنهاية يولد الوقار الحقيقي.',
        yozo:
          'هاهاها! تسألني هذا وأنا أقف على حبل المشنقة وأبتسم للجماهير؟! لو كشفت لك عن الإجابة الحقيقية دون قناع لارتعبت مني. كل ما أعرفه هو أن التظاهر بالغباء والمرح كان درعي الوحيد كي لا أُمزّق إرباً بين أيدي العقلاء المزعومين!',
      };

      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content:
          fallbackReplies[selectedPersona] ||
          'في سكون ليل طوكيو، نكتفي بالإنصات إلى صدى الكلمات التي لم تُقل.',
        persona: selectedPersona,
        timestamp: Date.now(),
        providerUsed: 'ذاكرة دازاي الأدبية',
      };

      const finalMessages = [...newMessages, fallbackMsg];
      setMessages(finalMessages);
      const afterFallbackSessions = updateChatSession(activeSessionId, finalMessages);
      setSessions(afterFallbackSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    audioManager.playPaperRustle();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (playingMessageId === id) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.84;
    utterance.pitch = selectedPersona === 'yozo' ? 1.05 : 0.92;

    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);

    setPlayingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCreateNewChat = (persona: PersonaType = selectedPersona) => {
    audioManager.playPaperRustle();
    const newSess = createNewChatSession(persona);
    const updated = getChatSessions();
    setSessions(updated);
    setActiveSessionId(newSess.id);
    setSelectedPersona(persona);
    setMessages(newSess.messages);
  };

  const handleSelectSession = (session: ChatSession) => {
    audioManager.playPaperRustle();
    setActiveSessionId(session.id);
    setSelectedPersona(session.persona);
    setMessages(session.messages);
  };

  const handleDeleteSession = (sessionId: string) => {
    audioManager.playInkDrop();
    const updated = deleteChatSession(sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        setSelectedPersona(updated[0].persona);
        setMessages(updated[0].messages);
      } else {
        const fresh = createNewChatSession('dazai');
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
        setSelectedPersona('dazai');
        setMessages(fresh.messages);
      }
    }
  };

  const handleClearAllSessions = () => {
    audioManager.playInkDrop();
    clearAllChatSessions();
    const fresh = createNewChatSession('dazai');
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    setSelectedPersona('dazai');
    setMessages(fresh.messages);
  };

  const handleDeleteCurrentChat = () => {
    handleDeleteSession(activeSessionId);
    setIsConfirmingDeleteCurrent(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] w-full mx-auto">
      {/* Persona Header & Chat Management Bar */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border mb-3 transition-colors shadow-sm ${
          theme === 'dark'
            ? 'bg-[#18181C] border-[#2B2B36]'
            : 'bg-[#FAF4EB] border-[#DECDB7]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Persona Dropdown Selector */}
          <div className="relative" ref={personaDropdownRef}>
            <button
              type="button"
              onClick={() => {
                audioManager.playPaperRustle();
                setIsPersonaDropdownOpen(!isPersonaDropdownOpen);
              }}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-right transition-all flex items-center gap-2.5 shadow-sm group ${
                isPersonaDropdownOpen
                  ? theme === 'dark'
                    ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#FAF6EE]'
                    : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838]'
                  : theme === 'dark'
                  ? 'border-[#33333F] bg-[#1E1E24] hover:bg-[#262630] text-[#E2D9C8]'
                  : 'border-[#DECDB7] bg-[#F2E8D8]/70 hover:bg-[#EAE0D0] text-[#2C241D]'
              }`}
              title="اختر الشخصية الأدبية للمحادثة"
            >
              <span
                className={`w-9 h-9 rounded-lg border flex items-center justify-center font-kanji text-sm shadow-inner flex-shrink-0 ${
                  theme === 'dark'
                    ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#E89292]'
                    : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838]'
                }`}
              >
                {currentPersona.kanji.slice(0, 1)}
              </span>

              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="font-amiri font-bold text-sm sm:text-base leading-tight">
                    {currentPersona.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-inherit/20 font-kanji opacity-70">
                    {currentPersona.kanji}
                  </span>
                </div>
                <div className="text-[11px] opacity-60 font-sans-ui truncate max-w-[150px] sm:max-w-xs">
                  {currentPersona.subtitle}
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 opacity-60 group-hover:opacity-100 transition-transform duration-200 mr-1 ${
                  isPersonaDropdownOpen ? 'rotate-180 text-[#C46868]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isPersonaDropdownOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl p-2 z-40 animate-ink font-amiri ${
                  theme === 'dark'
                    ? 'bg-[#1C1C22] border-[#363645] text-[#E2D9C8]'
                    : 'bg-[#FAF4EB] border-[#DECDB7] text-[#2C241D]'
                }`}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold opacity-60 border-b border-inherit/15 mb-1.5 flex items-center justify-between">
                  <span>اختر الشخصية الأدبية</span>
                  <span className="font-kanji text-[10px]">登場人物の選択</span>
                </div>

                <div className="space-y-1">
                  {PERSONAS.map((persona) => {
                    const isSelected = selectedPersona === persona.id;
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => {
                          audioManager.playPaperRustle();
                          setSelectedPersona(persona.id);
                          setIsPersonaDropdownOpen(false);
                          if (activeSessionId) {
                            const updated = updateChatSession(activeSessionId, messages);
                            setSessions(updated);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-start gap-2.5 group ${
                          isSelected
                            ? theme === 'dark'
                              ? 'border-[#8B3A3A] bg-[#8B3A3A]/25 text-[#FAF6EE] font-bold shadow-sm'
                              : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838] font-bold shadow-sm'
                            : theme === 'dark'
                            ? 'border-transparent hover:bg-[#252530] opacity-80 hover:opacity-100'
                            : 'border-transparent hover:bg-[#EAE0D0] opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-kanji text-xs flex-shrink-0 mt-0.5 border ${
                            isSelected
                              ? theme === 'dark'
                                ? 'border-[#8B3A3A] bg-[#8B3A3A]/30 text-[#E89292]'
                                : 'border-[#7A3838] bg-[#7A3838]/20 text-[#7A3838]'
                              : 'border-inherit/20 bg-inherit/10'
                          }`}
                        >
                          {persona.kanji.slice(0, 1)}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm leading-tight">
                              {persona.title}
                            </span>
                            <span className="text-[10px] opacity-60 font-kanji">
                              {persona.kanji}
                            </span>
                          </div>
                          <div className="text-[11px] opacity-65 font-sans-ui mt-0.5 leading-snug truncate">
                            {persona.subtitle}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-[#C46868] flex-shrink-0 self-center" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: History, New Chat, Health check & Settings */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chat History Button (سجل المحادثات) */}
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                setIsHistoryModalOpen(true);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-amiri font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                theme === 'dark'
                  ? 'bg-[#22222B] hover:bg-[#2C2C38] border-[#363645] text-[#FAF6EE]'
                  : 'bg-[#EFE5D5] hover:bg-[#E4D7C3] border-[#D6C4AD] text-[#3D3025]'
              }`}
              title="عرض سجل المحادثات والجلسات السابقة"
            >
              <History className="w-3.5 h-3.5 text-[#C46868]" />
              <span>سجل المحادثات</span>
              <span className="px-1.5 py-0.2 rounded-full bg-inherit/20 text-[10px] font-sans-ui">
                {sessions.length}
              </span>
            </button>

            {/* New Conversation Button */}
            <button
              onClick={() => handleCreateNewChat(selectedPersona)}
              className={`px-3 py-2 rounded-xl border text-xs font-amiri font-bold flex items-center gap-1.5 transition-all ${
                theme === 'dark'
                  ? 'border-[#8B3A3A]/40 bg-[#8B3A3A]/15 text-[#E89292] hover:bg-[#8B3A3A]/25'
                  : 'border-[#7A3838]/30 bg-[#7A3838]/10 text-[#7A3838] hover:bg-[#7A3838]/20'
              }`}
              title="بدء جلسة حوار جديدة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>حوار جديد</span>
            </button>

            {/* Delete Current Conversation Button */}
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                setIsConfirmingDeleteCurrent(!isConfirmingDeleteCurrent);
              }}
              className={`p-2 rounded-xl border text-xs font-amiri transition-all ${
                isConfirmingDeleteCurrent
                  ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                  : theme === 'dark'
                  ? 'border-[#33333F] hover:border-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 text-[#A89E90]'
                  : 'border-[#DECDB7] hover:border-rose-500/60 hover:text-rose-600 hover:bg-rose-500/10 text-[#6B5A4B]'
              }`}
              title="حذف هذه المحادثة الحالية"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Quick Live Provider Status Pill */}
            <button
              onClick={handleQuickHealthCheck}
              disabled={liveProviderStatus === 'testing'}
              className={`px-2.5 py-2 rounded-xl text-xs font-amiri flex items-center gap-1.5 border transition-all ${
                liveProviderStatus === 'online'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : liveProviderStatus === 'offline'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : liveProviderStatus === 'testing'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : theme === 'dark'
                  ? 'border-[#33333F] hover:bg-[#252530] text-[#A89E90]'
                  : 'border-[#DECDB7] hover:bg-[#EFE4D3] text-[#6B5A4B]'
              }`}
              title="فحص فوري لحالة المزود ومفتاح API"
            >
              {liveProviderStatus === 'testing' ? (
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              ) : liveProviderStatus === 'online' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ) : liveProviderStatus === 'offline' ? (
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              ) : (
                <Activity className="w-3 h-3 text-[#C46868]" />
              )}
              <span className="text-[11px] hidden sm:inline">
                {liveProviderStatus === 'testing'
                  ? 'فحص...'
                  : liveProviderStatus === 'online'
                  ? `متصل (${liveLatency || 120}ms)`
                  : liveProviderStatus === 'offline'
                  ? 'غير متصل'
                  : `فحص (${aiConfig.provider})`}
              </span>
            </button>

            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 font-amiri ${
                theme === 'dark'
                  ? 'border-[#33333F] hover:bg-[#252530] text-[#C5BAA8]'
                  : 'border-[#DECDB7] hover:bg-[#EFE4D3] text-[#55473B]'
              }`}
              title="إعدادات مزود الذكاء الاصطناعي والمفاتيح المحلية"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C46868]" />
              <span className="text-[11px] hidden md:inline">الإعدادات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Current Conversation Banner */}
      {isConfirmingDeleteCurrent && (
        <div className="mb-2.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-amiri flex items-center justify-between gap-3 animate-ink shadow-sm">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold">هل أنت متأكد من حذف هذه المحادثة الحالية؟</span>
            <span className="opacity-75 text-[11px] hidden sm:inline">
              (سيتم حذف رسائل الجلسة والبدء بمحادثة جديدة)
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDeleteCurrentChat}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-sm"
            >
              نعم، احذف المحادثة
            </button>
            <button
              onClick={() => setIsConfirmingDeleteCurrent(false)}
              className="px-3 py-1.5 rounded-xl border border-inherit/30 hover:bg-inherit/15 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Inline Diagnostic Error / Warning Alert */}
      {errorMsg && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-amiri flex items-center justify-between animate-ink">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleQuickHealthCheck}
              className="text-[11px] underline hover:text-rose-100"
            >
              فحص المزود
            </button>
            <button
              onClick={onOpenSettings}
              className="text-[11px] underline text-[#E89292] hover:text-white"
            >
              فتح الإعدادات
            </button>
            <button
              onClick={() => setErrorMsg(null)}
              className="opacity-70 hover:opacity-100 text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Spacious, Highly Readable Messages Thread */}
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 rounded-2xl border space-y-5 transition-colors shadow-inner ${
          theme === 'dark'
            ? 'bg-[#141417]/85 border-[#262630]'
            : 'bg-[#F5EDE0]/85 border-[#E2D5C0]'
        }`}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-70">
            <Sparkles className="w-10 h-10 text-[#C46868] mb-3 opacity-60 animate-pulse" />
            <h3 className="font-amiri text-xl font-bold">المجلس الأدبي هادئ الليلة</h3>
            <p className="text-sm max-w-md mt-1.5 leading-relaxed font-amiri">
              اختر سؤالاً من الأسئلة المقترحة أدناه أو شارك دازاي بما يشغل بالك لتبدأ هذه الجلسة.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isPlaying = playingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-ink group`}
              >
                {!isUser && (
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex-shrink-0 flex items-center justify-center font-kanji text-sm select-none mt-1 shadow-sm ${
                      theme === 'dark'
                        ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#E89292]'
                        : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838]'
                    }`}
                  >
                    太
                  </div>
                )}

                <div
                  className={`w-full max-w-[92%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl p-4 sm:p-5 text-base border shadow-sm transition-all ${
                    isUser
                      ? theme === 'dark'
                        ? 'bg-[#8B3A3A]/25 border-[#8B3A3A]/40 text-[#FAF6EE] rounded-tl-sm'
                        : 'bg-[#7A3838]/20 border-[#7A3838]/40 text-[#2C241D] rounded-tl-sm'
                      : theme === 'dark'
                      ? 'bg-[#1C1C23] border-[#2E2E3B] text-[#FAF6EE] rounded-tr-sm hover:border-[#3D3D4E]'
                      : 'bg-[#FAF5ED] border-[#DDD0BC] text-[#2C241D] rounded-tr-sm hover:border-[#CFC0A8]'
                  }`}
                >
                  {/* Message Content with Elegant Typography and generous leading */}
                  <div className="font-amiri text-base sm:text-lg leading-[1.8] tracking-wide whitespace-pre-wrap select-text">
                    {msg.content}
                  </div>

                  {/* Message Action Bar for Assistant */}
                  {!isUser && (
                    <div className="mt-3.5 pt-2.5 border-t border-inherit/15 flex items-center justify-between text-xs opacity-65 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2">
                        <span className="font-kanji text-[11px]">
                          {msg.providerUsed ? `· ${msg.providerUsed}` : 'أوسامو دازاي'}
                        </span>
                        <span className="text-[10px] opacity-60 font-sans-ui">
                          {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSpeech(msg.id, msg.content)}
                          className="p-1.5 rounded-lg hover:bg-inherit/15 transition-colors flex items-center gap-1 text-[11px] font-amiri"
                          title="قراءة صوتية بصوت هادئ"
                        >
                          {isPlaying ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-[#C46868]" />
                              <span className="text-[#C46868]">إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>استماع</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="px-2 py-1 rounded-lg hover:bg-inherit/15 transition-colors flex items-center gap-1 text-[11px] font-amiri"
                          title="نسخ الرد الأدبي"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-sans-ui">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="font-sans-ui">نسخ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex-shrink-0 flex items-center justify-center font-sans text-xs select-none mt-1 opacity-80 shadow-sm ${
                      theme === 'dark'
                        ? 'border-[#333342] bg-[#22222B] text-[#C5BAA8]'
                        : 'border-[#DECDB7] bg-[#EBE0D0] text-[#55473B]'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-sm opacity-80 animate-pulse font-amiri p-3 rounded-xl bg-black/10 max-w-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C46868] animate-ping" />
            <span>دازاي يغمس ريشته في الحبر ويكتب تأمله...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries / Quick Prompts */}
      <div className="py-2.5 overflow-x-auto flex items-center gap-2 no-scrollbar">
        {quickPrompts[selectedPersona].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-amiri border transition-all shadow-sm ${
              theme === 'dark'
                ? 'bg-[#1C1C22] border-[#2C2C38] text-[#C5BAA8] hover:border-[#8B3A3A] hover:text-[#FAF6EE] hover:bg-[#252530]'
                : 'bg-[#FAF4EB] border-[#DECDB7] text-[#55473B] hover:border-[#7A3838] hover:text-[#2C241D] hover:bg-[#F2E5D3]'
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Spacious Input Bar with Clear Typography */}
      <div
        className={`p-2 sm:p-3 rounded-2xl border transition-colors flex items-center gap-2.5 shadow-md ${
          theme === 'dark'
            ? 'bg-[#1A1A1E] border-[#2D2D3A]'
            : 'bg-[#FAF4EB] border-[#DECDB7]'
        }`}
      >
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={`اكتب رسالتك أو تأملك إلى ${currentPersona.title}... (اضغط Enter للإرسال)`}
          rows={1}
          className="flex-1 bg-transparent resize-none border-0 outline-none text-base font-amiri placeholder:opacity-40 px-3 py-1.5 max-h-32 leading-relaxed"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || isLoading}
          className={`p-3 rounded-xl transition-all flex items-center justify-center ${
            inputValue.trim() && !isLoading
              ? theme === 'dark'
                ? 'bg-[#8B3A3A] text-white shadow-md hover:bg-[#9F4242]'
                : 'bg-[#7A3838] text-white shadow-md hover:bg-[#8F4343]'
              : 'opacity-40 cursor-not-allowed'
          }`}
          title="إرسال الرسالة"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleCreateNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        theme={theme}
      />
    </div>
  );
};
