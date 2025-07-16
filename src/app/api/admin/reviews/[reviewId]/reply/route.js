// src/app/api/admin/reviews/[reviewId]/reply/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { reviewId } = params;
    const { replyText } = await request.json();

    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

    if (adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
    if (!reviewId || !replyText) {
      return NextResponse.json({ message: "Missing data." }, { status: 400 });
    }

    const reviewRef = adminDb.collection("reviews").doc(reviewId);

    // Use a transaction to ensure atomicity
    await adminDb.runTransaction(async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists) {
        throw new Error("Review not found.");
      }
      const reviewData = reviewDoc.data();

      // 1. Add the reply to the review document
      transaction.update(reviewRef, {
        replies: FieldValue.arrayUnion({
          text: replyText,
          repliedBy: adminUser.displayName,
          createdAt: FieldValue.serverTimestamp(),
        }),
      });

      // 2. Create a notification for the original poster
      const notificationRef = adminDb.collection("notifications").doc();
      transaction.set(notificationRef, {
        userId: reviewData.userId,
        message: `Admin replied to your review on the test: "${
          reviewData.testTitle || "a test"
        }"`,
        link: `/mock-tests/${reviewData.testId}`,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ message: "Reply posted successfully." });
  } catch (error) {
    console.error("--- REPLY POSTING ERROR ---", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
