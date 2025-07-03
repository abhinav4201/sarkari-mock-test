import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, Tag, Book, Shield } from "lucide-react";

async function getTestDetails(testId) {
  const testRef = doc(db, "mockTests", testId);
  const testSnap = await getDoc(testRef);
  return testSnap.exists() ? { id: testSnap.id, ...testSnap.data() } : null;
}

export default async function PreTestStartPage({ params }) {
  const test = await getTestDetails(params.testId);

  if (!test) {
    notFound();
  }

  // Future monetization logic would go here.
  // For now, we just check the flag to change the button's appearance.
  const canStartTest = !test.isPremium; // Simplified logic for now

  return (
    <div className='bg-gray-50 flex items-center justify-center min-h-screen p-4'>
      <div className='max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg'>
        {test.isPremium && (
          <div className='text-center mb-4'>
            <span className='bg-yellow-400 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full'>
              PREMIUM TEST
            </span>
          </div>
        )}
        <h1 className='text-3xl font-bold text-center text-gray-900'>
          {test.title}
        </h1>
        <p className='text-center text-gray-500 mt-1'>{test.examName}</p>

        <div className='my-8 border-t border-b py-6 grid grid-cols-2 gap-4'>
          <div className='flex items-center space-x-3'>
            <FileText className='text-blue-500' />{" "}
            <span>{test.questionCount || 0} Questions</span>
          </div>
          <div className='flex items-center space-x-3'>
            <Clock className='text-blue-500' />{" "}
            <span>{test.estimatedTime} Minutes</span>
          </div>
          <div className='flex items-center space-x-3'>
            <Book className='text-blue-500' />{" "}
            <span>Subject: {test.subject}</span>
          </div>
          <div className='flex items-center space-x-3'>
            <Tag className='text-blue-500' /> <span>Topic: {test.topic}</span>
          </div>
        </div>

        <div className='text-center'>
          {canStartTest ? (
            <Link
              href={`/mock-tests/take/${test.id}`}
              className='w-full inline-block px-8 py-4 bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition-transform transform hover:scale-105'
            >
              Start Test Now
            </Link>
          ) : (
            <button
              disabled
              className='w-full inline-block px-8 py-4 bg-gray-400 text-white rounded-lg text-lg font-bold cursor-not-allowed items-center justify-center'
            >
              <Shield className='mr-2' /> Upgrade to Premium to Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
