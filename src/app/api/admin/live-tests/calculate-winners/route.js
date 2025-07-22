import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const { liveTestId } = await request.json();
    const liveTestRef = adminDb.collection("liveTests").doc(liveTestId);
    const liveTestSnap = await liveTestRef.get();
    const liveTestData = liveTestSnap.data();

    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("testId", "==", liveTestData.sourceTestId);
    const resultsSnap = await resultsQuery.get();
    const allResults = resultsSnap.docs.map((doc) => doc.data());

    // --- (Your advanced anti-cheat and ranking logic would go here) ---
    const rankedResults = allResults.sort(
      (a, b) => b.score - a.score || a.totalTimeTaken - b.totalTimeTaken
    );

    const prizePool = liveTestData.totalPot * 0.8;
    const winners = rankedResults.slice(0, 3).map((result, index) => ({
      rank: index + 1,
      userId: result.userId,
      score: result.score,
      prizeAmount: prizePool * (index === 0 ? 0.5 : index === 1 ? 0.3 : 0.2), // 50/30/20 split
    }));

    const batch = adminDb.batch();
    batch.update(liveTestRef, {
      status: "completed",
      winners,
      totalPrizePool: prizePool,
    });

    // --- THIS IS THE CORRECTED LOGIC ---
    // Instead of updating the generic 'earnings' doc, we create a new document
    // in the user's specific 'liveTestWinnings' subcollection.
    winners.forEach((winner) => {
      const winningsRef = adminDb
        .collection("users")
        .doc(winner.userId)
        .collection("liveTestWinnings")
        .doc(liveTestId); // Use the live test ID as the document ID for the win

      batch.set(winningsRef, {
        prizeAmount: winner.prizeAmount,
        rank: winner.rank,
        testTitle: liveTestData.title,
        wonAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({
      message: "Winners calculated and prizes allocated!",
    });
  } catch (error) {
    console.error("WINNER CALCULATION ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
