import { useCallback, useEffect, useRef, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const COLLAPSED_VISIBLE = 82;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function useBottomSheetSwipe(initialSnap = "collapsed") {
  const [snap, setSnap] = useState(initialSnap);
  const [isMobile, setIsMobile] = useState(false);
  const [snapPoints, setSnapPoints] = useState({ expanded: 0, collapsed: 0, min: 0, max: 0 });
  const [sheetStyle, setSheetStyle] = useState({
    transform: "translateY(0px)",
    transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
  });

  const sheetRef = useRef(null);
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartTranslateRef = useRef(0);
  const activePointerIdRef = useRef(null);
  const liveTranslateYRef = useRef(0);
  const rafIdRef = useRef(null);

  const flushTransform = useCallback((transition) => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = transition;
    sheetRef.current.style.transform = `translateY(${liveTranslateYRef.current}px)`;
    setSheetStyle({
      transform: `translateY(${liveTranslateYRef.current}px)`,
      transition,
    });
  }, []);

  const scheduleTransform = useCallback((transition = "none") => {
    if (rafIdRef.current) return;
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      flushTransform(transition);
    });
  }, [flushTransform]);

  const recalcSnapPoints = useCallback(() => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? 0;
    const collapsed = Math.max(height - COLLAPSED_VISIBLE, 0);
    setSnapPoints({ expanded: 0, collapsed, min: 0, max: collapsed });
  }, []);

  const currentSnapTranslate = snapPoints[snap] ?? snapPoints.collapsed;

  useEffect(() => {
    liveTranslateYRef.current = currentSnapTranslate;
    scheduleTransform("transform 220ms cubic-bezier(0.22, 1, 0.36, 1)");
  }, [currentSnapTranslate, scheduleTransform]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    recalcSnapPoints();

    const el = sheetRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => recalcSnapPoints());
    observer.observe(el);
    window.addEventListener("resize", recalcSnapPoints);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalcSnapPoints);
    };
  }, [isMobile, recalcSnapPoints]);

  const startDrag = useCallback(
    (clientY, pointerId) => {
      if (!isMobile) return;
      activePointerIdRef.current = pointerId;
      dragStartYRef.current = clientY;
      dragStartTranslateRef.current = liveTranslateYRef.current;
      isDraggingRef.current = true;
    },
    [isMobile],
  );

  const onDragAreaPointerDown = useCallback((e) => {
    startDrag(e.clientY, e.pointerId);
  }, [startDrag]);

  const onScrollPointerDown = useCallback((e) => {
    if (!isMobile) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop === 0) startDrag(e.clientY, e.pointerId);
  }, [isMobile, startDrag]);

  const onPointerMove = useCallback((e) => {
    if (!isDraggingRef.current || activePointerIdRef.current !== e.pointerId || !isMobile) return;
    e.preventDefault();
    const dy = e.clientY - dragStartYRef.current;
    const { min, max } = snapPoints;
    liveTranslateYRef.current = clamp(dragStartTranslateRef.current + dy, min, max);
    scheduleTransform("none");
  }, [isMobile, scheduleTransform, snapPoints]);

  const onPointerUp = useCallback((e) => {
    if (activePointerIdRef.current !== e.pointerId || !isMobile) return;
    const finalY = liveTranslateYRef.current;
    const midpoint = (snapPoints.collapsed + snapPoints.expanded) / 2;
    const dy = e.clientY - dragStartYRef.current;

    const nextSnap = dy < -8 || finalY < midpoint ? "expanded" : "collapsed";

    setSnap(nextSnap);
    isDraggingRef.current = false;
    activePointerIdRef.current = null;
  }, [isMobile, snapPoints]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [onPointerMove, onPointerUp]);

  return {
    snap,
    setSnap,
    sheetRef,
    scrollRef,
    onDragAreaPointerDown,
    onScrollPointerDown,
    sheetStyle,
  };
}
