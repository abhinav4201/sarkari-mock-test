// src/components/results/ActionableInsights.js

"use client";

import { BrainCircuit, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ActionableInsights({ topicPerformance }) {
  const [recommendations, setRecommendations] = useState([]);
  const [weakestTopic, setWeakestTopic] = useState(null);

  useEffect(() => {
    if (topicPerformance) {
      const topics = Object.entries(topicPerformance).map(([topic, stats]) => ({
        topic,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      }));

      const sortedTopics = topics.sort((a, b) => a.accuracy - b.accuracy);

      if (sortedTopics.length > 0 && sortedTopics[0].accuracy < 60) {
        setWeakestTopic(sortedTopics[0]);
      }
    }
  }, [topicPerformance]);

  useEffect(() => {
    if (weakestTopic) {
      fetch("/api/tests/recommendations/by-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: weakestTopic.topic }),
      })
        .then((res) => res.json())
        .then(setRecommendations);
    }
  }, [weakestTopic]);

  if (!weakestTopic) {
    return null;
  }

  return (
    <div className='mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl'>
      <div className='flex items-center gap-3'>
        <BrainCircuit className='h-8 w-8 text-blue-600' />
        <h3 className='text-2xl font-bold text-slate-900'>
          Actionable Insights
        </h3>
      </div>
      <p className='mt-2 text-slate-700'>
        You seem to be struggling with{" "}
        <strong className='font-bold'>{weakestTopic.topic}</strong>, with an
        accuracy of{" "}
        <strong className='font-bold'>
          {Math.round(weakestTopic.accuracy)}%
        </strong>
        . Here are some tests to help you improve:
      </p>
      <div className='mt-4 space-y-3'>
        {recommendations.map((test) => (
          <Link
            key={test.id}
            href={`/mock-tests/${test.id}`}
            className='block p-4 bg-white rounded-lg hover:bg-slate-50 border'
          >
            <div className='flex items-center gap-3'>
              <BookOpen className='h-5 w-5 text-indigo-500' />
              <span className='font-semibold text-indigo-700'>
                {test.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
