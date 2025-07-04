// app/api/users/[userId]/results/route.js

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { NextResponse } from "next/server";

const PAGE_SIZE = 10;

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is missing." },
        { status: 400 }
      );
    }

    const resultsRef = collection(db, "mockTestResults");
    let q = query(
      resultsRef,
      where("userId", "==", userId),
      orderBy("completedAt", "desc"),
      limit(PAGE_SIZE)
    );

    if (cursor) {
      const cursorDoc = await getDoc(doc(db, "mockTestResults", cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    const querySnapshot = await getDocs(q);

    let results = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        ...data,
        completedAt: data.completedAt.toDate().toISOString(),
      });
    });

    // --- FIX: Fetch test titles to include in the response ---
    if (results.length > 0) {
      const testIds = [...new Set(results.map((res) => res.testId))]; // Get unique test IDs
      const testsQuery = query(
        collection(db, "mockTests"),
        where("__name__", "in", testIds)
      );
      const testsSnapshot = await getDocs(testsQuery);
      const testsMap = new Map();
      testsSnapshot.forEach((doc) => testsMap.set(doc.id, doc.data()));

      // Add the testTitle to each result object
      results = results.map((res) => ({
        ...res,
        testTitle: testsMap.get(res.testId)?.title || "Unknown Test",
      }));
    }

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const nextCursor = lastVisible ? lastVisible.id : null;

    // Return the data in the expected object format
    return NextResponse.json({ results, nextCursor }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user results:", error);
    return NextResponse.json(
      { message: "Failed to fetch user results", error: error.message },
      { status: 500 }
    );
  }
}
