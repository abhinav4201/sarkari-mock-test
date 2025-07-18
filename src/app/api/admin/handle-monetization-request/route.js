// src/app/api/admin/handle-monetization-request/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { targetUserId, decision } = await request.json();

    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

    // Security Check: Ensure the caller is the admin
    if (adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Forbidden: Not an admin." },
        { status: 403 }
      );
    }

    if (!targetUserId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(targetUserId);

    // --- THIS IS THE CORRECTED LOGIC ---
    if (decision === "approved") {
      // Use a batch write to update the user and all their tests atomically
      const batch = adminDb.batch();

      // 1. Update the user's monetization status
      batch.update(userRef, { monetizationStatus: "approved" });

      // 2. Find all tests by this user that are pending monetization
      const testsToApproveQuery = adminDb
        .collection("mockTests")
        .where("createdBy", "==", targetUserId)
        .where("monetizationStatus", "==", "pending_review");

      const testsSnapshot = await testsToApproveQuery.get();

      // 3. Add an update for each pending test to the batch
      testsSnapshot.forEach((doc) => {
        batch.update(doc.ref, { monetizationStatus: "approved" });
      });

      // 4. Commit all changes at once
      await batch.commit();
    } else {
      // If rejected, just update the user's status
      await userRef.update({
        monetizationStatus: decision,
      });
    }
    // --- END OF CORRECTION ---

    return NextResponse.json({
      message: `User monetization status set to ${decision}.`,
    });
  } catch (error) {
    console.error("Error handling monetization request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
