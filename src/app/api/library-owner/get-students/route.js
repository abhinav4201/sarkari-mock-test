import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { libraryId } = await request.json();
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!userToken) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }
    if (!libraryId) {
      return NextResponse.json(
        { message: "Bad Request: Missing libraryId" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    const userDocSnap = await adminDb.collection("users").doc(userId).get();

    if (!userDocSnap.exists) {
      return NextResponse.json(
        { message: "Forbidden: User profile not found" },
        { status: 403 }
      );
    }

    const userData = userDocSnap.data();
    const ownedLibraries = userData.libraryOwnerOf || [];
    if (
      userData.role !== "library-owner" ||
      !ownedLibraries.includes(libraryId)
    ) {
      return NextResponse.json(
        { message: "Forbidden: You do not own this library" },
        { status: 403 }
      );
    }

    // Fetch students from the 'users' collection
    const studentsQuery = adminDb
      .collection("users")
      .where("libraryId", "==", libraryId)
      .where("role", "==", "library-student")
      .orderBy("createdAt", "desc");

    const studentsSnapshot = await studentsQuery.get();

    const students = studentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toMillis() : null,
      };
    });

    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("API Error fetching students:", error);
    if (error.code === "auth/id-token-expired") {
      return NextResponse.json(
        { message: "Unauthorized: Token expired" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
