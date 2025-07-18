import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // 1. Get IDs of tests the user has already taken
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnap = await resultsQuery.get();
    const takenTestIds = resultsSnap.docs.map((doc) => doc.data().testId);

    // 2. Get popular tests (sorted by taken count)
    const popularTestsQuery = adminDb
      .collection("mockTests")
      .where("status", "==", "approved")
      .orderBy("takenCount", "desc")
      .limit(20); // Get top 20 popular to have a good pool to filter from

    const popularTestsSnap = await popularTestsQuery.get();

    // 3. Filter out taken tests and select the top 2
    const recommendations = popularTestsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toMillis(),
      }))
      .filter((test) => !takenTestIds.includes(test.id))
      .slice(0, 2); // Show top 2 popular tests

    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    console.error("Popularity Recommendation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
