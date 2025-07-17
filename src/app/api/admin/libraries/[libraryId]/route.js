// src/app/api/admin/libraries/[libraryId]/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { libraryId } = params;
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
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    if (
      !libraryId ||
      !libraryName ||
      !contactEmail ||
      !contactEmail ||
      !commissionPerTest
    ) {
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

    const libraryRef = adminDb.collection("libraries").doc(libraryId);
    await libraryRef.update({
      libraryName,
      contactEmail,
      contactPhone,
      commissionPerTest: Number(commissionPerTest),
      monthlyTestLimit: Number(monthlyTestLimit) || 10,
    });

    return NextResponse.json({ message: "Library updated successfully." });
  } catch (error) {
    console.error("--- LIBRARY UPDATE ERROR ---", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
