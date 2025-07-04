import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { testId } = await params; // Await params to resolve the promise
    if (!testId) {
      return NextResponse.json(
        { message: "Test ID is missing" },
        { status: 400 }
      );
    }

    const q = query(
      collection(db, "mockTestQuestions"),
      where("testId", "==", testId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { message: "No questions found for this test." },
        { status: 404 }
      );
    }

    // We exclude the correctAnswer field to prevent cheating
    const questions = querySnapshot.docs.map((doc) => {
      const { correctAnswer, ...questionData } = doc.data();
      return { id: doc.id, ...questionData };
    });

    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
