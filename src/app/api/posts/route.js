import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { NextResponse } from "next/server";

const PAGE_SIZE = 6; // Fetch 6 posts at a time

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    let postsQuery;
    const baseQuery = [collection(db, "posts"), orderBy("createdAt", "desc")];

    if (cursor) {
      const cursorTimestamp = Timestamp.fromMillis(parseInt(cursor));
      postsQuery = query(
        ...baseQuery,
        startAfter(cursorTimestamp),
        limit(PAGE_SIZE)
      );
    } else {
      postsQuery = query(...baseQuery, limit(PAGE_SIZE));
    }

    const postsSnapshot = await getDocs(postsQuery);

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamp to a serializable format
      createdAt: doc.data().createdAt.toMillis(),
    }));

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
