import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// image-kit credentials

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse from data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const formUserId = formData.get("userId") as string;
    const parentId = (formData.get("parenId") as string) || null;

    if (formUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "File not provided" }, { status: 401 });
      // return NextResponse.json({ error: "File not found" }, { status: 401 });
    }

    if (parentId) {
      const [parentFolder] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parentId),
            eq(files.userId, userId),
            eq(files.isFolder, true)
          )
        );
    } else {
      return NextResponse.json(
        { error: "Parent foldeer not found" },
        { status: 401 }
      );
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only pdf and images are supported" },
        { status: 401 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const folderPath = parentId
      ? `/droply/${userId}/folder/${parentId}`
      : `/droply/${userId}`;

    const originalFileName = file.name;
    const fileExtention = originalFileName.split(".").pop() || "";

    const unuiqueFilename = `${uuidv4()}.${fileExtention}`;

    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: unuiqueFilename,
      folder: folderPath,
      useUniqueFileName: false,
    });

    const fileData = {
      name: originalFileName,
      path: uploadResponse.filePath,
      size: file.size,
      type: file.type,
      fileUrl: uploadResponse.url,
      thumbnilUrl: uploadResponse.thumbnailUrl || null,
      userId: userId,
      parentId: parentId,
      isFolder: false,
      isStarred: false,
      isTrash: false,
    };
    const [newFile] = await db.insert(files).values(fileData).returning();
  } catch (error) {
    console.error("Image upload failed", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 401 }
    );
  }
}
