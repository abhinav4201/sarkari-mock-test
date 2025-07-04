import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = await params; // Await params to resolve the promise

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is missing." },
        { status: 400 }
      );
    }

    // 1. Fetch user's test results, ordered by most recent
    const resultsQuery = query(
      collection(db, "mockTestResults"),
      where("userId", "==", userId),
      orderBy("completedAt", "desc")
    );
    const resultsSnapshot = await getDocs(resultsQuery);

    if (resultsSnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    // 2. Fetch details for each test they took
    const results = await Promise.all(
      resultsSnapshot.docs.map(async (resultDoc) => {
        const resultData = resultDoc.data();
        const testRef = doc(db, "mockTests", resultData.testId);
        const testSnap = await getDoc(testRef);

        const testTitle = testSnap.exists()
          ? testSnap.data().title
          : "Deleted Test";

        return {
          resultId: resultDoc.id,
          score: resultData.score,
          totalQuestions: resultData.totalQuestions,
          completedAt: resultData.completedAt
            ? resultData.completedAt.toMillis()
            : null,
          testTitle: testTitle,
        };
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error fetching user results:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
