import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { title, content, slug, youtubeUrl, featuredImageSvgCode } =
      await request.json();

    if (!title || !content || !slug) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const postsCollection = collection(db, "posts");
    await addDoc(postsCollection, {
      title,
      content,
      slug,
      youtubeUrl: youtubeUrl || "",
      featuredImageSvgCode: featuredImageSvgCode || "", // Save the new field
      createdAt: serverTimestamp(),
    });

    return NextResponse.json(
      { message: "Post created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { message: "Failed to create post", error: error.message },
      { status: 500 }
    );
  }
}
