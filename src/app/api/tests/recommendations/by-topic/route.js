// src/app/api/tests/recommendations/by-topic/route.js

import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { topic, count = 2 } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { message: "Topic is required." },
        { status: 400 }
      );
    }

    const testsQuery = adminDb
      .collection("mockTests")
      .where("topic", "==", topic)
      .where("status", "in", ["approved", null])
      .limit(count);

    const testsSnap = await testsQuery.get();
    const tests = testsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Error fetching recommendations by topic:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
