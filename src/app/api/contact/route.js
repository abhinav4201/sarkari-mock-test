import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();
    const contactsCollection = collection(db, "contacts");
    await addDoc(contactsCollection, {
      name,
      email,
      message,
      submittedAt: serverTimestamp(),
    });
    return NextResponse.json(
      { message: "Submission successful" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Submission failed" }, { status: 500 });
  }
}
