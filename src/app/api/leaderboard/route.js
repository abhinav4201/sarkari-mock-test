// src/app/api/leaderboard/route.js
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const leaderboardSnap = await adminDb
      .collection("leaderboards")
      .doc("weekly")
      .get();
    if (!leaderboardSnap.exists) {
      return NextResponse.json([]);
    }

    const leaderboardData = leaderboardSnap.data().users;
    const userIds = leaderboardData.map((u) => u.userId);

    if (userIds.length === 0) {
      return NextResponse.json([]);
    }

    const usersQuery = adminDb.collection("users").where("uid", "in", userIds);
    const usersSnap = await usersQuery.get();
    const usersMap = new Map(
      usersSnap.docs.map((doc) => [doc.data().uid, doc.data().name])
    );

    const finalLeaderboard = leaderboardData.map((entry) => ({
      ...entry,
      userName: usersMap.get(entry.userId) || "Anonymous",
    }));

    return NextResponse.json(finalLeaderboard);
  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
