// src/app/api/admin/handle-test-approval/route.js

import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const user = await adminAuth.getUser(decodedToken.uid);

    // Ensure the user is an admin
    if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Forbidden: Not an admin." },
        { status: 403 }
      );
    }

    const { testId, decision } = await request.json();

    if (!testId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const testRef = doc(adminDb, "mockTests", testId);

    if (decision === "approved") {
      await updateDoc(testRef, {
        status: "approved",
      });
      return NextResponse.json(
        { message: "Test approved successfully." },
        { status: 200 }
      );
    } else if (decision === "rejected") {
      // For rejected tests, we simply delete them.
      await deleteDoc(testRef);
      return NextResponse.json(
        { message: "Test rejected and deleted." },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error handling test approval:", error);
    if (error.code?.startsWith("auth/")) {
      return NextResponse.json(
        { message: "Authentication error." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
