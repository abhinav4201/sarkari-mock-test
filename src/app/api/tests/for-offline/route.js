import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const { duration, topic, subject } = await request.json();

    // 1. Get tests the user has already taken
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnap = await resultsQuery.get();
    const takenTestIds = new Set(
      resultsSnap.docs.map((doc) => doc.data().testId)
    );

    // 2. Build a dynamic query for STATIC tests
    let testsQuery = adminDb
      .collection("mockTests")
      .where("isDynamic", "==", false) // <-- THIS IS THE KEY CHANGE
      .where("isPremium", "==", false)
      .where("status", "in", ["approved", null])
      .orderBy("createdAt", "desc");

    if (topic) {
      testsQuery = testsQuery.where("topic", "==", topic);
    }
    if (subject) {
      testsQuery = testsQuery.where("subject", "==", subject);
    }

    const testsSnap = await testsQuery.limit(100).get();

    // 3. Filter out taken tests and select enough to fill the duration
    let remainingDuration = duration;
    const testsToDownload = [];

    // This loop automatically handles cases where not enough tests are available.
    // It will simply add all it can find until the list is exhausted.
    for (const doc of testsSnap.docs) {
      if (remainingDuration <= 0) break;
      const test = { id: doc.id, ...doc.data() };
      if (!takenTestIds.has(test.id)) {
        testsToDownload.push(test);
        remainingDuration -= test.estimatedTime;
      }
    }

    if (testsToDownload.length === 0) {
      return NextResponse.json({ tests: [], questions: [] });
    }

    // 4. For each selected test, fetch its questions
    const testIds = testsToDownload.map((test) => test.id);
    const questionsQuery = adminDb
      .collection("mockTestQuestions")
      .where("testId", "in", testIds);
    const questionsSnap = await questionsQuery.get();
    const questions = questionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 5. Package and return the data
    const serializableTests = testsToDownload.map((test) => ({
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
