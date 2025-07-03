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
    const { testId, questions } = await request.json();

    if (!testId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: "Invalid data provided." },
        { status: 400 }
      );
    }

    await runTransaction(db, async (transaction) => {
      // --- THIS IS THE FIX ---

      // 1. DEFINE a reference to the test document we need to read and update.
      const testRef = doc(db, "mockTests", testId);

      // 2. READ FIRST: Get the test document to check its existence and current count.
      const testDoc = await transaction.get(testRef);
      if (!testDoc.exists()) {
        throw new Error("Test document does not exist!");
      }

      // 3. WRITE SECOND: Now that all reads are done, we can perform our writes.

      // Write #1: Add all the new question documents.
      const questionsCollection = collection(db, "mockTestQuestions");
      questions.forEach((q) => {
        transaction.set(doc(questionsCollection), {
          testId,
          questionSvgCode: q.questionSvgCode,
          options: q.options,
          correctAnswer: q.correctAnswer,
          createdAt: serverTimestamp(),
        });
      });

      // Write #2: Atomically update the questionCount on the parent test document.
      const currentCount = testDoc.data().questionCount || 0;
      const newCount = currentCount + questions.length;
      transaction.update(testRef, { questionCount: newCount });
    });

    return NextResponse.json(
      { message: "Bulk upload successful", uploadedCount: questions.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during bulk upload:", error);
    return NextResponse.json(
      { message: "Failed to bulk upload questions", error: error.message },
      { status: 500 }
    );
  }
}
