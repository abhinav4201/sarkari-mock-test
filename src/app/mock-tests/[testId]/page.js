import PreviousResult from "@/components/mock-tests/PreviousResult";
import StartTestButton from "@/components/mock-tests/StartTestButton";
import TestReviews from "@/components/mock-tests/TestReviews";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Book, Clock, FileText, ShieldCheck, Tag, Target } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// New STATIC background component with a BRIGHT theme
const ExamBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    {/* Static decorative elements */}
    <Target className='absolute top-[15%] left-[5%] h-24 w-24 text-red-500/10 transform -rotate-12' />
    <Book className='absolute bottom-[10%] right-[8%] h-32 w-32 text-blue-500/10 transform rotate-12' />
    <svg
      className='absolute top-0 right-0 w-1/3 h-full text-slate-900/5'
      fill='none'
      viewBox='0 0 100 100'
      preserveAspectRatio='none'
    >
      <path d='M0,0 L100,0 L0,100 Z' fill='currentColor' />
    </svg>
    <div className='absolute bottom-0 left-0 h-32 w-32 bg-purple-500/10 rounded-full blur-3xl'></div>
    <div className='absolute top-0 right-1/4 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl'></div>
  </div>
);

async function getTestDetails(testId) {
  const testRef = doc(db, "mockTests", testId);
  const testSnap = await getDoc(testRef);
  if (!testSnap.exists()) {
    return null;
  }

  const data = testSnap.data();
  return {
    id: testSnap.id,
    ...data,
    createdAt: data.createdAt ? data.createdAt.toMillis() : null,
  };
}

export default async function PreTestStartPage({ params }) {
  const { testId } = params;
  const test = await getTestDetails(testId);

  if (!test) {
    notFound();
  }

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 overflow-hidden'>
      <ExamBackground />
      <div className='relative z-10 max-w-2xl w-full bg-white/70 backdrop-blur-md p-8 md:p-12 rounded-2xl shadow-2xl border border-white/50'>
        {test.isPremium && (
          <div className='flex justify-center mb-6'>
            <span className='bg-amber-100 text-amber-800 text-sm font-bold px-4 py-1 rounded-full flex items-center'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='w-5 h-5 mr-2'
              >
                <path
                  fillRule='evenodd'
                  d='M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.27.615-.454L16 14.8V7a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2v1H4a2 2 0 00-2 2v7.8l5.076 3.454c.215.184.43.354.615.454.094.05.183.097.28.14l.018.008.006.003zM10 16.5a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1z'
                  clipRule='evenodd'
                />
              </svg>
              PREMIUM TEST
            </span>
          </div>
        )}
        <div className='text-center'>
          <p className='text-indigo-600 text-3xl font-semibold'>
            {test.examName}
          </p>
          <h1 className='text-3xl md:text-4xl font-extrabold text-slate-900 mt-2'>
            {test.title}
          </h1>
        </div>

        <div className='my-8 border-t border-b border-slate-200 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-slate-700'>
          <div className='flex items-center space-x-3'>
            <FileText className='text-indigo-500 h-5 w-5 flex-shrink-0' />{" "}
            <span>{test.questionCount || 0} Questions</span>
          </div>
          <div className='flex items-center space-x-3'>
            <Clock className='text-indigo-500 h-5 w-5 flex-shrink-0' />{" "}
            <span>{test.estimatedTime} Minutes duration</span>
          </div>
          <div className='flex items-center space-x-3'>
            <Book className='text-indigo-500 h-5 w-5 flex-shrink-0' />{" "}
            <span>
              Subject:{" "}
              <span className='font-medium text-slate-900'>{test.subject}</span>
            </span>
          </div>
          <div className='flex items-center space-x-3'>
            <Tag className='text-indigo-500 h-5 w-5 flex-shrink-0' />{" "}
            <span>
              Topic:{" "}
              <span className='font-medium text-slate-900'>{test.topic}</span>
            </span>
          </div>
        </div>
        <div className='p-4 mb-8 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center gap-4'>
          <ShieldCheck className='h-10 w-10 text-blue-600 flex-shrink-0' />
          <div>
            <h3 className='font-bold text-blue-800'>
              AI-Powered Proctoring Enabled
            </h3>
            <p className='text-sm text-blue-700 mt-1'>
              To ensure a fair testing environment, the test will be submitted
              automatically if you switch tabs or minimize the browser.
            </p>
          </div>
        </div>
        <PreviousResult testId={test.id} />
        <div className='mt-4 text-center'>
          <p className='text-sm text-slate-600'>
            Ensure you have a stable connection. The timer will start
            immediately once you begin.
          </p>
        </div>

        <div className='mt-8 text-center'>
          <Suspense
            fallback={
              <div className='h-16 w-56 bg-gray-200 rounded-lg animate-pulse mx-auto'></div>
            }
          >
            <StartTestButton test={test} />
          </Suspense>
        </div>
        <TestReviews testId={test.id} />
      </div>
    </div>
  );
}
