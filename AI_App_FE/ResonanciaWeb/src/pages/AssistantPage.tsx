import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiAstrologyChat } from '../services/api';
import UiIcon from '../components/UiIcon';

interface FeatureLink {
  to: string;
  label: string;
  keywords: string[];
}

interface AssistantMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  relatedFeatures?: FeatureLink[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AssistantMessage[];
}

const FEATURE_LINKS: FeatureLink[] = [
  { to: '/tarot', label: 'Mở Tarot', keywords: ['tarot', 'bói bài', 'trải bài'] },
  { to: '/natal', label: 'Mở Bản Đồ Sao', keywords: ['bản đồ sao', 'lá số', 'natal', 'birth chart'] },
  { to: '/match', label: 'Mở Ghép Đôi', keywords: ['ghép đôi', 'ghép cặp', 'match', 'soulmate'] },
  { to: '/chat', label: 'Mở Trò Chuyện', keywords: ['trò chuyện', 'nhắn tin', 'chat'] },
  { to: '/synastry', label: 'Mở Bản Đồ Đôi', keywords: ['bản đồ đôi', 'synastry', 'độ hợp nhau', 'tương hợp'] },
  { to: '/transit', label: 'Mở Vận Hạn', keywords: ['vận hạn', 'transit', 'quá cảnh'] },
  { to: '/prediction', label: 'Mở Dự Đoán', keywords: ['dự đoán', 'horoscope', 'tử vi hôm nay'] },
  { to: '/notifications', label: 'Mở Thông Báo', keywords: ['thông báo', 'lời mời'] },
  { to: '/glossary', label: 'Mở Từ Điển Chiêm Tinh', keywords: ['từ điển', 'glossary', 'cung hoàng đạo', 'zodiac'] },
  { to: '/journal', label: 'Mở Nhật Ký Vũ Trụ', keywords: ['nhật ký', 'journal', 'ghi chép'] },
];

const STARTER_PROMPTS = [
  'Tarot là gì?',
  'Lá số của tôi là gì?',
  'Mở bản đồ sao của tôi',
  'Resonancia ghép đôi như thế nào?',
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function findRelatedFeatures(prompt: string) {
  const normalizedPrompt = normalizeText(prompt);
  return FEATURE_LINKS.filter((feature) =>
    feature.keywords.some((keyword) => normalizedPrompt.includes(normalizeText(keyword)))
  );
}

const getStorageKey = (uid?: string) => `resonancia_ai_sessions_${uid || 'guest'}`;

function loadSessionsFromStorage(uid?: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(uid: string | undefined, sessions: ChatSession[]) {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save sessions to localStorage:', err);
  }
}

function formatSessionTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Hôm nay ${timeStr}`;
  if (isYesterday) return `Hôm qua ${timeStr}`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function AssistantPage() {
  const profile = useSelector((state: RootState) => state.profile);

  // Chat sessions state (CRUD)
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sidebar UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  // Load chat sessions on mount or when user changes
  useEffect(() => {
    const stored = loadSessionsFromStorage(profile.uid);
    if (stored.length > 0) {
      setSessions(stored);
      setActiveSessionId(stored[0].id);
      setMessages(stored[0].messages || []);
    } else {
      const initialId = `session_${Date.now()}`;
      const initialSession: ChatSession = {
        id: initialId,
        title: 'Cuộc trò chuyện mới',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setSessions([initialSession]);
      setActiveSessionId(initialId);
      setMessages([]);
      saveSessionsToStorage(profile.uid, [initialSession]);
    }
  }, [profile.uid]);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, [activeSessionId]);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) {
      conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // CREATE: Tạo cuộc trò chuyện mới
  const handleCreateNewSession = () => {
    const current = sessions.find((s) => s.id === activeSessionId);
    if (current && current.messages.length === 0) {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      textareaRef.current?.focus();
      return;
    }

    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Cuộc trò chuyện mới',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    const nextSessions = [newSession, ...sessions];
    setSessions(nextSessions);
    setActiveSessionId(newId);
    setMessages([]);
    setError('');
    setPrompt('');
    saveSessionsToStorage(profile.uid, nextSessions);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // READ: Chọn cuộc trò chuyện từ danh sách
  const handleSelectSession = (sessionId: string) => {
    if (sessionId === activeSessionId) {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      return;
    }
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setActiveSessionId(sessionId);
      setMessages(target.messages || []);
      setError('');
      setPrompt('');
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // UPDATE: Đổi tên cuộc trò chuyện
  const handleStartRename = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === sessionId ? { ...s, title: trimmed, updatedAt: Date.now() } : s
        );
        saveSessionsToStorage(profile.uid, next);
        return next;
      });
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // DELETE: Xóa một cuộc trò chuyện
  const handleDeleteSession = (sessionId: string) => {
    let nextSessions = sessions.filter((s) => s.id !== sessionId);

    if (sessionId === activeSessionId) {
      if (nextSessions.length > 0) {
        setActiveSessionId(nextSessions[0].id);
        setMessages(nextSessions[0].messages || []);
      } else {
        const freshId = `session_${Date.now()}`;
        const freshSession: ChatSession = {
          id: freshId,
          title: 'Cuộc trò chuyện mới',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        nextSessions = [freshSession];
        setActiveSessionId(freshId);
        setMessages([]);
      }
    }

    setSessions(nextSessions);
    saveSessionsToStorage(profile.uid, nextSessions);
    setConfirmingDeleteId(null);
  };

  // DELETE ALL: Xóa tất cả lịch sử
  const handleClearAllSessions = () => {
    const freshId = `session_${Date.now()}`;
    const freshSession: ChatSession = {
      id: freshId,
      title: 'Cuộc trò chuyện mới',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const nextSessions = [freshSession];
    setSessions(nextSessions);
    setActiveSessionId(freshId);
    setMessages([]);
    saveSessionsToStorage(profile.uid, nextSessions);
    setConfirmingClearAll(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // Helper sync session messages to sessions list & storage
  const syncSessionMessages = (targetSessionId: string, updatedMessages: AssistantMessage[], firstUserPrompt?: string) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === targetSessionId);
      let next: ChatSession[];
      if (idx >= 0) {
        const current = prev[idx];
        const isFirstUserMsg = current.messages.length === 0 && Boolean(firstUserPrompt);
        const newTitle = isFirstUserMsg && firstUserPrompt
          ? (firstUserPrompt.length > 30 ? firstUserPrompt.slice(0, 30) + '...' : firstUserPrompt)
          : current.title;
        const updated: ChatSession = {
          ...current,
          title: newTitle,
          updatedAt: Date.now(),
          messages: updatedMessages,
        };
        next = [updated, ...prev.filter((s) => s.id !== targetSessionId)];
      } else {
        const newSession: ChatSession = {
          id: targetSessionId,
          title: firstUserPrompt
            ? (firstUserPrompt.length > 30 ? firstUserPrompt.slice(0, 30) + '...' : firstUserPrompt)
            : 'Cuộc trò chuyện mới',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: updatedMessages,
        };
        next = [newSession, ...prev];
      }
      saveSessionsToStorage(profile.uid, next);
      return next;
    });
  };

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const question = prompt.trim();
    if (!question || loading) return;

    const currentSessionId = activeSessionId || `session_${Date.now()}`;
    if (!activeSessionId) {
      setActiveSessionId(currentSessionId);
    }

    const conversation = [...messages, { id: Date.now(), role: 'user' as const, content: question }];
    const relatedFeatures = findRelatedFeatures(question);
    setMessages(conversation);
    setPrompt('');
    setError('');
    setLoading(true);

    // Lưu ngay tin nhắn của người dùng
    syncSessionMessages(currentSessionId, conversation, question);

    try {
      const response = await apiAstrologyChat({
        messages: conversation.map(({ role, content }) => ({ role, content })),
        userData: {
          name: profile.name || 'Bạn',
          sun: profile.sun,
          moon: profile.moon,
          ascendant: profile.ascendant,
        },
      });
      const answer = response.data?.answer || response.data?.prediction || 'Mình chưa có câu trả lời cho câu hỏi này.';
      const backendActions = response.data?.actions || (response.data?.action ? [response.data.action] : []);
      const mappedBackendFeatures = backendActions
        .filter((a: any) => a && a.route && a.label)
        .map((a: any) => ({
          to: a.route,
          label: a.label,
          keywords: [],
        }));
      const answerFeatures = mappedBackendFeatures.length
        ? mappedBackendFeatures
        : (relatedFeatures.length ? relatedFeatures : findRelatedFeatures(answer));
      const finalMessages: AssistantMessage[] = [
        ...conversation,
        { id: Date.now() + 1, role: 'assistant', content: answer, relatedFeatures: answerFeatures },
      ];
      setMessages(finalMessages);
      syncSessionMessages(currentSessionId, finalMessages);
    } catch {
      setError('Hiện chưa kết nối được với trợ lý. Bạn vẫn có thể mở trực tiếp tính năng liên quan bên dưới.');
      const finalMessages: AssistantMessage[] = [
        ...conversation,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Mình chưa nhận được phản hồi lúc này.',
          relatedFeatures,
        },
      ];
      setMessages(finalMessages);
      syncSessionMessages(currentSessionId, finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const contentMatch = s.messages.some((m) => m.content.toLowerCase().includes(q));
    return titleMatch || contentMatch;
  });

  return (
    <section className="astrica-assistant-page" aria-label="Resonancia AI">
      {/* Heading slot */}
      <header className="astrica-assistant-heading">
        <div className="flex items-center gap-3">
          <img src="/astrica/images/6870b7473503e2e6d021b012_Nav_icon.svg" alt="" aria-hidden="true" />
          <div>
            <h1>Resonancia AI</h1>
            <p>Hỏi về chiêm tinh hoặc mở nhanh một tính năng</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="astrica-assistant-history-btn"
            aria-label="Lịch sử trò chuyện"
            title={isSidebarOpen ? 'Đóng thanh lịch sử' : 'Mở thanh lịch sử'}
          >
            <UiIcon name="history" label="Lịch sử" className="text-sm text-purple-300" />
            <span className="hidden sm:inline">Lịch sử</span>
            {sessions.length > 0 && (
              <span className="astrica-assistant-badge">{sessions.length}</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleCreateNewSession}
            className="astrica-assistant-newchat-btn"
            aria-label="Cuộc trò chuyện mới"
            title="Cuộc trò chuyện mới"
          >
            <UiIcon name="plus" label="Tạo mới" className="text-xs" />
            <span className="hidden xs:inline">Đoạn chat mới</span>
          </button>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="astrica-assistant-layout">
        {/* Mobile backdrop */}
        {isSidebarOpen && (
          <div
            className="astrica-assistant-sidebar-backdrop md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Thanh bên (Sidebar) Lịch sử trò chuyện */}
        <aside
          className={`astrica-assistant-sidebar ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}
          aria-label="Lịch sử cuộc trò chuyện"
        >
          {/* Sidebar Header */}
          <div className="astrica-assistant-sidebar-header">
            <div className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
              <UiIcon name="history" label="Lịch sử" className="text-purple-400" />
              <span>Lịch Sử Trò Chuyện</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCreateNewSession}
                className="astrica-sidebar-action-btn"
                title="Tạo cuộc trò chuyện mới"
                aria-label="Tạo cuộc trò chuyện mới"
              >
                <UiIcon name="plus" label="Tạo mới" className="text-xs text-purple-300" />
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="astrica-sidebar-action-btn md:hidden"
                title="Đóng thanh bên"
                aria-label="Đóng thanh bên"
              >
                <UiIcon name="close" label="Đóng" className="text-xs text-purple-300" />
              </button>
            </div>
          </div>

          {/* Search/Filter bar */}
          <div className="astrica-sidebar-search-wrap">
            <div className="relative flex items-center">
              <UiIcon
                name="search"
                label="Tìm kiếm"
                className="absolute left-2.5 text-xs text-purple-300/60 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trong lịch sử..."
                className="astrica-sidebar-search-input"
                aria-label="Tìm kiếm cuộc trò chuyện"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-purple-300/60 hover:text-white text-xs"
                  aria-label="Xóa tìm kiếm"
                >
                  <UiIcon name="close" label="Xóa" />
                </button>
              )}
            </div>
          </div>

          {/* Sessions List */}
          <div className="astrica-sidebar-list" role="list">
            {filteredSessions.length === 0 ? (
              <div className="astrica-sidebar-empty">
                <UiIcon name="message" label="Trống" className="text-2xl text-purple-400/40 mb-1" />
                <p>{searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có lịch sử trò chuyện'}</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  role="listitem"
                  className={`astrica-sidebar-item ${session.id === activeSessionId ? 'is-active' : ''}`}
                >
                  {editingSessionId === session.id ? (
                    /* Chế độ sửa tên (Inline Rename) */
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id);
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        autoFocus
                        className="astrica-sidebar-edit-input"
                        aria-label="Tên cuộc trò chuyện"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(session.id)}
                        className="astrica-sidebar-mini-btn text-emerald-400 hover:text-emerald-300"
                        title="Lưu"
                        aria-label="Lưu tên mới"
                      >
                        <UiIcon name="check" label="Lưu" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="astrica-sidebar-mini-btn text-rose-400 hover:text-rose-300"
                        title="Hủy"
                        aria-label="Hủy chỉnh sửa"
                      >
                        <UiIcon name="close" label="Hủy" />
                      </button>
                    </div>
                  ) : confirmingDeleteId === session.id ? (
                    /* Chế độ xác nhận xóa (Inline Confirm Delete) */
                    <div className="flex items-center justify-between w-full text-xs text-rose-300 px-1 py-0.5">
                      <span>Xóa đoạn chat này?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(session.id)}
                          className="astrica-sidebar-mini-btn bg-rose-900/60 text-rose-200 hover:bg-rose-800/80 hover:text-white px-2 py-0.5 rounded text-[11px]"
                          title="Xác nhận xóa"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          className="astrica-sidebar-mini-btn text-purple-300/80 hover:text-white px-1.5 py-0.5 text-[11px]"
                          title="Hủy"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Hiển thị bình thường */
                    <div
                      className="flex items-center justify-between w-full group/item"
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1 pr-1 cursor-pointer">
                        <UiIcon
                          name="message"
                          label=""
                          className={`mt-0.5 text-xs flex-shrink-0 ${
                            session.id === activeSessionId ? 'text-purple-300' : 'text-purple-400/60'
                          }`}
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="astrica-sidebar-item-title" title={session.title}>
                            {session.title || 'Cuộc trò chuyện'}
                          </p>
                          <span className="astrica-sidebar-item-time">
                            {formatSessionTime(session.updatedAt || session.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Các nút CRUD: Đổi tên & Xóa */}
                      <div
                        className="astrica-sidebar-item-actions flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleStartRename(session)}
                          className="astrica-sidebar-item-btn hover:text-purple-200"
                          title="Đổi tên"
                          aria-label={`Đổi tên ${session.title}`}
                        >
                          <UiIcon name="edit" label="Đổi tên" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(session.id)}
                          className="astrica-sidebar-item-btn hover:text-rose-400"
                          title="Xóa cuộc trò chuyện"
                          aria-label={`Xóa ${session.title}`}
                        >
                          <UiIcon name="trash" label="Xóa" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          {sessions.length > 0 && (
            <div className="astrica-sidebar-footer">
              <span className="text-[11px] text-purple-300/60">
                {sessions.length} cuộc trò chuyện
              </span>
              {confirmingClearAll ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-rose-300">Xóa hết?</span>
                  <button
                    type="button"
                    onClick={handleClearAllSessions}
                    className="text-[10px] text-rose-300 hover:text-rose-100 font-semibold underline"
                  >
                    Có
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClearAll(false)}
                    className="text-[10px] text-purple-300/80 hover:text-white ml-1"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingClearAll(true)}
                  className="text-[11px] text-purple-400/70 hover:text-rose-300 transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Khung chat chính (Main conversation & composer) */}
        <div className="astrica-assistant-main">
          {/* Conversation slot */}
          <div
            ref={conversationRef}
            className="astrica-assistant-conversation"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="astrica-assistant-welcome">
                <h2>Bạn muốn khám phá điều gì?</h2>
                <p>Hỏi Resonancia AI hoặc chọn một gợi ý để bắt đầu.</p>
                <div className="astrica-starter-prompts">
                  {STARTER_PROMPTS.map((starter) => (
                    <button key={starter} type="button" onClick={() => setPrompt(starter)}>
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="astrica-assistant-messages">
                {messages.map((message) => (
                  <article key={message.id} className={`astrica-message astrica-message-${message.role}`}>
                    {message.role === 'assistant' && (
                      <img
                        className="astrica-message-avatar"
                        src="/astrica/images/6870b7473503e2e6d021b012_Nav_icon.svg"
                        alt=""
                        aria-hidden="true"
                      />
                    )}
                    <div className="astrica-message-body">
                      <p>{message.content}</p>
                      {Boolean(message.relatedFeatures?.length) && (
                        <div className="astrica-related-links">
                          <span>Tính năng liên quan</span>
                          <div>
                            {message.relatedFeatures?.map((feature) => (
                              <Link key={feature.to} to={feature.to}>
                                {feature.label}
                                <img src="/astrica/images/687774a75b297b454d3aa551_arrow_right-right.svg" alt="" aria-hidden="true" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {loading && (
                  <div className="astrica-assistant-loading" role="status" aria-label="Resonancia AI đang trả lời">
                    <img src="/astrica/images/6870b7473503e2e6d021b012_Nav_icon.svg" alt="" aria-hidden="true" />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer slot */}
          <div className="astrica-assistant-composer-wrap">
            {error && <p className="astrica-assistant-error" role="status">{error}</p>}
            <form className="astrica-assistant-composer" onSubmit={(event) => void sendMessage(event)}>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Hỏi Resonancia AI..."
                aria-label="Tin nhắn cho Resonancia AI"
                rows={1}
                disabled={loading}
              />
              <button type="submit" disabled={!prompt.trim() || loading} aria-label="Gửi tin nhắn">
                <img src="/astrica/images/687774a75b297b454d3aa551_arrow_right-right.svg" alt="" aria-hidden="true" />
              </button>
            </form>
            <p className="astrica-assistant-hint">Enter để gửi · Shift + Enter để xuống dòng</p>
          </div>
        </div>
      </div>
    </section>
  );
}
