import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { NextResponse } from "next/server";
import Papa from "papaparse";

export async function GET() {
  try {
    // Fetch data from Firestore
    const contactsRef = collection(db, "contacts");
    const q = query(contactsRef, orderBy("submittedAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      ...doc.data(),
      submittedAt: doc.data().submittedAt.toDate().toISOString(),
    }));

    // Convert JSON to CSV
    const csv = Papa.unparse(data);

    // Return CSV file as response
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="contacts.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to download data" },
      { status: 500 }
    );
  }
}