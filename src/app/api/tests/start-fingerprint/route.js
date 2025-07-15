// src/app/api/tests/start-fingerprint/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin"; // Correctly import the initialized services
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // We no longer need to call a getter function
    const { testId } = await request.json();

    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    if (!testId) {
      return NextResponse.json(
        { message: "Test ID is required." },
        { status: 400 }
      );
    }

    // Use the admin SDK's methods to add a new document
    await adminDb.collection("testStarts").add({
      userId,
      testId,
      startedAt: FieldValue.serverTimestamp(),
      ip: request.headers.get("x-forwarded-for") ?? "127.0.0.1",
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "Start attempt logged.",
    });
  } catch (error) {
    console.error("--- FINGERPRINTING ERROR ---", error);
    // Fail silently so the user can still proceed with the test
    return NextResponse.json(
      { success: true, message: "Could not log start event." },
      { status: 200 } // Return success to not block the user
    );
  }
}
