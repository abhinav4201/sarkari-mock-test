// src/app/api/admin/generate-challenges/route.js

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

// A predefined list of potential challenges.
const CHALLENGE_TEMPLATES = [
  {
    id: "history_10",
    text: "Answer 10 'Indian History' questions correctly.",
    topic: "Indian History",
    target: 10,
  },
  {
    id: "gk_5_correct",
    text: "Answer 5 'General Knowledge' questions correctly.",
    subject: "General Knowledge",
    target: 5,
  },
  {
    id: "complete_any_1",
    text: "Complete any 1 test.",
    type: "completion",
    target: 1,
  },
  {
    id: "score_75_plus",
    text: "Get a score of 75% or higher on one test.",
    type: "score",
    target: 75,
  },
  {
    id: "quant_15",
    text: "Answer 15 'Quantitative Aptitude' questions correctly.",
    subject: "Quantitative Aptitude",
    target: 15,
  },
];

// A simple function to select 3 random challenges.
const selectDailyChallenges = () => {
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(userToken);
    const adminUser = await adminAuth.getUser(decodedToken.uid);

    if (adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Forbidden: Not an admin." },
        { status: 403 }
      );
    }

    const batch = adminDb.batch();

    // 1. Generate and set new daily challenges
    const newChallenges = selectDailyChallenges();
    const dailyChallengeRef = adminDb.collection("challenges").doc("daily");
    batch.set(dailyChallengeRef, {
      challenges: newChallenges,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 2. (Placeholder) Generate personalized study plans for active users
    // In a real-world scenario, you'd query for recently active users.
    // For now, this is a placeholder to show the structure.
    // You would expand this to analyze user performance and generate tailored plans.
    const usersQuery = adminDb.collection("users").limit(50); // Example: Generate for first 50 users
    const usersSnap = await usersQuery.get();

    usersSnap.forEach((userDoc) => {
      const userId = userDoc.id;
      const weekId = `${new Date().getFullYear()}-W${Math.floor(
        new Date().getWeek()
      )}`;
      const planRef = adminDb
        .collection("users")
        .doc(userId)
        .collection("studyPlan")
        .doc(weekId);

      // This is a simplified plan. You would replace this with real analysis.
      const weeklyPlan = {
        weekId: weekId,
        tasks: [
          {
            day: "Monday",
            text: "Focus Area: Take a 'Modern History' test.",
            completed: false,
          },
          {
            day: "Tuesday",
            text: "Review today's Vocabulary & GK.",
            completed: false,
          },
          {
            day: "Wednesday",
            text: "Challenge: Beat your high score on 'Algebra Basics'.",
            completed: false,
          },
          // ... and so on for the week
        ],
      };
      batch.set(planRef, weeklyPlan, { merge: true });
    });

    await batch.commit();

    return NextResponse.json({
      message: `Successfully generated daily challenges and study plans for ${usersSnap.size} users.`,
    });
  } catch (error) {
    console.error("Challenge Generation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper to get week number
Date.prototype.getWeek = function () {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  var week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
};
