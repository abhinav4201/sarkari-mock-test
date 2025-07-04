import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { testId } = params;

    if (!testId) {
      return NextResponse.json(
        { message: "Test ID is missing." },
        { status: 400 }
      );
    }

    const testRef = doc(db, "mockTests", testId);
    const testSnap = await getDoc(testRef);

    if (!testSnap.exists()) {
      return NextResponse.json({ message: "Test not found." }, { status: 404 });
    }

    const data = testSnap.data();
    const testDetails = {
      id: testSnap.id,
      title: data.title,
      estimatedTime: data.estimatedTime,
      // Add any other details the test page might need
    };

    return NextResponse.json(testDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching test details:", error);
    return NextResponse.json(
      { message: "Failed to fetch test details", error: error.message },
      { status: 500 }
    );
  }
}
