import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

const WEAK_SCORE_THRESHOLD = 0.6; // 60%
const RECOMMENDATION_COUNT = 5;

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // --- Step 1: Get all of the user's past results ---
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnap = await resultsQuery.get();

    if (resultsSnap.empty) {
      // No history, so no performance recommendations are possible.
      return NextResponse.json([], { status: 200 });
    }
    const results = resultsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // --- Step 2: Analyze results to find topics and performance ---
    const topicStats = {};
    const takenTestIds = new Set();
    const takenTopics = new Set();

    for (const result of results) {
      takenTestIds.add(result.testId);
      const testSnap = await adminDb
        .collection("mockTests")
        .doc(result.testId)
        .get();

      if (!testSnap.exists) continue;

      const topic = testSnap.data().topic;
      takenTopics.add(topic); // Keep track of all topics user has taken

      if (!topicStats[topic]) {
        topicStats[topic] = { score: 0, total: 0 };
      }
      topicStats[topic].score += result.score;
      topicStats[topic].total += result.totalQuestions;
    }

    // --- Step 3: Identify weak topics ---
    const weakTopics = Object.keys(topicStats).filter(
      (topic) =>
        topicStats[topic].total > 0 &&
        topicStats[topic].score / topicStats[topic].total < WEAK_SCORE_THRESHOLD
    );

    let recommendedTests = [];

    // --- Step 4: PRIMARY LOGIC - Find recommendations in weak topics ---
    if (weakTopics.length > 0) {
      const recsQuery = adminDb
        .collection("mockTests")
        .where("topic", "in", weakTopics)
        .where("status", "==", "approved")
        .orderBy("createdAt", "desc")
        .limit(10);

      const recsSnap = await recsQuery.get();
      recommendedTests = recsSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toMillis(),
        }))
        .filter((test) => !takenTestIds.has(test.id));
    }

    // --- Step 5: FALLBACK LOGIC - If not enough recs, find in similar topics ---
    if (
      recommendedTests.length < RECOMMENDATION_COUNT &&
      takenTopics.size > 0
    ) {
      const existingRecIds = new Set(recommendedTests.map((test) => test.id));
      const similarTopicsQuery = adminDb
        .collection("mockTests")
        .where("topic", "in", Array.from(takenTopics))
        .where("status", "==", "approved")
        .orderBy("createdAt", "desc")
        .limit(10);

      const similarSnap = await similarTopicsQuery.get();
      const similarTests = similarSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toMillis(),
        }))
        .filter(
          (test) => !takenTestIds.has(test.id) && !existingRecIds.has(test.id)
        );

      // Combine and ensure no duplicates
      recommendedTests.push(...similarTests);
      const uniqueTestsMap = new Map(
        recommendedTests.map((test) => [test.id, test])
      );
      recommendedTests = Array.from(uniqueTestsMap.values());
    }

    return NextResponse.json(recommendedTests.slice(0, RECOMMENDATION_COUNT), {
      status: 200,
    });
  } catch (error) {
    console.error("Performance Recommendation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
