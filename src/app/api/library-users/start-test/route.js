// src/app/api/library-users/start-test/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
// REMOVE: import { FieldValue } from "firebase-admin/firestore"; // No longer needed here
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // Get the student's user profile from the 'users' collection
    const userSnap = await adminDb.collection("users").doc(userId).get();
    // If not a library user, or no libraryId, allow test without limit check
    if (
      !userSnap.exists ||
      userSnap.data().role !== "library-student" ||
      !userSnap.data().libraryId
    ) {
      return NextResponse.json({ allowed: true });
    }

    const userData = userSnap.data();
    const libraryId = userData.libraryId;

    // Get the library's test limit
    const librarySnap = await adminDb
      .collection("libraries")
      .doc(libraryId)
      .get();
    const limit = librarySnap.data().monthlyTestLimit;

    // If limit is 0 or not set, it's unlimited.
    if (!limit || limit === 0) {
      return NextResponse.json({ allowed: true });
    }

    // Check the user's current count for this month
    const yearMonth = `${new Date().getFullYear()}-${
      new Date().getMonth() + 1
    }`;

    const countRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("monthlyTestCounts")
      .doc(yearMonth);
    const countSnap = await countRef.get();
    const currentCount = countSnap.exists ? countSnap.data().count : 0;

    if (currentCount >= limit) {
      // Return 403 if limit is reached
      return NextResponse.json(
        {
          allowed: false,
          message: `You have reached your monthly limit of ${limit} tests.`,
        },
        { status: 403 }
      );
    }

    // REMOVED: The increment operation is moved to the test submission transaction.
    // await countRef.set(
    //   {
    //     count: FieldValue.increment(1),
    //   },
    //   { merge: true }
    // );

    // If all checks pass and limit is not hit, allow starting the test.
    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error("Error in start-test API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
