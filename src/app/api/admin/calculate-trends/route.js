// src/app/api/admin/calculate-trends/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

    if (adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Forbidden: Not an admin." },
        { status: 403 }
      );
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("completedAt", ">=", oneWeekAgo);
    const resultsSnap = await resultsQuery.get();

    const topicCounts = {};
    const examCounts = {};
    const testIds = [
      ...new Set(resultsSnap.docs.map((doc) => doc.data().testId)),
    ];

    if (testIds.length > 0) {
      const testsQuery = adminDb
        .collection("mockTests")
        .where("__name__", "in", testIds);
      const testsSnap = await testsQuery.get();
      const testsMap = new Map(
        testsSnap.docs.map((doc) => [doc.id, doc.data()])
      );

      resultsSnap.docs.forEach((doc) => {
        const test = testsMap.get(doc.data().testId);
        if (test) {
          if (test.topic)
            topicCounts[test.topic] = (topicCounts[test.topic] || 0) + 1;
          if (test.examName)
            examCounts[test.examName] = (examCounts[test.examName] || 0) + 1;
        }
      });
    }

    const trendingTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const popularExams = Object.entries(examCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    await adminDb.collection("platformStats").doc("latest").set({
      trendingTopics,
      popularExams,
      lastUpdated: new Date(),
    });

    return NextResponse.json({
      message: "Platform trends have been recalculated and saved.",
    });
  } catch (error) {
    console.error("Trends Calculation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
