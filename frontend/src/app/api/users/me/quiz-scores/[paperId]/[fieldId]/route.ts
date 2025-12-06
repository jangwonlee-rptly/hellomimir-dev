import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  return process.env.BACKEND_API_URL || "http://localhost:8000";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paperId: string; fieldId: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paperId, fieldId } = await params;

  try {
    const response = await fetch(
      `${getBackendUrl()}/users/me/quiz-scores/${paperId}/${fieldId}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (response.status === 404) {
      return NextResponse.json(null, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching quiz score:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz score" },
      { status: 500 }
    );
  }
}
