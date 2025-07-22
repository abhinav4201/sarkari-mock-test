import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// This new route handles joining a FREE test, bypassing payment.
export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const { liveTestId } = await request.json();

    const liveTestRef = adminDb.collection("liveTests").doc(liveTestId);
    const participantRef = liveTestRef.collection("participants").doc(userId);
    const userRef = adminDb.collection("users").doc(userId);

    await adminDb.runTransaction(async (transaction) => {
      const liveTestDoc = await transaction.get(liveTestRef);

      // --- THIS IS THE FIX ---
      // Changed from liveTestDoc.exists() to the correct property: liveTestDoc.exists
      if (!liveTestDoc.exists || !liveTestDoc.data().isFree) {
        throw new Error("This is not a free test event.");
      }

      const participantDoc = await transaction.get(participantRef);
      if (participantDoc.exists) {
        throw new Error("You have already joined this test.");
      }

      // Add user to participants list
      transaction.set(participantRef, {
        userId,
        joinedAt: FieldValue.serverTimestamp(),
      });

      // Increment participant count on the test
      transaction.update(liveTestRef, {
        participantCount: FieldValue.increment(1),
      });

      // Award bonus coins (premium credits) to the user for joining
      transaction.update(userRef, {
        premiumCredits: FieldValue.increment(
          liveTestDoc.data().bonusCoinPrize || 0
        ),
      });
    });

    return NextResponse.json(
      { message: "Successfully joined the free test! Bonus coins awarded." },
      { status: 200 }
    );
  } catch (error) {
    console.error("FREE JOIN ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
