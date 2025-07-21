// src/app/api/admin/adventures/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
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

    const { id, ...adventureData } = await request.json();

    if (!adventureData.title || !adventureData.examName) {
      return NextResponse.json(
        { message: "Title and Exam Name are required." },
        { status: 400 }
      );
    }

    const adventureRef = id
      ? adminDb.collection("adventures").doc(id)
      : adminDb.collection("adventures").doc();

    await adventureRef.set(
      {
        ...adventureData,
        title_lowercase: adventureData.title.toLowerCase(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
        ...(!id && { createdAt: FieldValue.serverTimestamp() }), // Add createdAt only for new documents
      },
      { merge: true }
    );

    return NextResponse.json({
      message: `Adventure ${id ? "updated" : "created"} successfully!`,
      adventureId: adventureRef.id,
    });
  } catch (error) {
    console.error("Adventure Save Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
