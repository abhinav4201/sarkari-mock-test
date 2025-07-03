import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { NextResponse } from "next/server";

const PAGE_SIZE = 10; // Fetch 10 contacts at a time

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    let contactsQuery;
    const baseQuery = [
      collection(db, "contacts"),
      orderBy("submittedAt", "desc"),
    ];

    if (cursor) {
      const cursorTimestamp = Timestamp.fromMillis(parseInt(cursor));
      contactsQuery = query(
        ...baseQuery,
        startAfter(cursorTimestamp),
        limit(PAGE_SIZE)
      );
    } else {
      contactsQuery = query(...baseQuery, limit(PAGE_SIZE));
    }

    const contactsSnapshot = await getDocs(contactsQuery);

    const contacts = contactsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert timestamp to a serializable format
        submittedAt: data.submittedAt ? data.submittedAt.toMillis() : null,
      };
    });

    return NextResponse.json(contacts, { status: 200 });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
