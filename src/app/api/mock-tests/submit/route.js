// src/app/api/mock-tests/submit/route.js

import { adminDb, adminAuth } from "@/lib/firebase-admin";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, testId, answers } = await request.json();
    if (!userId || !testId || !answers) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Authenticate the user - this is a good practice for submission APIs
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { message: "Forbidden: User ID mismatch." },
        { status: 403 }
      );
    }

    // --- Score Calculation ---
    const questionsQuery = query(
      collection(adminDb, "mockTestQuestions"),
      where("testId", "==", testId)
    );
    const questionsSnapshot = await getDocs(questionsQuery);
    const correctAnswersMap = new Map();
    questionsSnapshot.forEach((doc) => {
      correctAnswersMap.set(doc.id, doc.data().correctAnswer);
    });

    if (correctAnswersMap.size === 0) {
      throw new Error(
        "No questions found for this test, cannot calculate score."
      );
    }

    let score = 0;
    const totalQuestions = correctAnswersMap.size;
    for (const questionId in answers) {
      if (answers[questionId]?.answer === correctAnswersMap.get(questionId)) {
        score++;
      }
    }
    const incorrectAnswers = totalQuestions - score;

    // --- Save the Result ---
    const resultDocRef = await addDoc(collection(adminDb, "mockTestResults"), {
      userId,
      testId,
      answers,
      score,
      totalQuestions,
      incorrectAnswers,
      completedAt: serverTimestamp(),
    });

    // --- Update Test Analytics (takenCount and uniqueTakers) ---
    const testRef = doc(adminDb, "mockTests", testId);
    const testSnap = await getDoc(testRef);
    if (testSnap.exists()) {
      const testData = testSnap.data();
      const updateData = {
        takenCount: increment(1),
      };
      // Add user to uniqueTakers only if they are not already in the array
      if (!testData.uniqueTakers || !testData.uniqueTakers.includes(userId)) {
        updateData.uniqueTakers = arrayUnion(userId);
      }
      await updateDoc(testRef, updateData);
    }

    return NextResponse.json(
      { message: "Test submitted successfully!", resultId: resultDocRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting test:", error);
    if (error.code?.startsWith("auth/")) {
      return NextResponse.json(
        { message: "Authentication error." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
