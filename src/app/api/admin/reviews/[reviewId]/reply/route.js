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
    const replierUser = await adminAuth.getUser(decodedToken.uid);

    if (!reviewId || !replyText) {
      return NextResponse.json({ message: "Missing data." }, { status: 400 });
    }

    const reviewRef = adminDb.collection("reviews").doc(reviewId);

    await adminDb.runTransaction(async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists) {
        throw new Error("Review not found.");
      }
      const reviewData = reviewDoc.data();

      // 1. Add the new reply to the subcollection
      const replyRef = reviewRef.collection("replies").doc();
      transaction.set(replyRef, {
        text: replyText,
        userId: replierUser.uid,
        authorName: replierUser.displayName,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 2. Atomically increment the replyCount on the parent review document
      transaction.update(reviewRef, {
        replyCount: FieldValue.increment(1),
      });

      // 3. Create a notification for the original poster (if they aren't replying to themselves)
      if (reviewData.userId !== replierUser.uid) {
        const testSnap = await adminDb
          .collection("mockTests")
          .doc(reviewData.testId)
          .get();
        const testTitle = testSnap.exists() ? testSnap.data().title : "a test";

        const notificationRef = adminDb.collection("notifications").doc();
        transaction.set(notificationRef, {
          userId: reviewData.userId,
          message: `${replierUser.displayName} replied to your review on the test: "${testTitle}"`,
          link: `/mock-tests/${reviewData.testId}`,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
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
