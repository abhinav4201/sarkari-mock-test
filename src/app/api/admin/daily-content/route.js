import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { type, svgCodes, category } = await request.json();

    let data;
    let collectionName;

    switch (type) {
      case "vocabulary":
        if (!svgCodes.wordSvg || !svgCodes.meaningSvg) {
          return NextResponse.json(
            { message: "Missing vocabulary SVG code" },
            { status: 400 }
          );
        }
        collectionName = "dailyVocabulary";
        data = {
          wordSvgCode: svgCodes.wordSvg,
          meaningSvgCode: svgCodes.meaningSvg,
          createdAt: serverTimestamp(),
        };
        break;

      case "gk":
        if (!svgCodes.contentSvg || !category) {
          return NextResponse.json(
            { message: "Missing GK SVG code or category" },
            { status: 400 }
          );
        }
        collectionName = "dailyGk";
        data = {
          contentSvgCode: svgCodes.contentSvg,
          category: category,
          createdAt: serverTimestamp(),
        };
        break;

      default:
        return NextResponse.json(
          { message: "Invalid content type" },
          { status: 400 }
        );
    }

    await addDoc(collection(db, collectionName), data);

    return NextResponse.json(
      { message: "Content uploaded successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading content:", error);
    return NextResponse.json(
      { message: "Failed to upload content", error: error.message },
      { status: 500 }
    );
  }
}
