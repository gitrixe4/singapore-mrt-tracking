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
  const projection = useMemo(() => makeProjection(VIEW_W, VIEW_H), []);
  const stationById = useMemo(() => {
    const m = new Map<string, Station>();
    for (const s of stations) m.set(s.id, s);
    return m;
  }, [stations]);

  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 });
  const dragState = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const clampScale = (s: number) => Math.min(8, Math.max(0.8, s));

  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const cy = ((e.clientY - rect.top) / rect.height) * VIEW_H;

    setTransform((t) => {
      const newScale = clampScale(t.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
      const scaleRatio = newScale / t.scale;
      const tx = cx - (cx - t.tx) * scaleRatio;
      const ty = cy - (cy - t.ty) * scaleRatio;
      return { scale: newScale, tx, ty };
    });
  }, []);

  const onPointerDown = useCallback((e: PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
  }, [transform]);

  const onPointerMove = useCallback((e: PointerEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = ((e.clientX - dragState.current.x) / rect.width) * VIEW_W;
    const dy = ((e.clientY - dragState.current.y) / rect.height) * VIEW_H;
    setTransform((t) => ({ ...t, tx: dragState.current!.tx + dx, ty: dragState.current!.ty + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const zoomBy = (factor: number) => {
    setTransform((t) => {
      const newScale = clampScale(t.scale * factor);
      const scaleRatio = newScale / t.scale;
      const cx = VIEW_W / 2;
      const cy = VIEW_H / 2;
      const tx = cx - (cx - t.tx) * scaleRatio;
      const ty = cy - (cy - t.ty) * scaleRatio;
      return { scale: newScale, tx, ty };
    });
  };

  const resetView = () => setTransform({ scale: 1, tx: 0, ty: 0 });

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
        onPointerLeave={onPointerUp}
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
                  strokeWidth={line.id.length === 2 && ["BP", "SK", "PG"].includes(line.id) ? 2.2 : 3.4}
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
                onClick={() => onSelectStation(s.id)}
              >
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
