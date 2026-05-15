import { usePwaStatus } from "../../shared/hooks/usePwaStatus";

export default function PwaStatus() {
  const { isOffline, needRefresh, applyUpdate } = usePwaStatus();

  if (!isOffline && !needRefresh) return null;

  return (
    <div className="pwa-status" role="status" aria-live="polite">
      {isOffline && <span className="pwa-pill">Offline mode</span>}
      {needRefresh && (
        <button type="button" className="pwa-update-btn" onClick={applyUpdate}>
          Update available
        </button>
      )}
    </div>
  );
}
