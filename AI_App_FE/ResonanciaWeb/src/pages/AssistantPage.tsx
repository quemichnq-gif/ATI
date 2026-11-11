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

export default function AssistantPage() {
  const profile = useSelector((state: RootState) => state.profile);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHandsFree, setIsHandsFree] = useState(false);
  const isHandsFreeRef = useRef(false);

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

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
  }, [isHandsFree]);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) {
      conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async (event?: FormEvent, overrideText?: string) => {
    event?.preventDefault();
    const question = (overrideText ?? prompt).trim();
    if (!question || loading) return;

    const conversation = [...messages, { id: Date.now(), role: 'user' as const, content: question }];
    const relatedFeatures = findRelatedFeatures(question);
    setMessages(conversation);
    setPrompt('');
    setError('');
    setLoading(true);

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
      setMessages([
        ...conversation,
        { id: newAssistantMsgId, role: 'assistant', content: answer, relatedFeatures: answerFeatures },
      ]);

      // Khi bật đối thoại trực tiếp rảnh tay: Tự động phát âm thanh và mở lại mic khi đọc xong
      if (isHandsFreeRef.current) {
        speak(answer, newAssistantMsgId, () => {
          if (isHandsFreeRef.current) {
            startListening((recognizedText, isFinal) => {
              setPrompt(recognizedText);
              if (isFinal && recognizedText.trim()) {
                void sendMessage(undefined, recognizedText.trim());
              }
            });
          }
        });
      }
    } catch {
      setError('Hiện chưa kết nối được với trợ lý. Bạn vẫn có thể mở trực tiếp tính năng liên quan bên dưới.');
      setMessages([
        ...conversation,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Mình chưa nhận được phản hồi lúc này.',
          relatedFeatures,
        },
      ]);
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

  // Bật/tắt thu âm giọng nói một lần
  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
      return;
    }
    if (isSpeaking) {
      stopSpeaking();
    }
    startListening((recognizedText, isFinal) => {
      setPrompt(recognizedText);
      if (isFinal && recognizedText.trim()) {
        void sendMessage(undefined, recognizedText.trim());
      }
    });
  };

  // Bật/tắt chế độ đối thoại trực tiếp rảnh tay (Hands-free Voice Dialogue)
  const toggleHandsFree = () => {
    if (!isSupported) {
      alert('Trình duyệt hiện tại chưa hỗ trợ Web Speech API đầy đủ. Bạn hãy trải nghiệm tính năng này trên Chrome, Safari hoặc Edge nhé!');
      return;
    }
    if (isHandsFree) {
      setIsHandsFree(false);
      stopListening();
      stopSpeaking();
    } else {
      setIsHandsFree(true);
      if (isSpeaking) {
        stopSpeaking();
      }
      startListening((recognizedText, isFinal) => {
        setPrompt(recognizedText);
        if (isFinal && recognizedText.trim()) {
          void sendMessage(undefined, recognizedText.trim());
        }
      });
    }
  };

  return (
    <section className="astrica-assistant-page" aria-label="Resonancia AI">
      {/* Heading slot */}
      <header className="astrica-assistant-heading">
        <img src="/astrica/images/6870b7473503e2e6d021b012_Nav_icon.svg" alt="" aria-hidden="true" />
        <div>
          <h1>Resonancia AI</h1>
          <p>Hỏi về chiêm tinh hoặc mở nhanh một tính năng</p>
        </div>

        {/* Nút bật Đối thoại trực tiếp */}
        <div className="astrica-voice-toggle-wrap">
          <button
            type="button"
            className={`astrica-handsfree-btn ${isHandsFree ? 'is-active' : ''}`}
            onClick={toggleHandsFree}
            title={isHandsFree ? 'Bấm để dừng đối thoại rảnh tay' : 'Bật chế độ đối thoại liên tục bằng giọng nói'}
          >
            {isHandsFree ? (
              <span className="astrica-handsfree-dot" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            )}
            <span>{isHandsFree ? 'Đang đối thoại' : 'Đối thoại trực tiếp'}</span>
          </button>
        </div>
      </header>

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

                  {/* Nút Loa phát âm câu trả lời */}
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      className={`astrica-speak-btn ${speakingMessageId === message.id ? 'is-speaking' : ''}`}
                      onClick={() => {
                        if (speakingMessageId === message.id) {
                          stopSpeaking();
                        } else {
                          speak(message.content, message.id);
                        }
                      }}
                      title={speakingMessageId === message.id ? 'Dừng đọc' : 'Đọc câu trả lời này'}
                      aria-label="Đọc câu trả lời"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        {speakingMessageId === message.id ? (
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        ) : (
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        )}
                      </svg>
                    </button>
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
        {/* Sóng âm trạng thái Voice */}
        {(isListening || isSpeaking || isHandsFree) && (
          <div className="astrica-voice-status-bar" role="status">
            <div className="astrica-voice-wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span>
              {isListening
                ? 'AI đang lắng nghe bạn nói...'
                : isSpeaking
                ? 'Resonancia AI đang trả lời bằng giọng nói...'
                : 'Chế độ đối thoại trực tiếp đang bật'}
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
            placeholder="Hỏi Resonancia AI..."
            aria-label="Tin nhắn cho Resonancia AI"
            rows={1}
            disabled={loading}
          />

          {/* Nút bấm Micro để nói */}
          <button
            type="button"
            className={`astrica-voice-btn ${isListening ? 'is-listening' : ''}`}
            onClick={toggleVoiceRecording}
            aria-label={isListening ? 'Dừng thu âm' : 'Nói để gửi tin nhắn'}
            title={isListening ? 'Đang lắng nghe... Bấm để dừng' : 'Bấm để nói bằng giọng nói'}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>

          <button type="submit" disabled={!prompt.trim() || loading} aria-label="Gửi tin nhắn">
            <img src="/astrica/images/687774a75b297b454d3aa551_arrow_right-right.svg" alt="" aria-hidden="true" />
          </button>
        </form>
        <p className="astrica-assistant-hint">Enter để gửi · Shift + Enter để xuống dòng · Hoặc bấm Micro để nói</p>
      </div>
    </section>
  );
}
