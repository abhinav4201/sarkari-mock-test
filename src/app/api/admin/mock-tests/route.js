import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const testData = await request.json();
    // Add validation here

    const testsCollection = collection(db, "mockTests");
    await addDoc(testsCollection, {
      ...testData,
      questionCount: 0, // Initialize question count
      createdAt: serverTimestamp(),
    });

    return NextResponse.json(
      { message: "Test created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create test" },
      { status: 500 }
    );
  }
}
