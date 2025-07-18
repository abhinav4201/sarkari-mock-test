import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

const WEAK_SCORE_THRESHOLD = 0.6; // 60%

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // 1. Get all of the user's past results
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnap = await resultsQuery.get();
    if (resultsSnap.empty) {
      return NextResponse.json([], { status: 200 });
    }
    const results = resultsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Analyze results to find topic performance
    const topicStats = {};
    const takenTestIds = new Set();

    for (const result of results) {
      takenTestIds.add(result.testId);
      const testSnap = await adminDb
        .collection("mockTests")
        .doc(result.testId)
        .get();

      // --- THIS IS THE FIX ---
      // Changed from testSnap.exists() to the correct property: testSnap.exists
      if (!testSnap.exists) continue;
      // --- END OF FIX ---

      const topic = testSnap.data().topic;
      if (!topicStats[topic]) {
        topicStats[topic] = { score: 0, total: 0 };
      }
      topicStats[topic].score += result.score;
      topicStats[topic].total += result.totalQuestions;
    }

    // 3. Identify weak topics
    const weakTopics = Object.keys(topicStats).filter(
      (topic) =>
        topicStats[topic].total > 0 && // Avoid division by zero
        topicStats[topic].score / topicStats[topic].total < WEAK_SCORE_THRESHOLD
    );

    if (weakTopics.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 4. Find untaken tests in those weak topics
    const recsQuery = adminDb
      .collection("mockTests")
      .where("topic", "in", weakTopics)
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(10); // Limit to 10 recommendations

    const recsSnap = await recsQuery.get();
    const recommendedTests = recsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toMillis(),
      }))
      .filter((test) => !takenTestIds.has(test.id)) // Filter out already taken tests
      .slice(0, 2); // Return a maximum of 2 performance-based recs

    return NextResponse.json(recommendedTests, { status: 200 });
  } catch (error) {
    console.error("Performance Recommendation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
