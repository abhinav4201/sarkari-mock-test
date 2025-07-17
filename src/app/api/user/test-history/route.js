// src/app/api/user/test-history/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    // Verify the user's token to get their UID
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // Use the Admin SDK (which bypasses security rules) to fetch the data
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId)
      .orderBy("completedAt", "desc");

    const resultsSnapshot = await resultsQuery.get();

    // Process the data on the server
    const resultsData = resultsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert timestamp to a serializable format (milliseconds)
        completedAt: data.completedAt.toMillis(),
      };
    });

    return NextResponse.json(resultsData, { status: 200 });
  } catch (error) {
    console.error("API Error fetching test history:", error);
    if (error.code?.startsWith("auth/")) {
      return NextResponse.json(
        { message: "Authentication error." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
