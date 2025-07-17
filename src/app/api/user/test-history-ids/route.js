// src/app/api/user/test-history-ids/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json([], { status: 200 });
    }

    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // Use the secure Admin SDK to get the user's results.
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnapshot = await resultsQuery.get();

    // Return only the list of test IDs.
    const takenTestIds = resultsSnapshot.docs.map((doc) => doc.data().testId);

    return NextResponse.json([...new Set(takenTestIds)], { status: 200 });
  } catch (error) {
    console.error("API Error fetching test history IDs:", error);
    // On error, return an empty array so the frontend doesn't break.
    return NextResponse.json([], { status: 500 });
  }
}
