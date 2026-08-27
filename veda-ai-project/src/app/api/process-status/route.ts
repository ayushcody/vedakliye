import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
    }

    const localRes = await fetch(`http://127.0.0.1:8000/process-status/${jobId}`);
    
    if (!localRes.ok) {
      if (localRes.status === 404) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      const errorText = await localRes.text();
      throw new Error(`Local backend error: ${errorText}`);
    }

    const result = await localRes.json();
    return NextResponse.json(result);

  } catch (err) {
    console.error("Local status error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
