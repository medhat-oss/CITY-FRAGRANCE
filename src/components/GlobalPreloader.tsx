'use client';

import { useEffect, useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';

export default function GlobalPreloader({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const minTimer = new Promise<void>((resolve) => setTimeout(resolve, 1000));

    const pageLoad = new Promise<void>((resolve) => {
      if (typeof document !== 'undefined' && document.readyState === 'complete') {
        resolve();
      } else if (typeof window !== 'undefined') {
        const onWindowLoad = () => {
          window.removeEventListener('load', onWindowLoad);
          resolve();
        };
        window.addEventListener('load', onWindowLoad);
      } else {
        resolve();
      }
    });

    Promise.all([minTimer, pageLoad]).then(() => {
      if (!isMounted) return;
      setIsFadingOut(true);
      setTimeout(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      }, 700);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {isLoading && (
        <div
          className={`fixed inset-0 z-[9999] bg-[#09142E] transition-opacity duration-700 ease-in-out ${
            isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
        >
          <LoadingScreen instant={true} />
        </div>
      )}
      {children}
    </>
  );
}
