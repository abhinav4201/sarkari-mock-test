// src/app/api/results/[resultId]/comparative-analysis/route.js

import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { resultId } = await params;
    if (!resultId) {
      return NextResponse.json(
        { message: "Result ID missing." },
        { status: 400 }
      );
    }

    const resultSnap = await adminDb
      .collection("mockTestResults")
      .doc(resultId)
      .get();
    if (!resultSnap.exists) {
      return NextResponse.json(
        { message: "Result not found." },
        { status: 404 }
      );
    }

    const { testId, score } = resultSnap.data();

    const allResultsQuery = adminDb
      .collection("mockTestResults")
      .where("testId", "==", testId);
    const allResultsSnap = await allResultsQuery.get();

    if (allResultsSnap.empty) {
      return NextResponse.json({
        percentile: 100,
        averageScore: score,
        topperScore: score,
      });
    }

    const scores = allResultsSnap.docs.map((doc) => doc.data().score);
    const scoresBelow = scores.filter((s) => s < score).length;
    const percentile = (scoresBelow / scores.length) * 100;
    const averageScore = scores.reduce((acc, s) => acc + s, 0) / scores.length;
    const topperScore = Math.max(...scores);

    return NextResponse.json({
      percentile: Math.round(percentile),
      averageScore: parseFloat(averageScore.toFixed(2)),
      topperScore,
    });
  } catch (error) {
    console.error("Error fetching comparative analysis:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
