import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      liveTestId,
    } = await request.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { message: "Payment verification failed." },
        { status: 400 }
      );
    }

    const liveTestRef = adminDb.collection("liveTests").doc(liveTestId);
    const participantRef = liveTestRef.collection("participants").doc(userId);

    await adminDb.runTransaction(async (transaction) => {
      const liveTestDoc = await transaction.get(liveTestRef);
      if (!liveTestDoc.exists) {
        throw new Error("Live test not found.");
      }
      const entryFee = liveTestDoc.data().entryFee;

      transaction.set(participantRef, {
        userId,
        paymentId: razorpay_payment_id,
        joinedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(liveTestRef, {
        participantCount: FieldValue.increment(1),
        totalPot: FieldValue.increment(entryFee),
      });
    });

    return NextResponse.json(
      { message: "Successfully joined the test!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("LIVE TEST PAYMENT VERIFICATION ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
