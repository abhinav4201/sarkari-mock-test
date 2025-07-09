"use client";

import { useMemo } from "react";
import TimeAnalysis from "./TimeAnalysis";
import TopicPerformance from "./TopicPerformance";

// This component calculates analysis based on data passed to it.
export default function DynamicAdvancedAnalysis({ resultData, questions }) {
  // useMemo will perform the calculation only when the result data changes.
  const analysisData = useMemo(() => {
    if (!resultData || !questions || questions.length === 0) return null;

    const { answers, timePerQuestion } = resultData;
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

    for (const question of questions) {
      const questionId = question.id;
      const userAnswerObject = answers[questionId];
      if (!userAnswerObject) continue;

      const timeTaken = userAnswerObject.timeTaken || 0;
      const isCorrect = userAnswerObject.answer === question.correctAnswer;
      const topic = question.topic || "General";

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

    timeAnalysis.avgTimeCorrect =
      correctCount > 0 ? correctTimeSum / correctCount : 0;
    timeAnalysis.avgTimeIncorrect =
      incorrectCount > 0 ? incorrectTimeSum / incorrectCount : 0;

    return { timeAnalysis, topicPerformance };
  }, [resultData, questions]);

  if (!analysisData) {
    return (
      <div className='text-center p-8 text-slate-700'>
        Analysis is not available.
      </div>
    );
  }

  return (
    <div className='mt-12'>
      <div className='space-y-10'>
        <TimeAnalysis data={analysisData.timeAnalysis} />
        <TopicPerformance data={analysisData.topicPerformance} />
      </div>
    </div>
  );
}
