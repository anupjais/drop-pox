import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get("userId");
    const parentId = searchParams.get("parentId");

    // Verify the user is requesting their own files
    if (!queryUserId || queryUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // fetch the files from the database
    let userFiles;
    if (parentId) {
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.parentId, parentId)));
    } else {
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), isNull(files.parentId)));
    }
    return NextResponse.json(userFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
