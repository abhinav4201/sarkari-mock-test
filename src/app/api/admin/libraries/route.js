// src/app/api/admin/libraries/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";

// Generate a unique, easy-to-read join code
const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

export async function POST(request) {
  try {
    // const { adminAuth, db: adminDb } = getFirebaseAdmin();
    const {
      libraryName,
      contactEmail,
      contactPhone,
      commissionPerTest,
      monthlyTestLimit,
    } = await request.json();

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

    if (!libraryName || !contactEmail || !contactPhone || !commissionPerTest) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(contactPhone)) {
      return NextResponse.json(
        { message: "Invalid phone number format. Must be 10 digits." },
        { status: 400 }
      );
    }

    const newLibraryData = {
      libraryName,
      contactEmail,
      contactPhone,
      commissionPerTest: Number(commissionPerTest),
      monthlyTestLimit: Number(monthlyTestLimit) || 10,
      uniqueJoinCode: nanoid(), // Generate a random 8-character code
      ownerJoinCode: nanoid(10),
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      ownerId: null,
    };

    const newLibraryRef = await adminDb
      .collection("libraries")
      .add(newLibraryData);

    return NextResponse.json({
      message: "Library created successfully!",
      libraryId: newLibraryRef.id,
      ...newLibraryData,
    });
  } catch (error) {
    console.error("--- LIBRARY CREATION ERROR ---", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
