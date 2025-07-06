import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  or,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();

    // Basic server-side validation
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }
    // Also validate the phone number format on the server
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { message: "Invalid phone number format." },
        { status: 400 }
      );
    }

    // --- RATE LIMITING LOGIC STARTS HERE ---
    const contactsRef = collection(db, "contacts");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startOfDay = Timestamp.fromDate(today);

    // Build the query to check for submissions today by email OR phone.
    // This requires an OR condition.
    const queryConstraints = [where("submittedAt", ">=", startOfDay)];
    if (phone) {
      // If a phone number is provided, check against both email and phone.
      queryConstraints.push(
        or(where("email", "==", email), where("phone", "==", phone))
      );
    } else {
      // If no phone, just check against the email.
      queryConstraints.push(where("email", "==", email));
    }

    const rateLimitQuery = query(contactsRef, ...queryConstraints);
    const snapshot = await getDocs(rateLimitQuery);

    // If 2 or more submissions already exist, block the request.
    if (snapshot.size >= 2) {
      return NextResponse.json(
        {
          message:
            "We understand your urgency and will connect with you on priority. Thank you for your patience.",
        },
        { status: 429 } // 429: Too Many Requests
      );
    }
    await addDoc(contactsRef, {
      name,
      email,
      phone: phone || "", // Save phone number, or an empty string if not provided
      message,
      submittedAt: serverTimestamp(),
    });

    return NextResponse.json(
      { message: "Submission successful" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Submission failed due to a server error." },
      { status: 500 }
    );
  }
}
