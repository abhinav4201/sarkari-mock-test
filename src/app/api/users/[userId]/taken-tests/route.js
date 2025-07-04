import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = await params; // Await params to resolve the promise

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is missing." },
        { status: 400 }
      );
    }

    const resultsQuery = query(
      collection(db, "mockTestResults"),
      where("userId", "==", userId)
    );
    const resultsSnapshot = await getDocs(resultsQuery);

    if (resultsSnapshot.empty) {
      return NextResponse.json([], { status: 200 }); // Return empty array if no results
    }

    // Use a Set to get a list of unique test IDs the user has taken
    const takenTestIds = new Set();
    resultsSnapshot.forEach((doc) => {
      takenTestIds.add(doc.data().testId);
    });

    // Convert the Set to an array before returning
    return NextResponse.json(Array.from(takenTestIds), { status: 200 });
  } catch (error) {
    console.error("Error fetching taken tests:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
