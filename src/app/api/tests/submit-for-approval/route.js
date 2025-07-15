// src/app/api/tests/submit-for-approval/route.js

import { NextResponse } from "next/server";
// --- THIS IS THE CORRECTED IMPORT ---
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { compareTwoStrings } from "string-similarity";

const SIMILARITY_THRESHOLD = 0.85;

export async function POST(request) {
  try {
    // We no longer need to call getFirebaseAdmin()
    // const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();

    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const { title, topic, subject, examName, estimatedTime } =
      await request.json();

    if (
      !title ||
      title.trim().length < 10 ||
      !topic ||
      topic.trim().length < 3 ||
      !subject ||
      subject.trim().length < 3 ||
      !estimatedTime ||
      Number(estimatedTime) <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid data. Please check all fields and their requirements.",
        },
        { status: 400 }
      );
    }

    const testsRef = adminDb.collection("mockTests");
    const snapshot = await testsRef.get();
    const existingTitles = snapshot.docs.map((doc) => doc.data().title);

    for (const existing of existingTitles) {
      if (
        compareTwoStrings(title.toLowerCase(), existing.toLowerCase()) >
        SIMILARITY_THRESHOLD
      ) {
        return NextResponse.json(
          { message: "This test title is too similar to an existing one." },
          { status: 409 }
        );
      }
    }

    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    const newTestDocData = {
      title,
      title_lowercase: title.toLowerCase(),
      topic,
      subject,
      examName: examName || "",
      estimatedTime,
      createdBy: userId,
      status: "approved",
      monetizationStatus: "pending_review",
      likeCount: 0,
      questionCount: 0,
      isPremium: false,
      isDynamic: false,
      createdAt: FieldValue.serverTimestamp(),
      submitterInfo: { ip, userAgent: request.headers.get("user-agent") },
    };

    const newTestRef = await testsRef.add(newTestDocData);

    const analyticsRef = adminDb.collection("testAnalytics").doc(newTestRef.id);
    await analyticsRef.set({
      testId: newTestRef.id,
      createdBy: userId,
      impressionCount: 0,
      takenCount: 0,
      uniqueTakers: [],
    });

    return NextResponse.json(
      { message: "Test submitted successfully!", newTestId: newTestRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("--- FULL SUBMISSION ERROR ---", error);
    if (error.code?.startsWith("auth/")) {
      return NextResponse.json(
        { message: "Authentication error." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
