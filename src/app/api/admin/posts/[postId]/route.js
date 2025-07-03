import { db } from "@/lib/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { postId } = await params; // Await params to resolve the promise
    if (!postId) {
      return NextResponse.json(
        { message: "Missing post ID." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "posts", postId);
    await deleteDoc(docRef);

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { message: "Failed to delete post", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { postId } = await params; // Await params to resolve the promise
    const { title, content, slug, youtubeUrl, featuredImageSvgCode } =
      await request.json();

    if (!postId || !title || !content || !slug) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const postRef = doc(db, "posts", postId);

    await updateDoc(postRef, {
      title,
      content,
      slug,
      youtubeUrl: youtubeUrl || null,
      featuredImageSvgCode: featuredImageSvgCode || null,
    });

    return NextResponse.json(
      { message: "Post updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { message: "Failed to update post", error: error.message },
      { status: 500 }
    );
  }
}
