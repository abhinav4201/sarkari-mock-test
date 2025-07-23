// src/app/api/tests/recommendations/by-task/route.js
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { subject, topic } = await request.json();
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

    let testsQuery = adminDb
      .collection("mockTests")
      .where("isHidden", "!=", true)
      .where("status", "in", ["approved", null]);

    if (subject) {
      testsQuery = testsQuery.where("subject", "==", subject);
    }
    if (topic) {
      testsQuery = testsQuery.where("topic", "==", topic);
    }

    const testsSnap = await testsQuery
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const recommendedTests = testsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toMillis(),
      }))
      .filter((test) => !takenTestIds.has(test.id));

    return NextResponse.json(recommendedTests.slice(0, 3));
  } catch (error) {
    console.error("Error fetching recommendations by task:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
