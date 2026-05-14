import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 60;

export function useBottomSheetSwipe(initialSnap = "keep") {
  const dragStartY = useRef(null);
  const [snap, setSnap] = useState(initialSnap);

  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (dragStartY.current === null) return;
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    if (dy > SWIPE_THRESHOLD) setSnap("full");
    if (dy < -SWIPE_THRESHOLD) setSnap("keep");
    dragStartY.current = null;
  };

  return { snap, setSnap, onTouchStart, onTouchEnd };
}
