import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { libraryId, month, year } = await request.json(); // Accept month and year
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!userToken || !libraryId || !month || !year) {
      return NextResponse.json(
        { message: "Bad Request: Missing parameters" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const userDocSnap = await adminDb.collection("users").doc(userId).get();
    if (!userDocSnap.exists) {
      return NextResponse.json(
        { message: "Forbidden: User not found" },
        { status: 403 }
      );
    }

    const userData = userDocSnap.data();
    const isOwner =
      userData.role === "library-owner" ||
      (Array.isArray(userData.libraryOwnerOf) &&
        userData.libraryOwnerOf.length > 0);

    if (!isOwner || !userData.libraryOwnerOf.includes(libraryId)) {
      return NextResponse.json(
        { message: "Forbidden: You do not own this library" },
        { status: 403 }
      );
    }

    const studentsQuery = adminDb
      .collection("users")
      .where("libraryId", "==", libraryId)
      .where("role", "==", "library-student");
    const studentsSnapshot = await studentsQuery.get();

    const startDate = Timestamp.fromDate(new Date(year, month - 1, 1));
    const endDate = Timestamp.fromDate(new Date(year, month, 0, 23, 59, 59));

    const studentsWithCounts = await Promise.all(
      studentsSnapshot.docs.map(async (doc) => {
        const studentData = doc.data();

        const resultsQuery = adminDb
          .collection("mockTestResults")
          .where("userId", "==", studentData.uid)
          .where("libraryId", "==", libraryId)
          .where("completedAt", ">=", startDate)
          .where("completedAt", "<=", endDate);

        const resultsSnapshot = await resultsQuery.get();

        return {
          id: doc.id,
          ...studentData,
          createdAt: studentData.createdAt
            ? studentData.createdAt.toMillis()
            : null,
          testsTakenThisMonth: resultsSnapshot.size,
        };
      })
    );

    // Sort by name before sending
    studentsWithCounts.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(studentsWithCounts, { status: 200 });
  } catch (error) {
    console.error("API Error fetching students:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
