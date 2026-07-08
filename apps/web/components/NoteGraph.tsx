"use client";
import { useEffect, useRef, useCallback } from "react";
import type { GraphData } from "../lib/types";
import * as d3force from "d3-force";
import { useRouter } from "next/navigation";

interface SimNode extends d3force.SimulationNodeDatum {
  id: string;
  slug: string;
  title: string;
  topicSlug: string | null;
  linkCount: number;
}

interface SimEdge extends d3force.SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

const TOPIC_COLORS = [
  "#5865f2", "#ed4245", "#57f287", "#fee75c",
  "#eb459e", "#3ba55d", "#faa61a", "#00b0f4",
];

function topicColor(slug: string | null, map: Map<string, number>): string {
  if (!slug) return "#555";
  const idx = map.get(slug);
  return idx !== undefined ? TOPIC_COLORS[idx % TOPIC_COLORS.length] : "#555";
}

export function NoteGraph({ data }: { data: GraphData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const simRef = useRef<d3force.Simulation<SimNode, SimEdge> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const hoverRef = useRef<SimNode | null>(null);
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<SimNode | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const getCanvas = () => canvasRef.current;
  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const getTopicColorMap = useCallback(() => {
    const topics = [...new Set(data.nodes.map((n) => n.topicSlug).filter(Boolean))] as string[];
    return new Map(topics.map((t, i) => [t, i]));
  }, [data]);

  const nodeRadius = (n: SimNode) => Math.max(4, Math.min(14, 4 + n.linkCount * 1.5));

  const draw = useCallback(() => {
    const canvas = getCanvas();
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const { x, y, k } = transformRef.current;
    const topicMap = getTopicColorMap();
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);

    // Draw edges
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1 / k;
    for (const edge of edgesRef.current) {
      const s = edge.source as SimNode;
      const t = edge.target as SimNode;
      if (s.x == null || s.y == null || t.x == null || t.y == null) continue;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    // Draw nodes
    ctx.globalAlpha = 1;
    for (const node of nodesRef.current) {
      if (node.x == null || node.y == null) continue;
      const r = nodeRadius(node);
      const isHover = hoverRef.current?.id === node.id;
      const color = topicColor(node.topicSlug, topicMap);
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHover ? "#fff" : color;
      ctx.fill();
      if (isHover) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / k;
        ctx.stroke();
        // Label
        ctx.font = `${12 / k}px system-ui, sans-serif`;
        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "center";
        ctx.fillText(node.title.length > 30 ? node.title.slice(0, 27) + "…" : node.title, node.x, node.y - r - 6 / k);
      }
    }

    ctx.restore();
  }, [getTopicColorMap]);

  const getNodeAt = useCallback((canvasX: number, canvasY: number): SimNode | null => {
    const { x, y, k } = transformRef.current;
    const wx = (canvasX - x) / k;
    const wy = (canvasY - y) / k;
    let closest: SimNode | null = null;
    let minDist = Infinity;
    for (const node of nodesRef.current) {
      if (node.x == null || node.y == null) continue;
      const dx = wx - node.x;
      const dy = wy - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nodeRadius(node) + 4 && dist < minDist) {
        minDist = dist;
        closest = node;
      }
    }
    return closest;
  }, []);

  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = getCtx();
      if (ctx) ctx.scale(dpr, dpr);
      transformRef.current = {
        x: rect.width / 2,
        y: rect.height / 2,
        k: 1,
      };
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    nodesRef.current = data.nodes.map((n) => ({ ...n }));
    edgesRef.current = data.edges.map((e) => ({ ...e }));

    const sim = d3force
      .forceSimulation<SimNode>(nodesRef.current)
      .force(
        "link",
        d3force
          .forceLink<SimNode, SimEdge>(edgesRef.current)
          .id((d) => d.id)
          .distance(60),
      )
      .force("charge", d3force.forceManyBody<SimNode>().strength(-120))
      .force("center", d3force.forceCenter(0, 0))
      .force("collision", d3force.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 4))
      .on("tick", draw);

    simRef.current = sim;
    return () => { sim.stop(); };
  }, [data, draw]);

  // Mouse interactions
  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseMove = (e: MouseEvent) => {
      const pos = getPos(e);
      if (isDraggingRef.current) {
        if (dragNodeRef.current) {
          const { x, y, k } = transformRef.current;
          dragNodeRef.current.fx = (pos.x - x) / k;
          dragNodeRef.current.fy = (pos.y - y) / k;
          simRef.current?.alpha(0.3).restart();
        } else {
          transformRef.current = {
            ...transformRef.current,
            x: panStartRef.current.tx + (pos.x - panStartRef.current.x),
            y: panStartRef.current.ty + (pos.y - panStartRef.current.y),
          };
          draw();
        }
      } else {
        const node = getNodeAt(pos.x, pos.y);
        if (hoverRef.current?.id !== node?.id) {
          hoverRef.current = node;
          canvas.style.cursor = node ? "pointer" : "grab";
          draw();
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const pos = getPos(e);
      const node = getNodeAt(pos.x, pos.y);
      isDraggingRef.current = true;
      if (node) {
        dragNodeRef.current = node;
        node.fx = node.x;
        node.fy = node.y;
      } else {
        dragNodeRef.current = null;
        panStartRef.current = { x: pos.x, y: pos.y, ...{ tx: transformRef.current.x, ty: transformRef.current.y } };
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const pos = getPos(e);
      const dist = Math.hypot(pos.x - (dragStartRef.current?.x ?? pos.x), pos.y - (dragStartRef.current?.y ?? pos.y));
      if (dist < 4 && dragNodeRef.current) {
        router.push(`/notes/${dragNodeRef.current.slug}`);
      }
      if (dragNodeRef.current) {
        dragNodeRef.current.fx = null;
        dragNodeRef.current.fy = null;
      }
      dragNodeRef.current = null;
      isDraggingRef.current = false;
    };

    const onMouseDownCapture = (e: MouseEvent) => {
      const pos = getPos(e);
      dragStartRef.current = { x: pos.x, y: pos.y };
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const { x, y, k } = transformRef.current;
      const newK = Math.max(0.2, Math.min(4, k * factor));
      transformRef.current = {
        x: pos.x - (pos.x - x) * (newK / k),
        y: pos.y - (pos.y - y) * (newK / k),
        k: newK,
      };
      draw();
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousedown", onMouseDownCapture, true);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.style.cursor = "grab";

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousedown", onMouseDownCapture, true);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [draw, getNodeAt, router]);

  return (
    <div className="nb-graph-wrap">
      <canvas ref={canvasRef} />
      <div className="nb-graph-hint">Scroll to zoom · drag to pan · click node to open note</div>
    </div>
  );
}
