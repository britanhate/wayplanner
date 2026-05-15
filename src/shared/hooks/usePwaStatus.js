import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function usePwaStatus() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        registration.update().catch(() => {});
      }
      console.info("Service worker registered:", swUrl);
    },
    onRegisterError(error) {
      console.error("Service worker registration failed", error);
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const applyUpdate = () => {
    setNeedRefresh(false);
    updateServiceWorker(true);
  };

  return { isOffline, needRefresh, applyUpdate };
}
