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

    // 1. Verify the user is a valid, logged-in user
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const userId = decodedToken.uid;

    // 2. Use the Admin SDK to verify they OWN the requested library
    const userDocSnap = await adminDb.collection("users").doc(userId).get();

    // --- THIS IS THE FIX ---
    // The Admin SDK uses '.exists' as a property, not a function.
    if (!userDocSnap.exists) {
      return NextResponse.json(
        { message: "Forbidden: User profile not found" },
        { status: 403 }
      );
    }
    // --- END OF FIX ---

    const ownedLibraries = userDocSnap.data().libraryOwnerOf || [];
    if (!ownedLibraries.includes(libraryId)) {
      return NextResponse.json(
        { message: "Forbidden: You do not own this library" },
        { status: 403 }
      );
    }

    // 3. If authorized, fetch the student data using Admin privileges
    const studentsQuery = adminDb
      .collection("libraryUsers")
      .where("libraryId", "==", libraryId)
      .orderBy("createdAt", "desc");

    const studentsSnapshot = await studentsQuery.get();

    // Convert Firestore Timestamps to a serializable format (milliseconds)
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
