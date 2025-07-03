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

const PAGE_SIZE = 9; // Fetch 9 tests at a time

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    let testsQuery;
    const baseQuery = [
      collection(db, "mockTests"),
      orderBy("createdAt", "desc"),
    ];

    if (cursor) {
      const cursorTimestamp = Timestamp.fromMillis(parseInt(cursor));
      testsQuery = query(
        ...baseQuery,
        startAfter(cursorTimestamp),
        limit(PAGE_SIZE)
      );
    } else {
      testsQuery = query(...baseQuery, limit(PAGE_SIZE));
    }

    const testsSnapshot = await getDocs(testsQuery);

    const tests = testsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // THE FIX: Safeguard against a missing timestamp.
        // If createdAt exists, convert it. Otherwise, use null.
        createdAt: data.createdAt ? data.createdAt.toMillis() : null,
      };
    });

    return NextResponse.json(tests, { status: 200 });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
