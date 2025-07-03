import { db } from "@/lib/firebase";
import { doc, deleteDoc, runTransaction, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { questionId } = await params; // Await params to resolve the promise
    const { testId } = await request.json(); // Get testId from the request body

    if (!questionId || !testId) {
      return NextResponse.json(
        { message: "Missing question or test ID." },
        { status: 400 }
      );
    }

    await runTransaction(db, async (transaction) => {
      const questionRef = doc(db, "mockTestQuestions", questionId);
      const testRef = doc(db, "mockTests", testId);

      // 1. Read the test document first
      const testDoc = await transaction.get(testRef);
      if (!testDoc.exists()) {
        throw new Error("Parent test document does not exist!");
      }

      // 2. Perform writes: delete the question and decrement the count
      transaction.delete(questionRef);

      const currentCount = testDoc.data().questionCount || 0;
      const newCount = Math.max(0, currentCount - 1); // Ensure count doesn't go below 0
      transaction.update(testRef, { questionCount: newCount });
    });

    return NextResponse.json(
      { message: "Question deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { message: "Failed to delete question", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { questionId } = await params; // Await params to resolve the promise
    const { questionSvgCode, options, correctAnswer } = await request.json();

    if (!questionId || !questionSvgCode || !options || !correctAnswer) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const questionRef = doc(db, "mockTestQuestions", questionId);

    // Update the document with the new data
    await updateDoc(questionRef, {
      questionSvgCode,
      options,
      correctAnswer,
    });

    return NextResponse.json(
      { message: "Question updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { message: "Failed to update question", error: error.message },
      { status: 500 }
    );
  }
}
