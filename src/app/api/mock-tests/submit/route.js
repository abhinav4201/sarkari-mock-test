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
    const correctAnswers = {};
    questionsSnapshot.forEach((doc) => {
      correctAnswers[doc.id] = doc.data().correctAnswer;
    });

    // 2. Calculate the score
    let score = 0;
    for (const questionId in answers) {
      if (answers[questionId] === correctAnswers[questionId]) {
        score++;
      }
    }

    // 3. Save the result to the 'mockTestResults' collection
    const resultsCollection = collection(db, "mockTestResults");
    const resultDocRef = await addDoc(resultsCollection, {
      userId,
      testId,
      answers,
      score,
      totalQuestions: questionsSnapshot.size,
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
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
