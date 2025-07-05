"use client";

import { useState, useEffect } from "react";
import TimeAnalysis from "./TimeAnalysis";
import TopicPerformance from "./TopicPerformance";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function AdvancedAnalysis({ resultId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!resultId) {
      setLoading(false);
      return;
    }

    const fetchAndCalculateAnalysis = async () => {
      try {
        // --- All logic from the old API route is now here, running securely in the browser ---

        // 1. Fetch the main result document
        const resultRef = doc(db, "mockTestResults", resultId);
        const resultSnap = await getDoc(resultRef);
        if (!resultSnap.exists()) throw new Error("Result data not found.");
        const resultData = resultSnap.data();
        const { testId, answers } = resultData;

        // 2. Fetch all questions for this test to get topics and correct answers
        const questionsQuery = query(
          collection(db, "mockTestQuestions"),
          where("testId", "==", testId)
        );
        const questionsSnapshot = await getDocs(questionsQuery);
        const questions = {};
        questionsSnapshot.forEach((doc) => {
          questions[doc.id] = doc.data();
        });

        // 3. Perform the Analysis Calculation
        const topicPerformance = {};
        const timeAnalysis = {
          totalTime: 0,
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

          const topic = question.topic || "General"; // Use question's topic, or 'General' as fallback
          const timeTaken = userAnswer.timeTaken || 0;
          const isCorrect = userAnswer.answer === question.correctAnswer;

          // Initialize topic if not present
          if (!topicPerformance[topic]) {
            topicPerformance[topic] = { correct: 0, total: 0 };
          }

          topicPerformance[topic].total++;
          timeAnalysis.totalTime += timeTaken;

          if (isCorrect) {
            topicPerformance[topic].correct++;
            correctCount++;
            correctTimeSum += timeTaken;
          } else {
            incorrectCount++;
            incorrectTimeSum += timeTaken;
          }
        }

        // Calculate averages, preventing division by zero
        timeAnalysis.avgTimeCorrect =
          correctCount > 0 ? correctTimeSum / correctCount : 0;
        timeAnalysis.avgTimeIncorrect =
          incorrectCount > 0 ? incorrectTimeSum / incorrectCount : 0;

        // Set the final calculated analysis object to state
        setAnalysis({ timeAnalysis, topicPerformance });
      } catch (err) {
        setError(err.message);
        console.error("Error fetching analysis data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateAnalysis();
  }, [resultId]);

  if (loading) {
    return (
      <div className='text-center p-8 text-slate-700'>
        Loading advanced analysis...
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center p-8 font-semibold text-red-600'>
        Error: {error}
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className='mt-12'>
      <div className='space-y-10'>
        <TimeAnalysis data={analysis.timeAnalysis} />
        <TopicPerformance data={analysis.topicPerformance} />
      </div>
    </div>
  );
}
