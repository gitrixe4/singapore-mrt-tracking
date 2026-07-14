import { useMemo, useRef, useState, useCallback, type WheelEvent, type PointerEvent } from "react";
import type { LineMeta, Station } from "../lib/geo";
import { makeProjection } from "../lib/geo";

const VIEW_W = 1000;
const VIEW_H = 700;

interface Props {
  stations: Station[];
  lines: LineMeta[];
  selectedStationId: string | null;
  nearestStationId: string | null;
  userPosition: { lat: number; lng: number; accuracy: number } | null;
  onSelectStation: (id: string) => void;
  visibleLineIds: Set<string>;
}

export default function MrtMap({
  stations,
  lines,
  selectedStationId,
  nearestStationId,
  userPosition,
  onSelectStation,
  visibleLineIds,
}: Props) {
  const projection = useMemo(() => makeProjection(stations, VIEW_W, VIEW_H), [stations]);
  const stationById = useMemo(() => {
    const m = new Map<string, Station>();
    for (const s of stations) m.set(s.id, s);
    return m;
  }, [stations]);

  const [transform, setTransformState] = useState({ scale: 1, tx: 0, ty: 0 });
  const transformRef = useRef(transform);
  const svgRef = useRef<SVGSVGElement>(null);

  // Active touch/mouse pointers, in viewBox coordinates.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureMoved = useRef(0);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchStart = useRef<{
    dist: number;
    mid: { x: number; y: number };
    scale: number;
    tx: number;
    ty: number;
  } | null>(null);

  const clampScale = (s: number) => Math.min(8, Math.max(0.8, s));

  // Bounding box of the drawn network in viewBox coordinates, used to keep
  // real content (not just empty canvas) on screen when panning.
  const contentBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of stations) {
      const x = projection.x(s.lng);
      const y = projection.y(s.lat);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { minX, maxX, minY, maxY };
  }, [stations, projection]);

  // A wild drag or pinch must never fling the network out of view: keep the
  // screen center inside the network's bounding box at all times, so the
  // viewport is always looking at station-bearing area.
  const clampTransform = (t: { scale: number; tx: number; ty: number }) => {
    const scale = clampScale(t.scale);
    const tx = Math.min(
      VIEW_W / 2 - contentBox.minX * scale,
      Math.max(VIEW_W / 2 - contentBox.maxX * scale, t.tx)
    );
    const ty = Math.min(
      VIEW_H / 2 - contentBox.minY * scale,
      Math.max(VIEW_H / 2 - contentBox.maxY * scale, t.ty)
    );
    return { scale, tx, ty };
  };

  const setTransform = useCallback(
    (updater: (t: { scale: number; tx: number; ty: number }) => { scale: number; tx: number; ty: number }) => {
      setTransformState((t) => {
        const next = clampTransform(updater(t));
        transformRef.current = next;
        return next;
      });
    },
    []
  );

  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW_W,
      y: ((clientY - rect.top) / rect.height) * VIEW_H,
    };
  }, []);

  const onWheel = useCallback(
    (e: WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const c = toViewBox(e.clientX, e.clientY);
      setTransform((t) => {
        const newScale = clampScale(t.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
        const scaleRatio = newScale / t.scale;
        return {
          scale: newScale,
          tx: c.x - (c.x - t.tx) * scaleRatio,
          ty: c.y - (c.y - t.ty) * scaleRatio,
        };
      });
    },
    [setTransform, toViewBox]
  );

  const pinchInfo = () => {
    const [a, b] = [...pointers.current.values()];
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  const onPointerDown = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      (e.target as Element).setPointerCapture(e.pointerId);
      const p = toViewBox(e.clientX, e.clientY);
      pointers.current.set(e.pointerId, p);
      const t = transformRef.current;

      if (pointers.current.size === 1) {
        gestureMoved.current = 0;
        panStart.current = { x: p.x, y: p.y, tx: t.tx, ty: t.ty };
        pinchStart.current = null;
      } else if (pointers.current.size === 2) {
        const { dist, mid } = pinchInfo();
        pinchStart.current = { dist, mid, scale: t.scale, tx: t.tx, ty: t.ty };
        panStart.current = null;
      } else {
        // 3+ fingers: ignore the gesture entirely.
        panStart.current = null;
        pinchStart.current = null;
      }
    },
    [toViewBox]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(e.pointerId)) return;
      const prev = pointers.current.get(e.pointerId)!;
      const p = toViewBox(e.clientX, e.clientY);
      gestureMoved.current += Math.hypot(p.x - prev.x, p.y - prev.y);
      pointers.current.set(e.pointerId, p);

      if (pointers.current.size === 2 && pinchStart.current) {
        const start = pinchStart.current;
        const { dist, mid } = pinchInfo();
        if (start.dist < 1) return;
        const newScale = clampScale(start.scale * (dist / start.dist));
        const ratio = newScale / start.scale;
        setTransform(() => ({
          scale: newScale,
          // Keep the point under the fingers' midpoint anchored while
          // also following the midpoint as both fingers travel.
          tx: mid.x - (start.mid.x - start.tx) * ratio,
          ty: mid.y - (start.mid.y - start.ty) * ratio,
        }));
      } else if (pointers.current.size === 1 && panStart.current) {
        const start = panStart.current;
        setTransform((t) => ({
          ...t,
          tx: start.tx + (p.x - start.x),
          ty: start.ty + (p.y - start.y),
        }));
      }
    },
    [setTransform, toViewBox]
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      pointers.current.delete(e.pointerId);
      pinchStart.current = null;
      if (pointers.current.size === 1) {
        // One finger remains after a pinch: hand off to a fresh pan.
        const [p] = [...pointers.current.values()];
        const t = transformRef.current;
        panStart.current = { x: p.x, y: p.y, tx: t.tx, ty: t.ty };
      } else {
        panStart.current = null;
      }
    },
    []
  );

  const zoomBy = (factor: number) => {
    setTransform((t) => {
      const newScale = clampScale(t.scale * factor);
      const scaleRatio = newScale / t.scale;
      const cx = VIEW_W / 2;
      const cy = VIEW_H / 2;
      return {
        scale: newScale,
        tx: cx - (cx - t.tx) * scaleRatio,
        ty: cy - (cy - t.ty) * scaleRatio,
      };
    });
  };

  const resetView = () => setTransform(() => ({ scale: 1, tx: 0, ty: 0 }));

  const isInterchange = (s: Station) => s.lines.length > 1;

  const userXY = userPosition ? { x: projection.x(userPosition.lng), y: projection.y(userPosition.lat) } : null;

  return (
    <div className="map-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mrt-svg"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}>
          {lines
            .filter((l) => visibleLineIds.has(l.id))
            .map((line) => {
              const pts = line.path
                .map((id) => stationById.get(id))
                .filter((s): s is Station => !!s)
                .map((s) => `${projection.x(s.lng)},${projection.y(s.lat)}`)
                .join(" ");
              return (
                <polyline
                  key={line.id}
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.thin ? 2.2 : 3.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.92}
                />
              );
            })}

          {stations.map((s) => {
            const visible = s.lines.some((l) => visibleLineIds.has(l.line));
            if (!visible) return null;
            const x = projection.x(s.lng);
            const y = projection.y(s.lat);
            const interchange = isInterchange(s);
            const selected = s.id === selectedStationId;
            const nearest = s.id === nearestStationId;
            const r = interchange ? 5.2 : 3.2;
            return (
              <g
                key={s.id}
                className="station-node"
                transform={`translate(${x} ${y})`}
                onClick={() => {
                  // Ignore the click that follows a pan/pinch gesture.
                  if (gestureMoved.current > 6) return;
                  onSelectStation(s.id);
                }}
              >
                {/* Invisible enlarged hit area so stations are tappable with a finger */}
                <circle r={11} fill="transparent" stroke="none" />
                {nearest && (
                  <circle r={r + 7} className="nearest-pulse" fill="none" stroke="#22c55e" strokeWidth={2} />
                )}
                <circle
                  r={selected ? r + 2.5 : r}
                  fill={interchange ? "#0b0f14" : s.lines[0]?.color ?? "#888"}
                  stroke={selected ? "#22c55e" : interchange ? "#fff" : "none"}
                  strokeWidth={interchange ? 2 : selected ? 2.5 : 0}
                />
                <title>{s.name} ({s.lines.map((l) => l.code).join(", ")})</title>
              </g>
            );
          })}

          {userXY && (
            <g transform={`translate(${userXY.x} ${userXY.y})`}>
              <circle r={10} className="user-pulse" fill="#3b82f6" opacity={0.25} />
              <circle r={5.5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
            </g>
          )}
        </g>
      </svg>

      <div className="map-controls">
        <button onClick={() => zoomBy(1.3)} aria-label="Zoom in">+</button>
        <button onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out">−</button>
        <button onClick={resetView} aria-label="Reset view">⤾</button>
      </div>
    </div>
  );
}
