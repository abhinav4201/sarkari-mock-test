"use client"; // This converts the page to a Client Component

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import QuestionUploader from "@/components/admin/QuestionUploader";
import BulkQuestionUploader from "@/components/admin/BulkQuestionUploader";
import QuestionList from "@/components/admin/QuestionList";

// Helper functions can remain, as they'll be called from the client
async function getTestDetails(testId) {
  const testRef = doc(db, "mockTests", testId);
  const testSnap = await getDoc(testRef);
  if (!testSnap.exists()) {
    return null;
  }
  return { id: testSnap.id, ...testSnap.data() };
}

async function getTestQuestions(testId) {
  const q = query(
    collection(db, "mockTestQuestions"),
    where("testId", "==", testId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export default function ManageTestQuestionsPage() {
  const params = useParams();
  const testId = params.testId;

  // State to hold the data and loading status
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on the client side when the component mounts
  useEffect(() => {
    if (!testId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [testData, questionsData] = await Promise.all([
          getTestDetails(testId),
          getTestQuestions(testId),
        ]);

        if (!testData) {
          // Handle case where test is not found
          notFound();
          return;
        }

        setTest(testData);
        setQuestions(questionsData);
      } catch (error) {
        console.error("Failed to load test data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [testId]);

  if (loading) {
    return <div className='text-center p-12'>Loading Test Details...</div>;
  }

  if (!test) {
    // This will be shown if the test was not found after loading
    return <div className='text-center p-12'>Test not found.</div>;
  }

  return (
    <div>
      <h1 className='text-3xl font-bold mb-2 text-slate-900'>
        Manage Questions
      </h1>
      <p className='text-lg text-indigo-600 font-semibold'>{test.title}</p>
      <p className='mb-6 text-slate-700 mt-1'>
        Currently has {questions.length} question(s).
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
        <div className='lg:col-span-1 space-y-8'>
          {/* Single Question Uploader */}
          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
            <h2 className='text-xl font-semibold mb-6 text-slate-900'>
              Add New Question
            </h2>
            <QuestionUploader testId={testId} />
          </div>

          {/* Bulk Question Uploader */}
          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
            <h2 className='text-xl font-semibold mb-6 text-slate-900'>
              Bulk Upload
            </h2>
            <p className='text-sm text-slate-700 mb-4'>
              Upload multiple questions at once using a CSV file.
            </p>
            <BulkQuestionUploader testId={testId} />
          </div>
        </div>
        <div className='lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold mb-6 text-slate-900'>
            Added Questions
          </h2>
          <QuestionList initialQuestions={questions} testId={testId} />
        </div>
      </div>
    </div>
  );
}
