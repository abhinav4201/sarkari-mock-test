// src/app/api/tests/start-fingerprint/route.js

import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
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

    // Log the start attempt in a new collection for auditing
    await adminDb.collection("testStarts").add({
      userId,
      testId,
      startedAt: FieldValue.serverTimestamp(),
      ip: request.headers.get("x-forwarded-for") ?? "127.0.0.1",
      userAgent: request.headers.get("user-agent"),
    });

    // You could add more advanced logic here, e.g., check if this user/IP has started
    // this test too many times in the last hour and return an error if so.
    // For now, we will just log the attempt.

    return NextResponse.json({
      success: true,
      message: "Start attempt logged.",
    });
  } catch (error) {
    console.error("--- FINGERPRINTING ERROR ---", error);
    // Fail silently so the user can still proceed with the test
    return NextResponse.json(
      { success: false, message: "Could not log start event." },
      { status: 200 }
    );
  }
}
