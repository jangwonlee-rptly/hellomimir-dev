import { NextRequest, NextResponse } from "next/server";
import { getFieldBySlug, getFieldArchive } from "@/lib/supabaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get the field
    const field = await getFieldBySlug(slug);
    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Get archive entries
    const archive = await getFieldArchive(field.id);

    return NextResponse.json({
      field,
      archive,
    });
  } catch (error) {
    console.error("Error fetching archive:", error);
    return NextResponse.json(
      { error: "Failed to fetch archive" },
      { status: 500 }
    );
  }
}
