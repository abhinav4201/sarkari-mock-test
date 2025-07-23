import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { liveTestId } = await params;
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    if (!liveTestId) {
      return NextResponse.json(
        { message: "Live Test ID is missing." },
        { status: 400 }
      );
    }

    const testRef = adminDb.collection("liveTests").doc(liveTestId);
    const testSnap = await testRef.get();

    if (!testSnap.exists) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 }
      );
    }

    const testData = testSnap.data();

    // Fetch the specific user's result for this live event
    const userResultQuery = adminDb
      .collection("liveTestResults")
      .where("liveTestId", "==", liveTestId)
      .where("userId", "==", userId)
      .limit(1);

    const userResultSnap = await userResultQuery.get();
    let userResult = null;
    if (!userResultSnap.empty) {
      userResult = userResultSnap.docs[0].data();
    }

    const finalData = {
      ...testData,
      createdAt: testData.createdAt ? testData.createdAt.toMillis() : null,
      startTime: testData.startTime ? testData.startTime.toMillis() : null,
      endTime: testData.endTime ? testData.endTime.toMillis() : null,
      winners: testData.winners || [],
      userResult: userResult, // This can be null if the user didn't participate
    };

    return NextResponse.json(finalData, { status: 200 });
  } catch (error) {
    console.error("Error fetching live test results:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
