import { NextResponse } from "next/server";
import { getGraphData } from "../../../lib/data";

export const revalidate = 300;

export async function GET() {
  const data = await getGraphData();
  return NextResponse.json(data);
}
