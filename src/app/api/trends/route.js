// src/app/api/trends/route.js
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const trendsSnap = await adminDb
      .collection("platformStats")
      .doc("latest")
      .get();

    if (!trendsSnap.exists) {
      return NextResponse.json({ trendingTopics: [], popularExams: [] });
    }

    return NextResponse.json(trendsSnap.data());
  } catch (error) {
    console.error("Trends API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
