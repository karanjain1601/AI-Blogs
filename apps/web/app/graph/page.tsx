import type { Metadata } from "next";
import { getGraphData } from "../../lib/data";
import { GraphLoader } from "../../components/GraphLoader";

export const metadata: Metadata = { title: "Knowledge Graph" };
export const revalidate = 300;

export default async function GraphPage() {
  const data = await getGraphData();
  return (
    <div className="nb-graph-page">
      <h1 className="nb-graph-title">Knowledge Graph</h1>
      <p className="nb-graph-subtitle">
        {data.nodes.length} notes · {data.edges.length} connections
      </p>
      <GraphLoader data={data} />
    </div>
  );
}
