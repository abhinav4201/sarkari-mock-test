// src/app/api/admin/calculate-earnings/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin"; // Correctly import the initialized services
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

const REWARD_PER_UNIQUE_TAKER = 2;
const PLATFORM_FEE_PERCENTAGE = 0.2;

export async function POST(request) {
  try {
    // We no longer need to call a getter function.
    // adminAuth and adminDb are now available directly from the import.

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

    const approvedUsersQuery = adminDb
      .collection("users")
      .where("monetizationStatus", "==", "approved");
    const approvedUsersSnapshot = await approvedUsersQuery.get();
    const approvedUserIds = approvedUsersSnapshot.docs.map((doc) => doc.id);

    if (approvedUserIds.length === 0) {
      return NextResponse.json({
        message: "No approved creators to calculate earnings for.",
      });
    }

    // We need to handle the case where there are more than 30 approved users, as 'in' queries are limited.
    // For now, this handles up to 30 creators at once. For more, this would need to be batched.
    const analyticsQuery = adminDb
      .collection("testAnalytics")
      .where("createdBy", "in", approvedUserIds);
    const analyticsSnapshot = await analyticsQuery.get();
    const allAnalytics = analyticsSnapshot.docs.map((doc) => doc.data());

    const batch = adminDb.batch();
    let updatedUserCount = 0;

    for (const userId of approvedUserIds) {
      const userTestsAnalytics = allAnalytics.filter(
        (analytic) => analytic.createdBy === userId
      );
      const totalUniqueTakers = userTestsAnalytics.reduce(
        (acc, analytic) => acc + (analytic.uniqueTakers?.length || 0),
        0
      );

      const grossEarnings = totalUniqueTakers * REWARD_PER_UNIQUE_TAKER;
      const platformFees = grossEarnings * PLATFORM_FEE_PERCENTAGE;
      const netEarnings = grossEarnings - platformFees;

      const earningsRef = adminDb.collection("earnings").doc(userId);
      const earningsDoc = await earningsRef.get();
      const paidAmount = earningsDoc.exists
        ? earningsDoc.data().paidAmount || 0
        : 0;

      const pendingAmount = netEarnings - paidAmount;

      batch.set(
        earningsRef,
        {
          totalEarnings: grossEarnings,
          platformFees,
          netEarnings,
          pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
          lastCalculated: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      updatedUserCount++;
    }

    await batch.commit();

    return NextResponse.json({
      message: `Successfully calculated earnings for ${updatedUserCount} creators.`,
    });
  } catch (error) {
    console.error("--- EARNINGS CALCULATION ERROR ---", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
