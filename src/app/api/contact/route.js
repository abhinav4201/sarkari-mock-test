// src/app/api/contact/route.js

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { message: "Invalid phone number format." },
        { status: 400 }
      );
    }

    // --- Rate Limiting Logic ---
    const contactsRef = collection(db, "contacts");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startOfDay = Timestamp.fromDate(today);

    // Query 1: Check for submissions with the same email today
    const emailQuery = query(
      contactsRef,
      where("email", "==", email),
      where("submittedAt", ">=", startOfDay)
    );

    // Query 2: Check for submissions with the same phone number today
    const phoneQuery = query(
      contactsRef,
      where("phone", "==", phone),
      where("submittedAt", ">=", startOfDay)
    );

    let emailSnapshot, phoneSnapshot;
    try {
      [emailSnapshot, phoneSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(phoneQuery),
      ]);
    } catch (queryError) {
      console.error("Firestore Query Error:", {
        message: queryError.message,
        code: queryError.code,
        details: queryError.details,
      });
      throw new Error("Failed to check rate limits due to server error.");
    }

    if (emailSnapshot.size >= 2 || phoneSnapshot.size >= 2) {
      return NextResponse.json(
        {
          message:
            "We understand your urgency and will connect with you on priority. Thank you for your patience.",
        },
        { status: 429 }
      );
    }

    // Add the new contact document
    let newDocRef;
    try {
      newDocRef = await addDoc(contactsRef, {
        name,
        email,
        phone,
        message,
        submittedAt: serverTimestamp(),
      });
    } catch (writeError) {
      console.error("Firestore Write Error:", {
        message: writeError.message,
        code: writeError.code,
        details: writeError.details,
      });
      throw new Error("Failed to save contact due to server error.");
    }

    return NextResponse.json(
      { message: "Submission successful", docId: newDocRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("CONTACT FORM SUBMISSION ERROR:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: `Submission failed due to a server error: ${error.message}` },
      { status: 500 }
    );
  }
}
