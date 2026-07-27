"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

type Point = { x: number; y: number };

const MIN_SCALE = 1;
const MAX_SCALE = 3.5;

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Full-bleed product photo the customer can pan and pinch-zoom.
 * Uses Pointer Events so a single implementation covers mouse-drag (desktop)
 * and touch pan/pinch (mobile) without extra gesture libraries.
 */
export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const [interacting, setInteracting] = useState(false);
  const pointers = useRef(new Map<number, Point>());
  const panOrigin = useRef<{ pointer: Point; transform: Point } | null>(null);
  const pinchOrigin = useRef<{
    distance: number;
    scale: number;
    midpoint: Point;
    transform: Point;
  } | null>(null);

  const clamp = useCallback((x: number, y: number, scale: number) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const maxOffsetX = (el.clientWidth * (scale - 1)) / 2;
    const maxOffsetY = (el.clientHeight * (scale - 1)) / 2;
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y)),
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setInteracting(true);

    if (pointers.current.size === 1) {
      panOrigin.current = {
        pointer: { x: e.clientX, y: e.clientY },
        transform: { x: transformRef.current.x, y: transformRef.current.y },
      };
    } else if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      pinchOrigin.current = {
        distance: distance(p1, p2),
        scale: transformRef.current.scale,
        midpoint: midpoint(p1, p2),
        transform: { x: transformRef.current.x, y: transformRef.current.y },
      };
      panOrigin.current = null;
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchOrigin.current) {
      const [p1, p2] = Array.from(pointers.current.values());
      const newDistance = distance(p1, p2);
      const ratio = newDistance / (pinchOrigin.current.distance || 1);
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchOrigin.current.scale * ratio),
      );
      const { x, y } = clamp(pinchOrigin.current.transform.x, pinchOrigin.current.transform.y, nextScale);
      setTransform({ x, y, scale: nextScale });
      return;
    }

    if (pointers.current.size === 1 && panOrigin.current && transformRef.current.scale > 1) {
      const dx = e.clientX - panOrigin.current.pointer.x;
      const dy = e.clientY - panOrigin.current.pointer.y;
      const { x, y } = clamp(
        panOrigin.current.transform.x + dx,
        panOrigin.current.transform.y + dy,
        transformRef.current.scale,
      );
      setTransform((prev) => ({ ...prev, x, y }));
    }
  }

  function endPointer(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const [remaining] = Array.from(pointers.current.values());
      panOrigin.current = {
        pointer: remaining,
        transform: { x: transformRef.current.x, y: transformRef.current.y },
      };
      pinchOrigin.current = null;
    } else if (pointers.current.size === 0) {
      panOrigin.current = null;
      pinchOrigin.current = null;
      setInteracting(false);
      // Snap back to a sane resting state once fingers lift.
      if (transformRef.current.scale < MIN_SCALE + 0.02) {
        setTransform({ x: 0, y: 0, scale: 1 });
      }
    }
  }

  function handleDoubleClick() {
    setTransform((prev) => (prev.scale > 1 ? { x: 0, y: 0, scale: 1 } : { x: 0, y: 0, scale: 2 }));
  }

  function handleWheel(e: React.WheelEvent) {
    // Desktop convenience: ctrl/cmd+wheel (trackpad pinch) or plain wheel to zoom.
    e.preventDefault();
    const delta = -e.deltaY * 0.0025;
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transformRef.current.scale + delta));
    const { x, y } = clamp(transformRef.current.x, transformRef.current.y, nextScale);
    setTransform({ x, y, scale: nextScale });
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      className="absolute inset-0 touch-none overflow-hidden select-none"
    >
      <div
        className="h-full w-full"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transition: interacting ? "none" : "transform 0.25s ease-out",
          willChange: "transform",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          draggable={false}
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
