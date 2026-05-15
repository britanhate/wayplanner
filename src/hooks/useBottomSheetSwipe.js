import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const COLLAPSED_VISIBLE = 82;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function useBottomSheetSwipe(initialSnap = "collapsed") {
  const [snap, setSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTranslateY, setDragTranslateY] = useState(null);

  const sheetRef = useRef(null);
  const scrollRef = useRef(null);
  const dragStartYRef = useRef(0);
  const dragStartTranslateRef = useRef(0);
  const activePointerIdRef = useRef(null);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  }, []);

  const getSnapPoints = useCallback(() => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? 0;
    const collapsed = Math.max(height - COLLAPSED_VISIBLE, 0);
    return { expanded: 0, collapsed, min: 0, max: collapsed };
  }, []);

  const currentSnapTranslate = getSnapPoints()[snap] ?? getSnapPoints().collapsed;
  const translateY = dragTranslateY ?? currentSnapTranslate;

  const startDrag = useCallback((clientY, pointerId) => {
    if (!isMobile) return;
    activePointerIdRef.current = pointerId;
    dragStartYRef.current = clientY;
    dragStartTranslateRef.current = translateY;
    setIsDragging(true);
  }, [isMobile, translateY]);

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
    const { min, max } = getSnapPoints();
    setDragTranslateY(clamp(dragStartTranslateRef.current + dy, min, max));
  }, [getSnapPoints, isDragging, isMobile]);

  const onPointerUp = useCallback((e) => {
    if (activePointerIdRef.current !== e.pointerId || !isMobile) return;
    const points = getSnapPoints();
    const finalY = dragTranslateY ?? currentSnapTranslate;
    const midpoint = (points.collapsed + points.expanded) / 2;
    const dy = e.clientY - dragStartYRef.current;

    const nextSnap = dy < -8 || finalY < midpoint ? "expanded" : "collapsed";

    setSnap(nextSnap);
    setDragTranslateY(null);
    setIsDragging(false);
    activePointerIdRef.current = null;
  }, [currentSnapTranslate, dragTranslateY, getSnapPoints, isMobile]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => onPointerMove(e);
    const handleUp = (e) => onPointerUp(e);
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
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
      transition: isDragging
        ? "none"
        : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    },
  };
}
