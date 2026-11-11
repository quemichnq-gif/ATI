import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { setAuth } from '../store/authSlice';
import { setProfile } from '../store/profileSlice';
import { RootState } from '../store';
import {
  getAvailableChatAccounts,
  getActiveChatIdentity,
  setActiveChatIdentity,
  ChatAccountIdentity,
} from '../services/chatAccountService';
import { getTestProfileByEmailOrUid, TEST_ACCOUNT_DEFAULT_PASSWORD } from '../constants/testAccounts';

interface ChatAccountSwitcherProps {
  onAccountSwitched?: (newIdentity: ChatAccountIdentity) => void;
  className?: string;
}

export default function ChatAccountSwitcher({ onAccountSwitched, className = '' }: ChatAccountSwitcherProps) {
  const dispatch = useDispatch();
  const profile = useSelector((s: RootState) => s.profile);
  const [activeAccount, setActiveAccount] = useState<ChatAccountIdentity>(() => getActiveChatIdentity(profile));
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ChatAccountIdentity[]>(() => getAvailableChatAccounts(profile));

  useEffect(() => {
    const list = getAvailableChatAccounts(profile);
    setAccounts(list);
    setActiveAccount(getActiveChatIdentity(profile));
  }, [profile]);

  useEffect(() => {
    const handleChanged = () => {
      const updated = getActiveChatIdentity(profile);
      setActiveAccount(updated);
      if (onAccountSwitched) onAccountSwitched(updated);
    };
    window.addEventListener('resonancia_identity_changed', handleChanged);
    return () => window.removeEventListener('resonancia_identity_changed', handleChanged);
  }, [profile, onAccountSwitched]);

  // Chuyển danh tính trò chuyện (Nếu có tài khoản auth thật thì tự động chuyển Firebase Auth)
  const handleSelectIdentity = async (acc: ChatAccountIdentity) => {
    setActiveChatIdentity(acc.uid);
    setActiveAccount(acc);
    setIsOpen(false);

    const testAcc = getTestProfileByEmailOrUid(acc.name) || getTestProfileByEmailOrUid(acc.uid);
    if (testAcc) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, testAcc.email, TEST_ACCOUNT_DEFAULT_PASSWORD);
        const user = userCred.user;
        dispatch(setAuth({ uid: user.uid, email: testAcc.email }));
        const newProf = {
          ...testAcc,
          uid: user.uid,
        };
        dispatch(setProfile(newProf as any));
        try {
          localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(newProf));
          localStorage.setItem('resonancia_last_profile', JSON.stringify(newProf));
          localStorage.setItem('resonancia_active_chat_identity', user.uid);
        } catch {}
      } catch (e) {
        console.warn('Auto auth switch fallback:', e);
      }
    }

    if (onAccountSwitched) onAccountSwitched(acc);
  };

  // Đổi hẳn tài khoản Firebase Auth thật (Đăng nhập lại sang nick khác)
  const handleCopyEmail = (acc: ChatAccountIdentity, e: React.MouseEvent) => {
    e.stopPropagation();
    const testAcc = getTestProfileByEmailOrUid(acc.name) || getTestProfileByEmailOrUid(acc.uid);
    if (testAcc) {
      navigator.clipboard.writeText(testAcc.email);
      setCopiedAccount(acc.uid);
      setTimeout(() => setCopiedAccount(null), 2500);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Nút bấm hiển thị danh tính hiện tại */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer text-left shadow-sm hover:shadow-md"
        style={{
          background: activeAccount.isMainUser
            ? 'linear-gradient(135deg, rgba(80, 50, 180, 0.4) 0%, rgba(45, 25, 120, 0.5) 100%)'
            : 'linear-gradient(135deg, rgba(217, 70, 239, 0.35) 0%, rgba(147, 51, 234, 0.45) 100%)',
          borderColor: activeAccount.isMainUser ? 'rgba(168, 85, 247, 0.4)' : 'rgba(236, 72, 153, 0.55)',
        }}
        title="Nhấp để đổi danh tính hoặc đăng nhập tài khoản khác"
        aria-label="Đổi danh tính tài khoản chat"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 shadow-sm bg-purple-900/80 flex items-center justify-center font-bold text-white text-xs">
              {activeAccount.avatar ? (
                <img src={activeAccount.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                activeAccount.name[0]?.toUpperCase()
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#100a2a]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-purple-200/70 uppercase tracking-wider font-semibold">
                {activeAccount.isMainUser ? 'Nick chính' : 'Đang chat'}
              </span>
              {activeAccount.zodiac && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-purple-200">
                  {activeAccount.zodiac}
                </span>
              )}
            </div>
            <p className="text-white text-xs font-bold truncate leading-tight mt-0.5">
              {activeAccount.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-purple-200 hover:text-white px-2 py-1 rounded-lg bg-white/10 text-[11px] font-medium flex-shrink-0">
          <span>Đổi nick</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Dropdown danh sách tài khoản */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl p-2.5 shadow-2xl border backdrop-blur-2xl max-h-[380px] overflow-y-auto resonancia-scrollbar"
            style={{
              background: 'linear-gradient(165deg, rgba(20, 12, 54, 0.98) 0%, rgba(10, 5, 32, 0.99) 100%)',
              borderColor: 'rgba(168, 85, 247, 0.45)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(168, 85, 247, 0.25)',
            }}
          >
            <div className="px-2 py-1.5 text-[11px] font-bold text-purple-300 uppercase tracking-wider border-b border-purple-500/20 mb-1.5 flex items-center justify-between">
              <span>Đổi tài khoản hoặc danh tính</span>
              <span className="text-[10px] text-pink-300/80 font-normal">Hỗ trợ 2 chiều</span>
            </div>

            <div className="space-y-1.5">
              {accounts.map((acc) => {
                const isSelected = acc.uid === activeAccount.uid;
                const testAcc = getTestProfileByEmailOrUid(acc.name) || getTestProfileByEmailOrUid(acc.uid);

                return (
                  <div
                    key={acc.uid}
                    onClick={() => handleSelectIdentity(acc)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/30 border border-purple-400/50 shadow-inner'
                        : 'hover:bg-white/[0.08] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 bg-purple-900/60 flex items-center justify-center font-bold text-white text-xs">
                          {acc.avatar ? (
                            <img src={acc.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            acc.name[0]?.toUpperCase()
                          )}
                        </div>
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#100a2a]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white text-xs font-semibold truncate leading-tight">
                            {acc.name}
                          </p>
                          {acc.isMainUser && (
                            <span className="text-[9px] px-1 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                              Bạn
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-purple-200/70 truncate mt-0.5">
                          {acc.zodiac ? `Cung ${acc.zodiac}` : ''} {acc.job ? `· ${acc.job}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {testAcc && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyEmail(acc, e)}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/10 hover:bg-white/20 text-purple-200 border border-purple-400/20"
                          title="Sao chép email đăng nhập"
                        >
                          {copiedAccount === acc.uid ? 'Đã chép' : 'Email'}
                        </button>
                      )}
                      {isSelected && (
                        <span className="text-emerald-400 text-xs font-bold ml-1">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-purple-500/20 px-2 text-[10.5px] text-purple-300/70 leading-relaxed">
              💡 <em>Mẹo:</em> Mở thêm 1 <strong>Tab ẩn danh (Incognito)</strong> và đăng nhập nick đối phương để xem tin nhắn hiển thị tức thì 2 chiều!
            </div>
          </div>
        </>
      )}
    </div>
  );
}
