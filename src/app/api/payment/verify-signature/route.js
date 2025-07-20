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

      if (userData.referredBy && !userData.hasMadeFirstPurchase) {
        const referrerRef = adminDb
          .collection("users")
          .doc(userData.referredBy);
        const referrerSnap = await transaction.get(referrerRef);

        if (referrerSnap.exists) {
          const referrerData = referrerSnap.data();
          const newReferralCount = (referrerData.referralCount || 0) + 1;

          if (newReferralCount >= 10) {
            const isReferrerPremium =
              referrerData.premiumAccessExpires &&
              referrerData.premiumAccessExpires.toDate() > new Date();

            if (isReferrerPremium) {
              const currentExpiry = referrerData.premiumAccessExpires.toDate();
              const newExpiry = new Date(
                currentExpiry.setDate(currentExpiry.getDate() + 30)
              );
              transaction.update(referrerRef, {
                referralCount: 0,
                premiumAccessExpires: newExpiry,
              });
            } else {
              transaction.update(referrerRef, {
                referralCount: 0,
                premiumCredits: FieldValue.increment(1),
              });
            }
          } else {
            transaction.update(referrerRef, {
              referralCount: newReferralCount,
            });
          }
          transaction.update(userRef, { hasMadeFirstPurchase: true });
        }
      }

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
