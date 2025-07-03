import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { postId } = params;
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
