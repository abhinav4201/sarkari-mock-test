import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { testId, questionSvgUrl, options, correctAnswer } =
      await request.json();

    if (!testId || !questionSvgUrl || !options || !correctAnswer) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use a transaction to ensure data integrity
    await runTransaction(db, async (transaction) => {
      // 1. Add the new question to the 'mockTestQuestions' collection
      const questionsCollection = collection(db, "mockTestQuestions");
      transaction.set(doc(questionsCollection), {
        testId,
        questionSvgUrl,
        options,
        correctAnswer,
        createdAt: serverTimestamp(),
      });

      // 2. Atomically increment the questionCount in the 'mockTests' document
      const testRef = doc(db, "mockTests", testId);
      const testDoc = await transaction.get(testRef);
      if (!testDoc.exists()) {
        throw new Error("Test document does not exist!");
      }
      const newCount = (testDoc.data().questionCount || 0) + 1;
      transaction.update(testRef, { questionCount: newCount });
    });

    return NextResponse.json(
      { message: "Question added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding question:", error);
    return NextResponse.json(
      { message: "Failed to add question", error: error.message },
      { status: 500 }
    );
  }
}
