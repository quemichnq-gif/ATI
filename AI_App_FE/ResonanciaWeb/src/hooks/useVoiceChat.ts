import { useState, useEffect, useRef, useCallback } from 'react';

// Khai báo kiểu cho Web Speech Recognition API để tương thích TypeScript
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

/**
 * Loại bỏ các ký tự Markdown và tối ưu ngắt nghỉ ngữ điệu
 * để công cụ TTS đọc có nhịp thở, tự nhiên và có hồn như người thật.
 */
export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return '';

  return (
    text
      // Chuyển link [label](url) thành label
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Xóa URL trần
      .replace(/https?:\/\/\S+/g, '')
      // Xóa Markdown headings (#, ##, ###) và thay bằng dấu chấm ngắt câu
      .replace(/^#{1,6}\s+(.+)$/gm, '$1.')
      // Xóa in đậm, in nghiêng (**text**, *text*)
      .replace(/(\*\*|\*|__|_)(.*?)\1/g, '$2')
      // Xóa ký tự code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Đổi các gạch đầu dòng và icon bullet thành dấu ngắt nhịp mềm mại
      .replace(/^[\s•\-\*✦✨💫]+\s*/gm, ', ')
      // Xóa đường kẻ ngang
      .replace(/^[-*_]{3,}\s*$/gm, ' ')
      // Tối ưu các dấu chấm than/hỏi/dấu hai chấm để tạo nhịp ngắt hơi tự nhiên
      .replace(/:\s+/g, ', ')
      .replace(/\.{2,}/g, '.')
      // Đảm bảo cuối mỗi dòng xuống dòng có khoảng ngắt nghỉ
      .replace(/\n+/g, '. ')
      // Chuẩn hóa khoảng trắng
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/\.\s*\./g, '.')
      .replace(/\s*([.,?!])\s*/g, '$1 ')
      .trim()
  );
}

export function useVoiceChat() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const onSpeechEndRef = useRef<(() => void) | null>(null);
  const isManuallyStoppedRef = useRef(false);

  // Kiểm tra tính năng Web Speech API trên trình duyệt
  useEffect(() => {
    const hasSTT = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setIsSupported(hasSTT && hasTTS);
  }, []);

  // Lấy voice tiếng Việt tự nhiên và có hồn nhất từ hệ thống (ưu tiên Neural/Natural)
  const getVietnameseVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Lọc tất cả các voice tiếng Việt có trong trình duyệt
    const vnVoices = voices.filter((v) => {
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      return lang.includes('vi') || name.includes('vietnam') || name.includes('tiếng việt');
    });

    if (vnVoices.length === 0) {
      const partialVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('vi'));
      return partialVoice || null;
    }

    // Chấm điểm ưu tiên GIỌNG NAM (kiểu Adam: nam thanh niên, trầm ấm, dứt khoát)
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      const name = (v.name || '').toLowerCase();
      let score = 0;

      // 1. Ưu tiên cực cao nếu có voice nam tiếng Việt chuyên biệt (Nam Minh, Male, Man, Adam)
      if (name.includes('namminh') || name.includes('nam minh') || name.includes('male') || name.includes('adam')) {
        score += 150;
      }

      // 2. Ưu tiên voice local (chạy trực tiếp trên thiết bị, chấp nhận thay đổi pitch xuống tông nam)
      if (v.localService) {
        score += 60;
      }

      // 3. Google tiếng Việt là remote network voice KHÓA PITCH (luôn ép giọng nữ) -> TRỪ ĐIỂM NẶNG
      if (name.includes('google')) {
        score -= 80;
      }

      // 4. Giảm điểm các voice nữ khác
      if (
        name.includes('hoaimy') ||
        name.includes('hoài my') ||
        name.includes('female') ||
        name.includes('woman') ||
        name.includes('mai') ||
        name.includes('lan')
      ) {
        score -= 40;
      }

      if (v.lang === 'vi-VN' || v.lang === 'vi_VN') score += 10;
      return score;
    };

    vnVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return vnVoices[0];
  }, []);

  // Đảm bảo voice list đã load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        getVietnameseVoice();
      };
    }
  }, [getVietnameseVoice]);

  /**
   * Bắt đầu thu âm và nhận diện giọng nói
   */
  const startListening = useCallback(
    (onResult: (text: string, isFinal: boolean) => void, onEnd?: () => void) => {
      setVoiceError(null);
      isManuallyStoppedRef.current = false;

      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        setVoiceError('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech.');
        return;
      }

      // Hủy bỏ tiến trình nghe cũ nếu đang chạy
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      // Dừng đọc nếu đang phát âm thanh
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }

      try {
        const recognition = new SpeechRecognitionConstructor();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = true;

        onEndCallbackRef.current = onEnd || null;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptText = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptText;
            } else {
              interimTranscript += transcriptText;
            }
          }

          if (finalTranscript) {
            onResult(finalTranscript.trim(), true);
          } else if (interimTranscript) {
            onResult(interimTranscript.trim(), false);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'no-speech') {
            // Người dùng chưa nói gì, không coi là lỗi nghiêm trọng
            return;
          }
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceError('Quyền truy cập micro đã bị từ chối. Hãy cho phép micro trong cài đặt trình duyệt.');
          } else {
            setVoiceError(`Lỗi nhận diện âm thanh: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (onEndCallbackRef.current) {
            onEndCallbackRef.current();
            onEndCallbackRef.current = null;
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setVoiceError(err?.message || 'Không thể khởi động micro.');
        setIsListening(false);
      }
    },
    []
  );

  /**
   * Dừng thu âm
   */
  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  /**
   * Phát âm thanh Text-to-Speech câu trả lời
   */
  const speak = useCallback(
    (text: string, messageId?: number, onSpeechEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setVoiceError('Trình duyệt không hỗ trợ phát âm thanh TTS.');
        return;
      }

      // Hủy bỏ âm thanh đang phát trước đó
      window.speechSynthesis.cancel();

      const cleanedText = cleanMarkdownForSpeech(text);
      if (!cleanedText) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'vi-VN';

      const vnVoice = getVietnameseVoice();
      const voiceNameLower = (vnVoice?.name || '').toLowerCase();
      const isNaturalMaleVoice =
        voiceNameLower.includes('namminh') ||
        voiceNameLower.includes('nam minh') ||
        voiceNameLower.includes('male') ||
        voiceNameLower.includes('adam');

      if (vnVoice) {
        utterance.voice = vnVoice;
      }

      // Tăng tốc độ đọc lên 1.26 (nhanh nhẹn, dứt khoát, cuốn hút)
      utterance.rate = 1.26;

      // Cao độ (Pitch):
      // - Nếu đã là voice nam tự nhiên (Nam Minh): pitch = 0.95
      // - Nếu là voice hệ điều hành cần ép xuống giọng con trai: pitch = 0.58 (dải tần baritone/bass nam giới)
      utterance.pitch = isNaturalMaleVoice ? 0.95 : 0.58;

      console.log('[VoiceChat] Phát giọng con trai:', vnVoice?.name || 'Mặc định', '| Tốc độ:', utterance.rate, '| Cao độ:', utterance.pitch);

      onSpeechEndRef.current = onSpeechEnd || null;

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (typeof messageId === 'number') {
          setSpeakingMessageId(messageId);
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        if (onSpeechEndRef.current) {
          onSpeechEndRef.current();
          onSpeechEndRef.current = null;
        }
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        if (onSpeechEndRef.current) {
          onSpeechEndRef.current();
          onSpeechEndRef.current = null;
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [getVietnameseVoice]
  );

  /**
   * Dừng phát âm thanh ngay lập tức
   */
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  // Hủy tiến trình khi unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    isSpeaking,
    speakingMessageId,
    voiceError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

