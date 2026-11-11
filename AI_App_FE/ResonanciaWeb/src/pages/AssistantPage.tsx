import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiAstrologyChat } from '../services/api';
import { useVoiceChat } from '../hooks/useVoiceChat';

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

interface ChatSession {
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

const STORAGE_KEY_PREFIX = 'resonancia_ai_sessions_';

function getStorageKey(uid?: string) {
  return `${STORAGE_KEY_PREFIX}${uid || 'guest'}`;
}

function loadSessions(uid?: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[], uid?: string) {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(sessions));
  } catch {}
}

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

export default function AssistantPage() {
  const profile = useSelector((state: RootState) => state.profile);
  const authUser = useSelector((state: RootState) => state.auth);
  const currentUid = profile.uid || authUser.uid || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const currentSessionIdRef = useRef<string>('');
  currentSessionIdRef.current = currentSessionId;

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isHandsFree, setIsHandsFree] = useState(false);

  const isHandsFreeRef = useRef(false);
  isHandsFreeRef.current = isHandsFree;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const {
    isSupported,
    isListening,
    isSpeaking,
    speakingMessageId,
    voiceError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceChat();

  // Khởi tạo và tải lịch sử cuộc trò chuyện từ localStorage
  useEffect(() => {
    const loaded = loadSessions(currentUid);
    if (loaded.length > 0) {
      setSessions(loaded);
      const firstSession = loaded[0];
      setCurrentSessionId(firstSession.id);
      currentSessionIdRef.current = firstSession.id;
      setMessages(firstSession.messages || []);
    } else {
      const freshId = `sess_${Date.now()}`;
      const initialSession: ChatSession = {
        id: freshId,
        title: 'Cuộc trò chuyện mới',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setSessions([initialSession]);
      setCurrentSessionId(freshId);
      currentSessionIdRef.current = freshId;
      setMessages([]);
      saveSessions([initialSession], currentUid);
    }
  }, [currentUid]);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) {
      conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loadingSessionId]);

  // Cập nhật messages và title vào ĐÚNG session theo ID (tránh bị lẫn khi chuyển cuộc trò chuyện)
  const updateSessionMessages = (targetSessionId: string, newMessages: AssistantMessage[], firstPrompt?: string) => {
    setSessions((prev) => {
      let found = false;
      const next = prev.map((s) => {
        if (s.id === targetSessionId) {
          found = true;
          let title = s.title;
          if ((!title || title === 'Cuộc trò chuyện mới') && firstPrompt) {
            title = firstPrompt.trim().slice(0, 32);
          }
          return {
            ...s,
            title,
            updatedAt: Date.now(),
            messages: newMessages,
          };
        }
        return s;
      });

      if (!found) {
        const created: ChatSession = {
          id: targetSessionId,
          title: firstPrompt ? firstPrompt.trim().slice(0, 32) : 'Cuộc trò chuyện mới',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: newMessages,
        };
        next.unshift(created);
      }

      saveSessions(next, currentUid);
      return next;
    });
  };

  /**
   * Tạo phiên trò chuyện mới kiểu ChatGPT
   */
  const handleNewChat = () => {
    stopSpeaking();
    stopListening();

    const freshId = `sess_${Date.now()}`;
    const freshSession: ChatSession = {
      id: freshId,
      title: 'Cuộc trò chuyện mới',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setSessions((prev) => {
      // Giữ lại các session đã có tin nhắn, loại bỏ session rỗng trùng lặp
      const filtered = prev.filter((s) => s.messages && s.messages.length > 0);
      const next = [freshSession, ...filtered];
      saveSessions(next, currentUid);
      return next;
    });

    setCurrentSessionId(freshId);
    currentSessionIdRef.current = freshId;
    setMessages([]);
    setPrompt('');
    setError('');

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  /**
   * Chuyển đổi an toàn giữa các cuộc trò chuyện cũ mà không làm mất hay lẫn tin nhắn
   */
  const handleSwitchSession = (sessionId: string) => {
    if (sessionId === currentSessionIdRef.current) {
      if (window.innerWidth <= 768) setSidebarOpen(false);
      return;
    }

    stopSpeaking();
    stopListening();

    setCurrentSessionId(sessionId);
    currentSessionIdRef.current = sessionId;

    // Tìm và nạp tin nhắn của đúng session được chọn
    const target = sessions.find((s) => s.id === sessionId);
    setMessages(target?.messages ? [...target.messages] : []);
    setPrompt('');
    setError('');

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  /**
   * Xóa một cuộc trò chuyện
   */
  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      saveSessions(next, currentUid);

      if (sessionId === currentSessionIdRef.current) {
        if (next.length > 0) {
          const nextSess = next[0];
          setCurrentSessionId(nextSess.id);
          currentSessionIdRef.current = nextSess.id;
          setMessages(nextSess.messages ? [...nextSess.messages] : []);
        } else {
          const freshId = `sess_${Date.now()}`;
          const freshSession: ChatSession = {
            id: freshId,
            title: 'Cuộc trò chuyện mới',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
          };
          setCurrentSessionId(freshId);
          currentSessionIdRef.current = freshId;
          setMessages([]);
          saveSessions([freshSession], currentUid);
          return [freshSession];
        }
      }
      return next;
    });
  };

  const isCurrentLoading = loadingSessionId === currentSessionId;

  const sendMessage = async (event?: FormEvent, customText?: string) => {
    event?.preventDefault();
    const question = (customText !== undefined ? customText : prompt).trim();
    if (!question || isCurrentLoading) return;

    // Khóa chặt SessionId của phiên chat hiện tại
    const targetSessionId = currentSessionIdRef.current;
    if (!targetSessionId) return;

    const conversation = [...messages, { id: Date.now(), role: 'user' as const, content: question }];
    const relatedFeatures = findRelatedFeatures(question);

    // Cập nhật giao diện và lưu trữ session
    setMessages(conversation);
    updateSessionMessages(targetSessionId, conversation, question);

    setPrompt('');
    setError('');
    setLoadingSessionId(targetSessionId);

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

      const newAssistantMsgId = Date.now() + 1;
      const updatedConversation: AssistantMessage[] = [
        ...conversation,
        { id: newAssistantMsgId, role: 'assistant', content: answer, relatedFeatures: answerFeatures },
      ];

      // Lưu kết quả vào đúng session gửi câu hỏi
      updateSessionMessages(targetSessionId, updatedConversation, question);

      // Chỉ cập nhật màn hình nếu người dùng vẫn đang xem phiên này
      if (currentSessionIdRef.current === targetSessionId) {
        setMessages(updatedConversation);

        // Đọc to nếu đang bật chế độ đối thoại rảnh tay
        if (isHandsFreeRef.current) {
          speak(answer, newAssistantMsgId, () => {
            if (isHandsFreeRef.current && currentSessionIdRef.current === targetSessionId) {
              startListening((voiceText, isFinal) => {
                setPrompt(voiceText);
                if (isFinal && voiceText.trim()) {
                  void sendMessage(undefined, voiceText.trim());
                }
              });
            }
          });
        }
      }
    } catch {
      const failMsg = 'Hiện chưa kết nối được với trợ lý. Bạn vẫn có thể mở trực tiếp tính năng liên quan bên dưới.';
      const failMsgId = Date.now() + 1;
      const updatedConversation: AssistantMessage[] = [
        ...conversation,
        {
          id: failMsgId,
          role: 'assistant',
          content: 'Mình chưa nhận được phản hồi lúc này.',
          relatedFeatures,
        },
      ];

      updateSessionMessages(targetSessionId, updatedConversation, question);

      if (currentSessionIdRef.current === targetSessionId) {
        setError(failMsg);
        setMessages(updatedConversation);
        if (isHandsFreeRef.current) {
          speak('Hiện chưa kết nối được với trợ lý, bạn hãy thử lại sau nhé.', failMsgId);
        }
      }
    } finally {
      setLoadingSessionId((cur) => (cur === targetSessionId ? null : cur));
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  /**
   * Bấm nút Micro để nói câu hỏi (Push-to-Talk)
   */
  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) {
        stopSpeaking();
      }
      startListening((voiceText, isFinal) => {
        setPrompt(voiceText);
        if (isFinal) {
          textareaRef.current?.focus();
        }
      });
    }
  };

  /**
   * Bật/tắt chế độ Đối Thoại Trực Tiếp (Hands-free Voice Call)
   */
  const toggleHandsFree = () => {
    if (isHandsFree) {
      setIsHandsFree(false);
      isHandsFreeRef.current = false;
      stopListening();
      stopSpeaking();
    } else {
      setIsHandsFree(true);
      isHandsFreeRef.current = true;
      if (isSpeaking) {
        stopSpeaking();
      }
      startListening((voiceText, isFinal) => {
        setPrompt(voiceText);
        if (isFinal && voiceText.trim()) {
          void sendMessage(undefined, voiceText.trim());
        }
      });
    }
  };

  /**
   * Đọc to câu trả lời của AI hoặc dừng phát
   */
  const handleToggleSpeak = (msgId: number, content: string) => {
    if (isSpeaking && speakingMessageId === msgId) {
      stopSpeaking();
    } else {
      speak(content, msgId);
    }
  };

  return (
    <section className="astrica-assistant-page" aria-label="Resonancia AI">
      {/* Heading slot */}
      <header className="astrica-assistant-heading">
        {/* Nút bật/tắt Lịch sử Chat kiểu ChatGPT */}
        <button
          type="button"
          className={`astrica-sidebar-toggle-btn ${sidebarOpen ? 'is-active' : ''}`}
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? 'Đóng lịch sử trò chuyện' : 'Mở lịch sử trò chuyện'}
          title={sidebarOpen ? 'Đóng lịch sử trò chuyện' : 'Lịch sử cuộc trò chuyện (như ChatGPT)'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>

        <img src="/astrica/images/6870b7473503e2e6d021b012_Nav_icon.svg" alt="" aria-hidden="true" />
        <div>
          <h1>Resonancia AI</h1>
          <p>Hỏi về chiêm tinh hoặc mở nhanh một tính năng</p>
        </div>

        {/* Nút bật/tắt Chế độ Đàm thoại Trực tiếp (Hands-free) */}
        {isSupported && (
          <div className="astrica-voice-toggle-wrap">
            <button
              type="button"
              className={`astrica-handsfree-btn ${isHandsFree ? 'is-active' : ''}`}
              onClick={toggleHandsFree}
              aria-pressed={isHandsFree}
              aria-label={isHandsFree ? 'Tắt đối thoại trực tiếp' : 'Bật đối thoại trực tiếp bằng giọng nói'}
              title={isHandsFree ? 'Tắt đối thoại trực tiếp' : 'Bật đối thoại 2 chiều rảnh tay'}
            >
              {isHandsFree ? (
                <span className="astrica-handsfree-dot" aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  <path d="M14.05 2a9 9 0 0 1 8 7.94" />
                  <path d="M14.05 6A5 5 0 0 1 18 10" />
                </svg>
              )}
              <span>{isHandsFree ? 'Đang đối thoại' : 'Đối thoại trực tiếp'}</span>
            </button>
          </div>
        )}
      </header>

      {/* Body: Sidebar Lịch sử + Khung Chat chính */}
      <div className="astrica-assistant-body">
        {/* Backdrop cho mobile khi mở sidebar */}
        {sidebarOpen && (
          <div
            className="astrica-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Lịch sử Chat kiểu ChatGPT */}
        <aside className={`astrica-assistant-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            className="astrica-new-chat-btn"
            onClick={handleNewChat}
            aria-label="Tạo cuộc trò chuyện mới"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Cuộc trò chuyện mới</span>
          </button>

          <span className="astrica-sidebar-label">Lịch sử trò chuyện</span>

          <div className="astrica-sidebar-history-list">
            {sessions.length === 0 ? (
              <p className="astrica-sidebar-empty">Chưa có lịch sử trò chuyện</p>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`astrica-history-item ${sess.id === currentSessionId ? 'is-active' : ''}`}
                  onClick={() => handleSwitchSession(sess.id)}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="astrica-history-title">{sess.title}</span>
                  <button
                    type="button"
                    className="astrica-history-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(sess.id);
                    }}
                    aria-label={`Xóa cuộc trò chuyện ${sess.title}`}
                    title="Xóa cuộc trò chuyện này"
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Khung chat chính */}
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

                      {/* Nút Loa nghe câu trả lời của AI */}
                      {message.role === 'assistant' && (
                        <button
                          type="button"
                          className={`astrica-speak-btn ${speakingMessageId === message.id ? 'is-speaking' : ''}`}
                          onClick={() => handleToggleSpeak(message.id, message.content)}
                          aria-label={speakingMessageId === message.id ? 'Dừng đọc' : 'Đọc to câu trả lời'}
                          title={speakingMessageId === message.id ? 'Dừng đọc' : 'Đọc to câu trả lời'}
                        >
                          {speakingMessageId === message.id ? (
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <line x1="22" x2="16" y1="9" y2="15" />
                              <line x1="16" x2="22" y1="9" y2="15" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </svg>
                          )}
                        </button>
                      )}

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
                {isCurrentLoading && (
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
            {/* Thanh trạng thái giọng nói mini khi đang nghe hoặc đọc */}
            {(isListening || isSpeaking || isHandsFree) && (
              <div className="astrica-voice-status-bar" role="status" aria-live="polite">
                <div className="astrica-voice-wave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span>
                  {isListening
                    ? 'Đang lắng nghe bạn nói... Hãy đặt câu hỏi.'
                    : isSpeaking
                    ? 'AstroBot đang phát âm thanh câu trả lời...'
                    : 'Chế độ đối thoại trực tiếp đang bật · Nói để trò chuyện cùng AI'}
                </span>
              </div>
            )}

            {(error || voiceError) && <p className="astrica-assistant-error" role="status">{error || voiceError}</p>}
            <form className="astrica-assistant-composer" onSubmit={(event) => void sendMessage(event)}>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={isListening ? 'Đang lắng nghe bạn nói...' : 'Hỏi Resonancia AI...'}
                aria-label="Tin nhắn cho Resonancia AI"
                rows={1}
                disabled={isCurrentLoading}
              />

              {/* Nút Micro nói chuyện */}
              <button
                type="button"
                className={`astrica-voice-btn ${isListening ? 'is-listening' : ''}`}
                onClick={toggleVoiceInput}
                disabled={isCurrentLoading}
                aria-label={isListening ? 'Dừng thu âm' : 'Nói câu hỏi'}
                title={isListening ? 'Dừng thu âm' : 'Bấm để nói bằng giọng nói'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </button>

              {/* Nút Gửi tin nhắn */}
              <button type="submit" disabled={!prompt.trim() || isCurrentLoading} aria-label="Gửi tin nhắn">
                <img src="/astrica/images/687774a75b297b454d3aa551_arrow_right-right.svg" alt="" aria-hidden="true" />
              </button>
            </form>
            <p className="astrica-assistant-hint">Enter để gửi · Shift + Enter để xuống dòng · Hoặc bấm Micro để nói</p>
          </div>
        </div>
      </div>
    </section>
  );
}
