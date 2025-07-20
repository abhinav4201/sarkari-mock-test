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
      ...new Set(
        resultsSnap.docs.map((doc) => doc.data().testId).filter(Boolean)
      ),
    ];

    const testsMap = new Map();

    if (testIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < testIds.length; i += 30) {
        chunks.push(testIds.slice(i, i + 30));
      }

      const promises = chunks.map((chunk) =>
        adminDb.collection("mockTests").where("__name__", "in", chunk).get()
      );
      const snapshots = await Promise.all(promises);

      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          testsMap.set(doc.id, doc.data());
        });
      });
    }

    resultsSnap.docs.forEach((doc) => {
      const test = testsMap.get(doc.data().testId);
      if (test) {
        if (test.topic)
          topicCounts[test.topic] = (topicCounts[test.topic] || 0) + 1;
        if (test.examName)
          examCounts[test.examName] = (examCounts[test.examName] || 0) + 1;
      }
    });

    // --- THIS IS THE FIX ---
    // Convert the arrays of arrays into arrays of objects.
    const trendingTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const popularExams = Object.entries(examCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    // --- END OF FIX ---

    await adminDb.collection("platformStats").doc("latest").set({
      trendingTopics,
      popularExams,
      lastUpdated: new Date(),
    });

    return NextResponse.json({
      message: "Platform trends have been recalculated successfully.",
    });
  } catch (error) {
    console.error("Trends Calculation Error:", error);
    return NextResponse.json(
      { message: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}
