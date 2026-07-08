"use client";
import dynamic from "next/dynamic";
import type { GraphData } from "../lib/types";

const NoteGraph = dynamic(
  () => import("./NoteGraph").then((m) => m.NoteGraph),
  { ssr: false, loading: () => <div className="nb-graph-loading">Building graph…</div> },
);

export function GraphLoader({ data }: { data: GraphData }) {
  return <NoteGraph data={data} />;
}
