import { NextResponse } from "next/server";
import { getFields } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const fields = await getFields();
    return NextResponse.json({ fields });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}
