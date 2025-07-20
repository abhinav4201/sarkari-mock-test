import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // 1. Get IDs of tests the user has already taken
    const resultsQuery = adminDb
      .collection("mockTestResults")
      .where("userId", "==", userId);
    const resultsSnap = await resultsQuery.get();
    const takenTestIds = new Set(
      resultsSnap.docs.map((doc) => doc.data().testId)
    );

    // 2. Fetch popular tests:
    //    a) User-created tests that are 'approved'
    const userApprovedTestsQuery = adminDb
      .collection("mockTests")
      .where("status", "==", "approved")
      .orderBy("takenCount", "desc")
      .limit(20); // Get a larger pool to filter from

    //    b) Admin-created tests (which typically have no 'status' field, or status is null)
    //    Firestore does not directly support querying for 'field does not exist'.
    //    A common workaround is to query for a specific value that indicates admin-created,
    //    or fetch all and filter, or use a separate field.
    //    Based on src/app/mock-tests/page.js, admin tests have status == null.
    const adminTestsQuery = adminDb
      .collection("mockTests")
      .where("status", "==", null) // Assuming admin tests explicitly set status to null or it's absent and queries for null catch them
      .orderBy("takenCount", "desc")
      .limit(20); // Get a larger pool

    const [userApprovedTestsSnap, adminTestsSnap] = await Promise.all([
      userApprovedTestsQuery.get(),
      adminTestsQuery.get(),
    ]);

    let allPopularTests = [];

    userApprovedTestsSnap.forEach((doc) => {
      allPopularTests.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || null, // Ensure serializable
      });
    });

    adminTestsSnap.forEach((doc) => {
      // Ensure we only add tests that truly have no 'status' or status is null
      // and avoid duplicates if a test somehow appears in both queries (unlikely with current setup)
      if (
        typeof doc.data().status === "undefined" ||
        doc.data().status === null
      ) {
        allPopularTests.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis() || null, // Ensure serializable
        });
      }
    });

    // Remove duplicates based on ID (if any)
    const uniquePopularTestsMap = new Map(
      allPopularTests.map((test) => [test.id, test])
    );
    const uniquePopularTests = Array.from(uniquePopularTestsMap.values());

    // Sort the combined list by takenCount (desc) and then createdAt (desc)
    uniquePopularTests.sort((a, b) => {
      const takenA = a.takenCount || 0;
      const takenB = b.takenCount || 0;
      if (takenB !== takenA) {
        return takenB - takenA;
      }
      const createdA = a.createdAt || 0;
      const createdB = b.createdAt || 0;
      return createdB - createdA;
    });

    // 3. Filter out taken tests and select the top 2
    const recommendations = uniquePopularTests
      .filter((test) => !takenTestIds.has(test.id))
      .slice(0, 2); // Show top 2 popular tests

    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    console.error("Popularity Recommendation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
