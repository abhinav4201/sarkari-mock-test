import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

const RECOMMENDATION_COUNT = 5;

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // --- Step 1: Find the most recent test the current user took ---
    const lastResultQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId)
      .orderBy("completedAt", "desc")
      .limit(1);
    const lastResultSnap = await lastResultQuery.get();

    if (lastResultSnap.empty) {
      // If the user has no history, we can't make a collaborative recommendation.
      return NextResponse.json([], { status: 200 });
    }
    const lastTestId = lastResultSnap.docs[0].data().testId;

    // --- Step 2: Find other users who also took that same test ---
    const otherUsersQuery = adminDb
      .collection("mockTestResults")
      .where("testId", "==", lastTestId)
      .where("userId", "!=", userId) // Exclude the current user
      .limit(50); // Limit to a reasonable number of "similar" users to avoid performance issues
    const otherUsersSnap = await otherUsersQuery.get();
    const similarUserIds = [
      ...new Set(otherUsersSnap.docs.map((doc) => doc.data().userId)),
    ];

    if (similarUserIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // --- Step 3: Find all the tests those similar users have taken ---
    const theirResultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "in", similarUserIds);
    const theirResultsSnap = await theirResultsQuery.get();

    // --- Step 4: Count the frequency of other tests taken ---
    const testFrequency = {};
    theirResultsSnap.forEach((doc) => {
      const testId = doc.data().testId;
      // Don't recommend the test we started with or tests the current user has already taken
      if (testId !== lastTestId) {
        testFrequency[testId] = (testFrequency[testId] || 0) + 1;
      }
    });

    // --- Step 5: Sort by frequency and get the top test IDs ---
    const sortedTestIds = Object.keys(testFrequency).sort(
      (a, b) => testFrequency[b] - testFrequency[a]
    );

    const recommendedTestIds = sortedTestIds.slice(0, RECOMMENDATION_COUNT);

    if (recommendedTestIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // --- Step 6: Fetch the full test data for the recommended IDs ---
    const recommendedTestsQuery = adminDb
      .collection("mockTests")
      .where("__name__", "in", recommendedTestIds);
    const recsSnap = await recommendedTestsQuery.get();

    const recommendations = recsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || null,
    }));

    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    console.error("Collaborative Recommendation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
