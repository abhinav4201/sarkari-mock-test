// src/app/api/user/test-history/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

const PAGE_SIZE = 5;

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    let resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId)
      .orderBy("completedAt", "desc")
      .limit(PAGE_SIZE);

    if (cursor) {
      const cursorTimestamp = Timestamp.fromMillis(parseInt(cursor));
      resultsQuery = resultsQuery.startAfter(cursorTimestamp);
    }

    const resultsSnapshot = await resultsQuery.get();

    const resultsData = resultsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completedAt: data.completedAt.toMillis(),
      };
    });

    return NextResponse.json(resultsData, { status: 200 });
  } catch (error) {
    console.error("API Error fetching test history:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
