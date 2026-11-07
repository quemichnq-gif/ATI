import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiAstrologyChat } from '../services/api';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) {
      conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const question = prompt.trim();
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
      setMessages([
        ...conversation,
        { id: Date.now() + 1, role: 'assistant', content: answer, relatedFeatures: answerFeatures },
      ]);
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

  return (
    <section className="astrica-assistant-page" aria-label="Resonancia AI">
      <header className="astrica-assistant-heading">
        <img src="/astrica/images/6870b7473503e2e6d021b012_Nav_icon.svg" alt="" aria-hidden="true" />
        <div>
          <h1>Resonancia AI</h1>
          <p>Hỏi về chiêm tinh hoặc mở nhanh một tính năng</p>
        </div>
      </header>

      <div ref={conversationRef} className="astrica-assistant-conversation" aria-live="polite">
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
    </section>
  );
}
