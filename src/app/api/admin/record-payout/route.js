// src/app/api/admin/record-payout/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin"; // Correctly import the initialized services
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // We no longer need to call a getter function.
    // adminAuth and adminDb are now available directly from the import.
    const { targetUserId, amount, transactionId } = await request.json();

    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

    if (adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Forbidden: Not an admin." },
        { status: 403 }
      );
    }

    if (!targetUserId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { message: "Invalid data provided." },
        { status: 400 }
      );
    }

    const earningsRef = adminDb.collection("earnings").doc(targetUserId);

    // Use a transaction to safely read and update the earnings document
    await adminDb.runTransaction(async (transaction) => {
      const earningsDoc = await transaction.get(earningsRef);
      if (!earningsDoc.exists) {
        // Use the .exists property for server-side
        throw new Error("This creator does not have an earnings document yet.");
      }

      const earningsData = earningsDoc.data();
      const currentPaidAmount = earningsData.paidAmount || 0;
      const currentPendingAmount = earningsData.pendingAmount || 0;

      const newPaidAmount = currentPaidAmount + Number(amount);
      const newPendingAmount = currentPendingAmount - Number(amount);

      // Use the transaction object to perform the update
      transaction.update(earningsRef, {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount > 0 ? newPendingAmount : 0,
        paymentHistory: FieldValue.arrayUnion({
          amount: Number(amount),
          paidAt: FieldValue.serverTimestamp(),
          transactionId: transactionId || `manual_${Date.now()}`,
        }),
      });
    });

    return NextResponse.json({ message: "Payout recorded successfully." });
  } catch (error) {
    console.error("--- PAYOUT RECORDING ERROR ---", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
