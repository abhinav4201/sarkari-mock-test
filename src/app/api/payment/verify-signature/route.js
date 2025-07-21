// src/app/api/payment/verify-signature/route.js

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

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

    const userRef = adminDb.collection("users").doc(userId);

    await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const userData = userSnap.data();

      // --- START: AMBASSADOR PROGRAM LOGIC ---
      if (userData.referredBy && !userData.hasMadeFirstPurchase) {
        const referrerRef = adminDb
          .collection("users")
          .doc(userData.referredBy);
        const referrerSnap = await transaction.get(referrerRef);

        if (referrerSnap.exists) {
          const referrerData = referrerSnap.data();
          const newReferralCount = (referrerData.referralCount || 0) + 1;

          const referrerUpdates = {};

          if (newReferralCount >= 10) {
            // Referrer has hit the milestone
            referrerUpdates.referralCount = 0; // Reset the counter
            referrerUpdates.isAmbassador = true; // Grant Ambassador status
            referrerUpdates.earnedBadges = FieldValue.arrayUnion(
              "platform_ambassador"
            ); // Grant the badge

            const isReferrerPremium =
              referrerData.premiumAccessExpires &&
              referrerData.premiumAccessExpires.toDate() > new Date();

            if (isReferrerPremium) {
              const currentExpiry = referrerData.premiumAccessExpires.toDate();
              const newExpiry = new Date(
                currentExpiry.setDate(currentExpiry.getDate() + 30)
              );
              referrerUpdates.premiumAccessExpires = newExpiry;
            } else {
              referrerUpdates.premiumCredits = FieldValue.increment(1);
            }
          } else {
            // Referrer is still on the way
            referrerUpdates.referralCount = newReferralCount;
          }

          transaction.update(referrerRef, referrerUpdates);
          transaction.update(userRef, { hasMadeFirstPurchase: true });
        }
      }
      // --- END: AMBASSADOR PROGRAM LOGIC ---

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      transaction.update(userRef, {
        premiumAccessExpires: expiryDate,
      });
    });

    return NextResponse.json(
      { message: "Payment successful!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("PAYMENT VERIFICATION ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
