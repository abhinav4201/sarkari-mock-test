// src/app/api/tests/[testId]/track-impression/route.js

import { adminDb } from "@/lib/firebase-admin"; // Directly import the initialized adminDb
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { testId } = await params;

    if (!testId) {
      return NextResponse.json(
        { message: "Test ID is missing." },
        { status: 400 }
      );
    }

    // This will now use the valid, imported adminDb instance
    // and correctly point to the testAnalytics collection.
    const analyticsRef = adminDb.collection("testAnalytics").doc(testId);

    await analyticsRef.update({
      impressionCount: FieldValue.increment(1),
    });

    return NextResponse.json(
      { success: true, message: "Impression tracked." },
      { status: 200 }
    );
  } catch (error) {
    // We log the error but don't want to break the user's experience.
    console.error("--- FULL IMPRESSION TRACKING ERROR ---", error);
    // Returning a success status to the client prevents unnecessary error popups.
    return NextResponse.json(
      { success: true, message: "Impression event processed." },
      { status: 200 }
    );
  }
}
