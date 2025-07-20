// src/app/api/admin/questions/review/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { questionId, decision, questionData } = await request.json();
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

    // Security Check: Ensure the caller is the admin
    if (adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Forbidden: Not an admin." },
        { status: 403 }
      );
    }

    if (!questionId || !["approve", "reject"].includes(decision)) {
      return NextResponse.json(
        { message: "Invalid request data." },
        { status: 400 }
      );
    }

    const questionRef = adminDb.collection("mockTestQuestions").doc(questionId);

    // Use a transaction to ensure atomicity
    await adminDb.runTransaction(async (transaction) => {
      const questionDoc = await transaction.get(questionRef);

      if (!questionDoc.exists) {
        throw new Error("Question not found.");
      }

      if (decision === "approve") {
        if (!questionData) {
          throw new Error("Missing question data for approval.");
        }

        // Add to questionBank
        const newBankQuestionRef = adminDb.collection("questionBank").doc();
        transaction.set(newBankQuestionRef, {
          questionSvgCode: questionData.questionSvgCode,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation || "",
          topic: questionData.topic,
          subject: questionData.subject,
          isPremium: questionData.isPremium || false, // Ensure premium status is carried over
          sourceTestId: questionDoc.data().testId, // Reference the original test
          sourceQuestionId: questionId, // Reference the original question in mockTestQuestions
          createdAt: FieldValue.serverTimestamp(),
        });

        // Update status of original question
        transaction.update(questionRef, {
          status: "approved",
          approvedAt: FieldValue.serverTimestamp(),
          bankQuestionId: newBankQuestionRef.id, // Link to the new bank question
        });
      } else if (decision === "reject") {
        // Update status of original question
        transaction.update(questionRef, {
          status: "rejected",
          rejectedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json(
      { message: `Question ${decision}ed successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error processing question review:`, error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
