// src/app/dashboard/monetization/[testId]/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
import BackButton from "@/components/BackButton";
import { ShieldAlert } from "lucide-react";
import toast from "react-hot-toast"; // Ensure toast is imported

export default function ManageUserTestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const testId = params.testId;

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !testId) return;
    try {
      const testRef = doc(db, "mockTests", testId);
      const testSnap = await getDoc(testRef);

      if (!testSnap.exists()) {
        notFound();
        return;
      }

      const testData = { id: testSnap.id, ...testSnap.data() };

      // Ensure that only the creator of the test can manage its questions
      if (testData.createdBy !== user.uid) {
        setIsOwner(false);
        setLoading(false);
        return;
      }

      setIsOwner(true);
      setTest(testData);

      // Fetch questions associated with this specific test
      const questionsQuery = query(
        collection(db, "mockTestQuestions"),
        where("testId", "==", testId)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(questionsData);
    } catch (error) {
      console.error("Failed to load test data:", error);
      toast.error("Failed to load your test data.");
    } finally {
      setLoading(false);
    }
  }, [testId, user]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  if (loading || authLoading) {
    return (
      <div className='text-center p-12 text-lg font-medium'>Loading...</div>
    );
  }

  if (!isOwner) {
    return (
      <div className='flex flex-col justify-center items-center h-screen text-center p-4'>
        <ShieldAlert className='h-16 w-16 text-red-500 mb-4' />
        <h1 className='text-2xl font-bold'>Access Denied</h1>
        <p className='mt-2 text-slate-700'>
          You do not have permission to manage this test.
        </p>
        <div className='mt-6'>
          <BackButton />
        </div>
      </div>
    );
  }

  if (!test) {
    return notFound();
  }

  return (
    <div className='bg-slate-100 min-h-screen p-4 py-8'>
      <div className='container mx-auto'>
        {/* <div className='mb-6'>
          <BackButton />
        </div> */}
        <h1 className='text-3xl font-bold mb-2 text-slate-900'>
          Manage Questions for Your Test
        </h1>
        <p className='text-lg text-indigo-600 font-semibold'>{test.title}</p>
        <p className='mb-6 text-slate-700 mt-1'>
          This test currently has {questions.length} question(s).
        </p>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-1 space-y-8'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
              <h2 className='text-xl font-semibold mb-6 text-slate-900'>
                Add New Question
              </h2>
              {/* Pass test.isPremium to QuestionUploader */}
              <QuestionUploader
                testId={testId}
                onUploadSuccess={loadData}
                testIsPremium={test.isPremium}
              />
            </div>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
              <h2 className='text-xl font-semibold mb-6 text-slate-900'>
                Bulk Upload Questions
              </h2>
              <p className='text-sm text-slate-700 mb-4'>
                Upload multiple questions at once using a CSV file.
              </p>
              {/* Pass test.isPremium to BulkQuestionUploader */}
              <BulkQuestionUploader
                testId={testId}
                onUploadSuccess={loadData}
                testIsPremium={test.isPremium}
              />
            </div>
          </div>
          <div className='lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
            <h2 className='text-xl font-semibold mb-6 text-slate-900'>
              Your Added Questions
            </h2>
            <QuestionList
              questions={questions}
              testId={testId}
              onDataChange={loadData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
