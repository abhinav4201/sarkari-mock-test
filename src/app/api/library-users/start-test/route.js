import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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
    if (!userSnap.exists || userSnap.data().role !== "library-student") {
      // Not a library user, so no limit applies. Allow test.
      return NextResponse.json({ allowed: true });
    }

    const userData = userSnap.data();
    const libraryId = userData.libraryId;

    if (!libraryId) {
      return NextResponse.json({ allowed: true }); // Failsafe
    }

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

    // The monthly counts are now in a subcollection of the user document
    const countRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("monthlyTestCounts")
      .doc(yearMonth);
    const countSnap = await countRef.get();
    const currentCount = countSnap.exists ? countSnap.data().count : 0;

    if (currentCount >= limit) {
      return NextResponse.json(
        {
          allowed: false,
          message: `You have reached your monthly limit of ${limit} tests.`,
        },
        { status: 403 }
      );
    }

    // If allowed, increment their count and grant permission
    await countRef.set(
      {
        count: FieldValue.increment(1),
      },
      { merge: true }
    );

    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error("Error in start-test API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
