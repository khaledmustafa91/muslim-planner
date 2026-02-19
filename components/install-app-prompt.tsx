'use client';

import { useEffect, useState } from 'react';

// Capture the event at module load time — it fires before React mounts.
let _deferredPrompt: any = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
  });
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(_deferredPrompt);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registered: ', registration);
          },
          (registrationError) => {
            console.log('SW registration failed: ', registrationError);
          }
        );
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  useEffect(() => {
    // Also listen for the event in case it fires after mount
    const handler = (e: any) => {
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      e.preventDefault();
      _deferredPrompt = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    _deferredPrompt = null;
    setDeferredPrompt(null);
  };

  // Hide if already installed in standalone mode
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  return (
    <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/30 flex flex-col md:flex-row items-center justify-between gap-6 no-print max-w-4xl mx-auto shadow-sm">
      <div className="flex items-center gap-4 text-right">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-amber-600 dark:text-amber-400">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </div>
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-lg">أضف رفيق إلى متصفحك</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">أضف التطبيق مباشرة من متصفحك للوصول السريع ومتابعة عباداتك بسهولة</p>
        </div>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <button
          onClick={handleInstallClick}
          className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black py-3 px-8 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          أضف إلى الشاشة الرئيسية
        </button>
      </div>
    </div>
  );
}
