// src/app/api/mock-tests/submit/route.js

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
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

    // 1. Fetch the correct answers from the database
    const q = query(
      collection(db, "mockTestQuestions"),
      where("testId", "==", testId)
    );
    const questionsSnapshot = await getDocs(q);
    const correctAnswersMap = new Map();
    questionsSnapshot.forEach((doc) => {
      correctAnswersMap.set(doc.id, doc.data().correctAnswer);
    });

    if (correctAnswersMap.size === 0) {
      throw new Error(
        "No questions found for this test, cannot calculate score."
      );
    }

    // --- THIS IS THE CORRECTED SCORE CALCULATION ---
    let score = 0;
    const totalQuestions = correctAnswersMap.size;

    for (const questionId in answers) {
      const userAnswerObject = answers[questionId];
      const correctAnswer = correctAnswersMap.get(questionId);

      // FIX: Access the 'answer' property inside the object for comparison
      if (userAnswerObject && userAnswerObject.answer === correctAnswer) {
        score++;
      }
    }

    const incorrectAnswers = totalQuestions - score;

    // 3. Save the result to the 'mockTestResults' collection
    const resultsCollection = collection(db, "mockTestResults");
    const resultDocRef = await addDoc(resultsCollection, {
      userId,
      testId,
      answers, // The detailed answers object is saved correctly
      score,
      totalQuestions,
      incorrectAnswers, // Also save the incorrect answer count
      completedAt: serverTimestamp(),
    });

    // 4. Return the ID of the new result document
    return NextResponse.json(
      { message: "Test submitted successfully!", resultId: resultDocRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting test:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
