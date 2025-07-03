import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync"; // Using the synchronous API for simplicity

export async function GET() {
  try {
    // 1. Fetch data from Firestore
    const contactsRef = collection(db, "contacts");
    const q = query(contactsRef, orderBy("submittedAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return new NextResponse("No contact submissions to download.", {
        status: 404,
      });
    }

    const data = snapshot.docs.map((doc) => {
      const docData = doc.data();
      return {
        name: docData.name,
        email: docData.email,
        message: docData.message,
        submittedAt: docData.submittedAt.toDate().toISOString(),
      };
    });

    // 2. Convert JSON to CSV using csv-stringify
    const csv = stringify(data, { header: true }); // header: true automatically uses keys as column headers

    // 3. Return CSV file as a response
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="contacts_${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV Download Error:", error);
    return NextResponse.json(
      { message: "Failed to download data", error: error.message },
      { status: 500 }
    );
  }
}
