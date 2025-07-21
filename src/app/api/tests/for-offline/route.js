// src/app/api/tests/for-offline/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

const RECOMMENDATION_COUNT = 10; // Number of tests to cache

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // 1. Get tests the user has already taken to avoid recommending them again
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnap = await resultsQuery.get();
    const takenTestIds = new Set(
      resultsSnap.docs.map((doc) => doc.data().testId)
    );

    // 2. Fetch a batch of recent, popular, non-premium tests
    const testsQuery = adminDb
      .collection("mockTests")
      .where("isPremium", "==", false)
      .where("status", "in", ["approved", null])
      .orderBy("createdAt", "desc")
      .limit(50); // Fetch a larger pool to filter from

    const testsSnap = await testsQuery.get();

    // 3. Filter out already taken tests and select the final count
    const availableTests = testsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((test) => !takenTestIds.has(test.id))
      .slice(0, RECOMMENDATION_COUNT);

    if (availableTests.length === 0) {
      return NextResponse.json({ tests: [], questions: [] });
    }

    // 4. For each selected test, fetch its questions
    const testIds = availableTests.map((test) => test.id);
    const questionsQuery = adminDb
      .collection("mockTestQuestions")
      .where("testId", "in", testIds);
    const questionsSnap = await questionsQuery.get();
    const questions = questionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 5. Package and return the data
    const serializableTests = availableTests.map((test) => ({
      ...test,
      createdAt: test.createdAt ? test.createdAt.toMillis() : null,
    }));

    return NextResponse.json({ tests: serializableTests, questions });
  } catch (error) {
    console.error("Offline Test Fetch Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
