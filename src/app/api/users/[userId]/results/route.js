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

const PAGE_SIZE = 5; // Fetch 5 results at a time

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    // 1. Fetch user's test results
    let resultsQuery;
    const baseQuery = [
      collection(db, "mockTestResults"),
      where("userId", "==", userId),
      orderBy("completedAt", "desc"),
    ];

    if (cursor) {
      // If there's a cursor, fetch the next page starting after the last document
      const cursorTimestamp = Timestamp.fromMillis(parseInt(cursor));
      resultsQuery = query(
        ...baseQuery,
        startAfter(cursorTimestamp),
        limit(PAGE_SIZE)
      );
    } else {
      // If no cursor, fetch the very first page
      resultsQuery = query(...baseQuery, limit(PAGE_SIZE));
    }

    const resultsSnapshot = await getDocs(resultsQuery);


    if (resultsSnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    // 2. Fetch details for each test
    const results = await Promise.all(
      resultsSnapshot.docs.map(async (resultDoc) => {
        const resultId = resultDoc.id;
        try {
          const resultData = resultDoc.data();


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
