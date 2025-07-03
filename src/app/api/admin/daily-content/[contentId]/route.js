import { db } from "@/lib/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// This function handles DELETING a content item.
export async function DELETE(request, { params }) {
  try {
    const { contentId } = params;
    const { type } = await request.json(); // 'dailyVocabulary' or 'dailyGk'

    if (!contentId || !type) {
      return NextResponse.json(
        { message: "Missing content ID or type." },
        { status: 400 }
      );
    }

    const docRef = doc(db, type, contentId);
    await deleteDoc(docRef);

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { message: "Failed to delete content", error: error.message },
      { status: 500 }
    );
  }
}

// This new function handles UPDATING a content item.
export async function PUT(request, { params }) {
  try {
    const { contentId } = params;
    const { type, svgCodes, category } = await request.json();

    if (!contentId || !type || !svgCodes) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const docRef = doc(db, type, contentId);
    let dataToUpdate;

    if (type === "dailyVocabulary") {
      if (!svgCodes.wordSvg || !svgCodes.meaningSvg) {
        return NextResponse.json(
          { message: "Missing SVG code for vocabulary." },
          { status: 400 }
        );
      }
      dataToUpdate = {
        wordSvgCode: svgCodes.wordSvg,
        meaningSvgCode: svgCodes.meaningSvg,
      };
    } else {
      // type === 'dailyGk'
      if (!svgCodes.contentSvg || !category) {
        return NextResponse.json(
          { message: "Missing SVG code or category for GK." },
          { status: 400 }
        );
      }
      dataToUpdate = {
        contentSvgCode: svgCodes.contentSvg,
        category: category,
      };
    }

    // This command updates the document in Firestore with the new data.
    await updateDoc(docRef, dataToUpdate);

    return NextResponse.json(
      { message: "Item updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { message: "Failed to update content", error: error.message },
      { status: 500 }
    );
  }
}
