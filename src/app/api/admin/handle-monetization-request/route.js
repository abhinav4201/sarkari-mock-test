// src/app/api/admin/handle-monetization-request/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin"; // Import the guaranteed valid instances
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { targetUserId, decision } = await request.json();

    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

    // Security Check: Ensure the caller is the admin
    if (adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Forbidden: Not an admin." },
        { status: 403 }
      );
    }

    if (!targetUserId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    // --- THIS IS THE CORRECTED LOGIC ---
    // Use the admin SDK's methods to reference and update the document
    const userRef = adminDb.collection("users").doc(targetUserId);

    await userRef.update({
      monetizationStatus: decision,
    });
    // --- END OF CORRECTION ---

    return NextResponse.json({
      message: `User monetization status set to ${decision}.`,
    });
  } catch (error) {
    console.error("Error handling monetization request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
