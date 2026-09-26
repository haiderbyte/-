import React, { useState } from 'react';
import { ChatSession, PersonaType } from '../types';
import { PERSONAS } from '../data/quotesData';
import {
  History,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Search,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { audioManager } from '../utils/sound';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: (persona?: PersonaType) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions?: () => void;
  theme: 'dark' | 'sepia';
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAllSessions,
  theme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPersona, setFilterPersona] = useState<PersonaType | 'all'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    const matchesPersona = filterPersona === 'all' || s.persona === filterPersona;
    const matchesSearch =
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPersona && matchesSearch;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return `اليوم ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    audioManager.playInkDrop();
    onDeleteSession(id);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-ink overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-4 sm:p-6 transition-all duration-300 font-amiri ${
          theme === 'dark'
            ? 'bg-[#18181D] border-[#2E2E39] text-[#E2D9C8]'
            : 'bg-[#FAF4EB] border-[#DECDB7] text-[#2C241D]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-inherit/20">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#E89292]'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838]'
              }`}
            >
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">سجل المحادثات الأدبية</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-inherit/15 font-sans-ui border border-inherit/25">
                  {sessions.length} حوار
                </span>
              </div>
              <p className="text-[11px] opacity-65 font-kanji mt-0.5">
                تصفح، احذف، واستعد جلسات الحوار السابقة مع دازاي وشخصيات الرواية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                onNewSession();
                onClose();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                theme === 'dark'
                  ? 'bg-[#8B3A3A] hover:bg-[#9F4242] text-white'
                  : 'bg-[#7A3838] hover:bg-[#8F4343] text-white'
              }`}
              title="بدء جلسة حوار أدبية جديدة"
            >
              <Plus className="w-4 h-4" />
              <span>حوار جديد</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-inherit/10 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في سجل وعناوين المحادثات..."
              className="w-full pl-3 pr-9 py-2 rounded-xl text-xs border border-inherit/20 bg-black/10 focus:outline-none focus:border-[#C46868] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setFilterPersona('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
                filterPersona === 'all'
                  ? theme === 'dark'
                    ? 'bg-[#8B3A3A]/25 text-[#FAF6EE] font-bold border border-[#8B3A3A]/40'
                    : 'bg-[#7A3838]/20 text-[#7A3838] font-bold border border-[#7A3838]/30'
                  : 'opacity-65 hover:opacity-100 hover:bg-inherit/10'
              }`}
            >
              الكل
            </button>
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPersona(p.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
                  filterPersona === p.id
                    ? theme === 'dark'
                      ? 'bg-[#8B3A3A]/25 text-[#FAF6EE] font-bold border border-[#8B3A3A]/40'
                      : 'bg-[#7A3838]/20 text-[#7A3838] font-bold border border-[#7A3838]/30'
                    : 'opacity-65 hover:opacity-100 hover:bg-inherit/10'
                }`}
              >
                {p.title.replace('روح ', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Clear All Confirmation Banner */}
        {isConfirmingClearAll && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3 animate-ink">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>هل أنت متأكد من حذف جميع المحادثات المسجلة نهائياً؟</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (onClearAllSessions) {
                    onClearAllSessions();
                  }
                  setIsConfirmingClearAll(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-sm"
              >
                نعم، احذف الكل
              </button>
              <button
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-2.5 py-1 rounded-lg border border-inherit/20 hover:bg-inherit/10 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-0.5">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center opacity-60">
              <MessageSquare className="w-10 h-10 mx-auto mb-2.5 opacity-40 text-[#C46868]" />
              <p className="text-sm font-bold">لا توجد محادثات</p>
              <p className="text-xs opacity-75 mt-1">
                يمكنك الضغط على زر «حوار جديد» للبدء بجلسة أدبية جديدة.
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const personaData = PERSONAS.find((p) => p.id === session.persona) || PERSONAS[0];
              const isActive = session.id === activeSessionId;
              const lastMessage = session.messages[session.messages.length - 1];
              const isDeleting = confirmDeleteId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (isDeleting) return;
                    audioManager.playPaperRustle();
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3 ${
                    isActive
                      ? theme === 'dark'
                        ? 'border-[#8B3A3A] bg-[#8B3A3A]/15 shadow-sm'
                        : 'border-[#7A3838] bg-[#7A3838]/10 shadow-sm'
                      : theme === 'dark'
                      ? 'border-[#262630] bg-[#141417]/60 hover:bg-[#1E1E24] hover:border-inherit/40'
                      : 'border-[#DECDB7] bg-[#F4EBDE]/60 hover:bg-[#EAE0D0] hover:border-inherit/40'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-kanji text-xs flex-shrink-0 mt-0.5 border ${
                        theme === 'dark'
                          ? 'border-[#8B3A3A]/50 bg-[#8B3A3A]/20 text-[#E89292]'
                          : 'border-[#7A3838]/40 bg-[#7A3838]/15 text-[#7A3838]'
                      }`}
                    >
                      {personaData.kanji.slice(0, 1)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-sm leading-tight truncate">
                          {session.title}
                        </h4>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-sans-ui border border-emerald-500/30">
                            الحالية
                          </span>
                        )}
                        <span className="text-[10px] opacity-60 font-kanji">
                          · {personaData.title}
                        </span>
                      </div>

                      {lastMessage && (
                        <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                          {lastMessage.content}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] opacity-55 font-sans-ui mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(session.updatedAt)}</span>
                        </span>
                        <span>·</span>
                        <span>{session.messages.length} رسالة</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions area with Inline Deletion Confirmation */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                    {isDeleting ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 p-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs animate-ink"
                      >
                        <span className="text-[11px] px-1 font-bold">تأكيد الحذف؟</span>
                        <button
                          onClick={(e) => handleConfirmDelete(session.id, e)}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
                          title="تأكيد حذف المحادثة"
                        >
                          نعم
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          className="px-2 py-1 rounded-lg hover:bg-white/10 transition-colors opacity-75 hover:opacity-100"
                          title="إلغاء الحذف"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(session.id);
                          }}
                          className="p-2 rounded-lg opacity-40 hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="حذف هذه المحادثة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-[-2px] transition-all" />
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-inherit/20 flex items-center justify-between text-xs opacity-80 flex-wrap gap-2">
          {sessions.length > 0 && onClearAllSessions ? (
            <button
              onClick={() => setIsConfirmingClearAll(true)}
              className="text-rose-400/80 hover:text-rose-400 hover:underline flex items-center gap-1 transition-colors text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح كل المحادثات ({sessions.length})</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 font-kanji text-[11px] opacity-70">
              <Sparkles className="w-3.5 h-3.5 text-[#C46868]" />
              <span>يتم حفظ الجلسات محلياً في جهازك</span>
            </div>
          )}

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-bold transition-colors ${
              theme === 'dark'
                ? 'bg-[#22222B] hover:bg-[#2C2C38] text-[#E2D9C8]'
                : 'bg-[#EAE0D0] hover:bg-[#DDD2BF] text-[#2C241D]'
            }`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
