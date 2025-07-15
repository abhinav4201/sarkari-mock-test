// src/app/api/admin/handle-monetization-request/route.js

import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
    const { targetUserId, decision } = await request.json();

    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

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

    const userRef = doc(adminDb, "users", targetUserId);
    await updateDoc(userRef, {
      monetizationStatus: decision,
    });

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
