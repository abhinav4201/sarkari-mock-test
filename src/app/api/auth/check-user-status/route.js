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

    const userDocRef = adminDb.collection("users").doc(uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      // Determine the user type based on the 'role' field
      const userType = userData.role || "regular"; // Default to 'regular' if role is not set

      return NextResponse.json({
        status: "found",
        type: userType,
        data: {
          ...userData,
          // Ensure owned libraries are sent, default to empty array
          ownedLibraryIds: userData.libraryOwnerOf || [],
        },
      });
    }

    // If user is authenticated but not in the collection, they are a new user
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
