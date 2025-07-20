// src/app/api/admin/calculate-leaderboard/route.js

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

    const userScores = {};
    resultsSnap.docs.forEach((doc) => {
      const { userId, score } = doc.data();
      if (!userScores[userId] || score > userScores[userId].highestScore) {
        userScores[userId] = { highestScore: score, userId };
      }
    });

    const leaderboardData = Object.values(userScores)
      .sort((a, b) => b.highestScore - a.highestScore)
      .slice(0, 50);

    const leaderboardRef = adminDb.collection("leaderboards").doc("weekly");
    await leaderboardRef.set({
      users: leaderboardData,
      lastUpdated: new Date(),
    });

    return NextResponse.json({
      message: "Weekly leaderboard has been recalculated and saved.",
    });
  } catch (error) {
    console.error("Leaderboard Calculation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
