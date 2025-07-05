// app/api/results/[resultId]/analysis/route.js

import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { resultId } = await params;
    if (!resultId) {
      return NextResponse.json(
        { message: "Result ID is missing." },
        { status: 400 }
      );
    }

    // 1. Fetch the main result document
    const resultRef = doc(db, "mockTestResults", resultId);
    const resultSnap = await getDoc(resultRef);

    if (!resultSnap.exists()) {
      return NextResponse.json(
        { message: "Result not found." },
        { status: 404 }
      );
    }
    const resultData = resultSnap.data();
    const { testId, answers } = resultData;

    // --- FIX: FETCH THE MAIN TEST DOCUMENT TO GET THE TOPIC ---
    // 2. Fetch the parent test document from the 'mockTests' collection.
    const testRef = doc(db, "mockTests", testId);
    const testSnap = await getDoc(testRef);
    if (!testSnap.exists()) {
      throw new Error("Parent test document not found.");
    }
    // Get the single topic for the entire test.
    const mainTestTopic = testSnap.data().topic || "General";

    // 3. Fetch all questions for this test
    const questionsQuery = query(
      collection(db, "mockTestQuestions"),
      where("testId", "==", testId)
    );
    const questionsSnapshot = await getDocs(questionsQuery);
    const questions = {};
    questionsSnapshot.forEach((doc) => {
      questions[doc.id] = doc.data();
    });

    // 4. Perform the Analysis
    const topicPerformance = {};
    const timeAnalysis = {
      totalTime: 0,
      timesPerQuestion: [],
      avgTimeCorrect: 0,
      avgTimeIncorrect: 0,
    };

    let correctCount = 0;
    let incorrectCount = 0;
    let correctTimeSum = 0;
    let incorrectTimeSum = 0;

    for (const questionId in answers) {
      const question = questions[questionId];
      const userAnswer = answers[questionId];

      if (!question || !userAnswer) continue;

      // --- FIX: USE THE 'mainTestTopic' FOR ANALYSIS ---
      const topic = mainTestTopic; // Use the topic we fetched earlier.
      const { answer, timeTaken } = userAnswer;
      const isCorrect = answer === question.correctAnswer;

      // Initialize topic if not present
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0, times: [] };
      }

      topicPerformance[topic].total++;
      topicPerformance[topic].times.push(timeTaken);
      timeAnalysis.totalTime += timeTaken;
      timeAnalysis.timesPerQuestion.push({
        question: question.questionSvgCode,
        time: timeTaken,
        isCorrect,
      });

      if (isCorrect) {
        topicPerformance[topic].correct++;
        correctCount++;
        correctTimeSum += timeTaken;
      } else {
        incorrectCount++;
        incorrectTimeSum += timeTaken;
      }
    }

    // Calculate averages
    timeAnalysis.avgTimeCorrect =
      correctCount > 0 ? correctTimeSum / correctCount : 0;
    timeAnalysis.avgTimeIncorrect =
      incorrectCount > 0 ? incorrectTimeSum / incorrectCount : 0;

    const analysis = {
      timeAnalysis,
      topicPerformance,
    };

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { message: "Failed to fetch analysis", error: error.message },
      { status: 500 }
    );
  }
}
