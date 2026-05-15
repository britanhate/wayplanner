import { useCallback, useEffect, useRef, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const COLLAPSED_VISIBLE = 82;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function useBottomSheetSwipe(initialSnap = "collapsed") {
  const [snap, setSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTranslateY, setDragTranslateY] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [snapPoints, setSnapPoints] = useState({ expanded: 0, collapsed: 0, min: 0, max: 0 });

  const sheetRef = useRef(null);
  const scrollRef = useRef(null);
  const dragStartYRef = useRef(0);
  const dragStartTranslateRef = useRef(0);
  const activePointerIdRef = useRef(null);

  const recalcSnapPoints = useCallback(() => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? 0;
    const collapsed = Math.max(height - COLLAPSED_VISIBLE, 0);
    setSnapPoints({ expanded: 0, collapsed, min: 0, max: collapsed });
  }, []);

  const currentSnapTranslate = snapPoints[snap] ?? snapPoints.collapsed;
  const translateY = dragTranslateY ?? currentSnapTranslate;

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
      dragStartTranslateRef.current = translateY;
      setIsDragging(true);
    },
    [isMobile, translateY],
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
    if (!isDragging || activePointerIdRef.current !== e.pointerId || !isMobile) return;
    e.preventDefault();
    const dy = e.clientY - dragStartYRef.current;
    const { min, max } = snapPoints;
    setDragTranslateY(clamp(dragStartTranslateRef.current + dy, min, max));
  }, [isDragging, isMobile, snapPoints]);

  const onPointerUp = useCallback((e) => {
    if (activePointerIdRef.current !== e.pointerId || !isMobile) return;
    const finalY = dragTranslateY ?? currentSnapTranslate;
    const midpoint = (snapPoints.collapsed + snapPoints.expanded) / 2;
    const dy = e.clientY - dragStartYRef.current;

    const nextSnap = dy < -8 || finalY < midpoint ? "expanded" : "collapsed";

    setSnap(nextSnap);
    setDragTranslateY(null);
    setIsDragging(false);
    activePointerIdRef.current = null;
  }, [currentSnapTranslate, dragTranslateY, isMobile, snapPoints]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  return {
    snap,
    setSnap,
    sheetRef,
    scrollRef,
    onDragAreaPointerDown,
    onScrollPointerDown,
    sheetStyle: {
      transform: `translateY(${translateY}px)`,
      transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    },
  };
}
