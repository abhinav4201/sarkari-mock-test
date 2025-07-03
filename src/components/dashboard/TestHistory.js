"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function TestHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`/api/users/${user.uid}/results`);
          const data = await res.json();
          setHistory(data);
        } catch (error) {
          console.error("Failed to fetch test history", error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [user]);

  if (loading) {
    return <p>Loading your test history...</p>;
  }

  if (history.length === 0) {
    return (
      <p>
        You haven't completed any tests yet.{" "}
        <Link href='/mock-tests' className='font-bold underline'>
          Start one now!
        </Link>
      </p>
    );
  }

  return (
    <div className='space-y-4'>
      {history.map((item) => (
        <div
          key={item.resultId}
          className='p-4 border rounded-lg flex justify-between items-center bg-gray-50'
        >
          <div>
            <h3 className='font-bold text-lg text-gray-800'>
              {item.testTitle}
            </h3>
            <p className='text-sm text-gray-500'>
              Completed on: {new Date(item.completedAt).toLocaleDateString()}
            </p>
            <p className='text-gray-700'>
              Score:{" "}
              <span className='font-bold'>
                {item.score} / {item.totalQuestions}
              </span>
            </p>
          </div>
          <Link
            href={`/mock-tests/results/${item.resultId}`}
            className='px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700'
          >
            View Result
          </Link>
        </div>
      ))}
    </div>
  );
}
