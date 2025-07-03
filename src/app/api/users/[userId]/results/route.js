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
  console.log("--- API Route: /api/users/[userId]/results ---");
  try {
    const { userId } = params;
    console.log(`Fetching results for userId: ${userId}`);

    // 1. Fetch user's test results
    const resultsQuery = query(
      collection(db, "mockTestResults"),
      where("userId", "==", userId),
      orderBy("completedAt", "desc")
    );
    const resultsSnapshot = await getDocs(resultsQuery);

    if (resultsSnapshot.empty) {
      console.log("No results found for this user. Returning empty array.");
      return NextResponse.json([], { status: 200 });
    }
    console.log(`Found ${resultsSnapshot.size} result document(s).`);

    // 2. Fetch details for each test
    const results = await Promise.all(
      resultsSnapshot.docs.map(async (resultDoc) => {
        const resultId = resultDoc.id;
        try {
          const resultData = resultDoc.data();

          // --- ADDED DETAILED LOGGING FOR EACH DOCUMENT ---
          console.log(`Processing resultId: ${resultId}`);

          if (!resultData.testId) {
            console.error(
              `Error: Result document ${resultId} is missing the 'testId' field.`
            );
            return null; // Skip this result if it's malformed
          }

          const testRef = doc(db, "mockTests", resultData.testId);
          const testSnap = await getDoc(testRef);

          const testTitle = testSnap.exists()
            ? testSnap.data().title
            : "Deleted Test";

          if (!resultData.completedAt) {
            console.error(
              `Error: Result document ${resultId} is missing the 'completedAt' timestamp.`
            );
            return null; // Skip this result
          }

          return {
            resultId: resultId,
            score: resultData.score,
            totalQuestions: resultData.totalQuestions,
            completedAt: resultData.completedAt.toDate(),
            testTitle: testTitle,
          };
        } catch (innerError) {
          console.error(
            `Failed to process result document ${resultId}:`,
            innerError
          );
          return null; // Return null if there's an error processing a single result
        }
      })
    );

    // Filter out any nulls from results that failed to process
    const validResults = results.filter((r) => r !== null);
    console.log(`Successfully processed ${validResults.length} results.`);

    return NextResponse.json(validResults, { status: 200 });
  } catch (error) {
    console.error("--- FATAL ERROR in API Route ---:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
