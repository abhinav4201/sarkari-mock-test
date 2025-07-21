// src/app/api/adventures/route.js

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
    const userId = decodedToken.uid;

    // Get user's profile to check their status
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists()) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    const userData = userDoc.data();

    const { id, ...adventureData } = await request.json();

    if (!adventureData.title || !adventureData.examName) {
      return NextResponse.json(
        { message: "Title and Exam Name are required." },
        { status: 400 }
      );
    }

    // For new adventures, enforce the creator ID and their status
    if (!id) {
      adventureData.createdBy = userId;
      adventureData.creatorStatus = userData.monetizationStatus || "regular"; // Save status at time of creation
    }

    const adventureRef = id
      ? adminDb.collection("adventures").doc(id)
      : adminDb.collection("adventures").doc();

    // Security check for updates: ensure user is the owner
    if (id) {
      const existingDoc = await adventureRef.get();
      if (!existingDoc.exists() || existingDoc.data().createdBy !== userId) {
        return NextResponse.json(
          { message: "Forbidden: You do not own this adventure." },
          { status: 403 }
        );
      }
    }

    await adventureRef.set(
      {
        ...adventureData,
        title_lowercase: adventureData.title.toLowerCase(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
        ...(!id && { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    return NextResponse.json({
      message: `Adventure ${id ? "updated" : "created"} successfully!`,
      adventureId: adventureRef.id,
    });
  } catch (error) {
    console.error("User Adventure Save Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
