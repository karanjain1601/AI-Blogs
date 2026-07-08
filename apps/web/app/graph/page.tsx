import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getGraphData } from "../../lib/data";

export const metadata: Metadata = { title: "Knowledge Graph" };
export const revalidate = 300;

const NoteGraph = dynamic(
  () => import("../../components/NoteGraph").then((m) => m.NoteGraph),
  { ssr: false, loading: () => <div className="nb-graph-loading">Building graph…</div> },
);

export default async function GraphPage() {
  const data = await getGraphData();
  return (
    <div className="nb-graph-page">
      <h1 className="nb-graph-title">Knowledge Graph</h1>
      <p className="nb-graph-subtitle">
        {data.nodes.length} notes · {data.edges.length} connections
      </p>
      <NoteGraph data={data} />
    </div>
  );
}
