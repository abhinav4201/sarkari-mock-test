import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// --- YOUR TIERED PRIZE DISTRIBUTION LOGIC ---
const getPrizeDistribution = (participantCount) => {
  if (participantCount < 100)
    return { winners: 3, prizeSlabs: [0.5, 0.3, 0.2] }; // Top 3: 50/30/20
  if (participantCount < 500)
    return { winners: 5, prizeSlabs: [0.4, 0.25, 0.15, 0.1, 0.1] }; // Top 5
  if (participantCount < 1000)
    return {
      winners: 10,
      prizeSlabs: [0.3, 0.2, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
    }; // Top 10
  return {
    winners: 20,
    prizeSlabs: [0.25, 0.15, 0.1, ...Array(17).fill(0.0294)],
  }; // Top 20
};

const getPrizePoolPercentage = (participantCount) => {
  if (participantCount < 100) return 0.6; // 60%
  if (participantCount < 500) return 0.7; // 70%
  if (participantCount < 1000) return 0.75; // 75%
  return 0.8; // 80%
};

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

    // Fetch all results for the source test ID within the event time frame
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("testId", "==", liveTestData.sourceTestId)
      .where("completedAt", ">=", liveTestData.startTime)
      .where("completedAt", "<=", liveTestData.endTime);

    const resultsSnap = await resultsQuery.get();
    const allResults = resultsSnap.docs.map((doc) => doc.data());

    // --- Anti-Fraud and Ranking Logic ---
    const validResults = allResults.filter((result) => {
      const estimatedTimeInSeconds = liveTestData.estimatedTime * 60;
      // Disqualify if completed in less than 20% of the time
      return result.totalTimeTaken > estimatedTimeInSeconds * 0.2;
    });

    const rankedResults = validResults.sort(
      (a, b) => b.score - a.score || a.totalTimeTaken - b.totalTimeTaken
    );

    // --- Prize Calculation Logic ---
    const { winners: numberOfWinners, prizeSlabs } = getPrizeDistribution(
      liveTestData.participantCount
    );
    const prizePoolPercentage = getPrizePoolPercentage(
      liveTestData.participantCount
    );
    const totalPrizePool =
      liveTestData.prizeCap > 0 && liveTestData.prizeCap < liveTestData.totalPot
        ? liveTestData.prizeCap
        : liveTestData.totalPot * prizePoolPercentage;

    const winners = rankedResults
      .slice(0, numberOfWinners)
      .map((result, index) => ({
        rank: index + 1,
        userId: result.userId,
        userName: result.userName, // Assuming you store this on the result doc
        score: result.score,
        prizeAmount: Math.floor(totalPrizePool * prizeSlabs[index]),
      }));

    const batch = adminDb.batch();
    batch.update(liveTestRef, {
      status: "completed",
      winners,
      totalPrizePool,
      prizeDistribution: {
        prizePoolPercentage,
        numberOfWinners,
        slabs: prizeSlabs,
      },
    });

    winners.forEach((winner) => {
      const winningsRef = adminDb
        .collection("users")
        .doc(winner.userId)
        .collection("liveTestWinnings")
        .doc(liveTestId);
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
