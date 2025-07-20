import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

const RECOMMENDATION_COUNT = 5;

// --- NEW: Helper function to calculate a time-decay score ---
// An interaction from today is worth 1.0, yesterday ~0.5, a week ago ~0.1, etc.
const calculateRecencyScore = (date) => {
  const now = new Date();
  const completionDate = date.toDate(); // Convert Firestore Timestamp to JS Date
  const diffDays =
    (now.getTime() - completionDate.getTime()) / (1000 * 3600 * 24);
  return 1 / (diffDays + 1);
};

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnap = await resultsQuery.get();
    const takenTestIds = new Set(
      resultsSnap.docs.map((doc) => doc.data().testId)
    );

    // --- Step 1: Fetch ALL tests and recent results ---
    const allTestsQuery = adminDb
      .collection("mockTests")
      .where("status", "in", ["approved", null]);

    // Fetch results from the last 30 days to calculate the "hotness" score
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentResultsQuery = adminDb
      .collection("mockTestResults")
      .where("completedAt", ">=", thirtyDaysAgo);

    const [allTestsSnapshot, recentResultsSnapshot] = await Promise.all([
      allTestsQuery.get(),
      recentResultsQuery.get(),
    ]);

    // --- Step 2: Calculate the "Hotness" Score for each test ---
    const testScores = {};

    recentResultsSnapshot.forEach((doc) => {
      const result = doc.data();
      const testId = result.testId;
      const score = calculateRecencyScore(result.completedAt);
      testScores[testId] = (testScores[testId] || 0) + score;
    });

    let allTests = [];
    allTestsSnapshot.forEach((doc) => {
      const testData = doc.data();
      const testId = doc.id;
      // Final Score = Overall Likes + Recent "Hotness"
      const finalScore = (testData.likeCount || 0) + (testScores[testId] || 0);
      allTests.push({ id: testId, ...testData, finalScore });
    });

    // --- Step 3: Sort, Filter, and Recommend ---
    const recommendations = allTests
      .sort((a, b) => b.finalScore - a.finalScore) // Sort by the new hotness score
      .filter((test) => !takenTestIds.has(test.id)) // Filter out taken tests
      .slice(0, RECOMMENDATION_COUNT) // Take the top 5
      .map((test) => ({
        ...test,
        createdAt: test.createdAt?.toMillis() || null, // Make data serializable
      }));

    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    console.error("Popularity Recommendation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
