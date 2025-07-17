import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  const token = request.headers.get("Authorization")?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check the 'users' collection first (for regular users and owners)
    const userDocRef = adminDb.collection("users").doc(uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      const ownedLibraries = userData.libraryOwnerOf || [];
      const isOwner = ownedLibraries.length > 0;

      return NextResponse.json({
        status: "found",
        type: isOwner ? "library-owner" : "regular-user",
        data: {
          ...userData,
          // Ensure owned libraries are sent, default to empty array
          ownedLibraryIds: ownedLibraries,
        },
      });
    }

    // If not in 'users', check the 'libraryUsers' collection
    const libraryUserDocRef = adminDb.collection("libraryUsers").doc(uid);
    const libraryUserSnap = await libraryUserDocRef.get();

    if (libraryUserSnap.exists) {
      const libraryUserData = libraryUserSnap.data();
      return NextResponse.json({
        status: "found",
        type: "library-student",
        data: libraryUserData,
      });
    }

    // If user is authenticated but not in either collection, they are a new user
    return NextResponse.json({
      status: "not-found",
      type: "new-user",
      data: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      },
    });
  } catch (error) {
    console.error("Error in check-user-status API:", error);
    if (
      error.code === "auth/id-token-revoked" ||
      error.code === "auth/id-token-expired"
    ) {
      return NextResponse.json(
        { error: "Authentication token is invalid." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
