import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { notFound } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import AdvancedAnalysis from "@/components/results/AdvancedAnalysis";

async function getResultData(resultId) {
  const resultRef = doc(db, "mockTestResults", resultId);
  const resultSnap = await getDoc(resultRef);
  if (!resultSnap.exists()) return null;

  const resultData = resultSnap.data();

  // Fetch all questions for this test to show a detailed review
  const q = query(
    collection(db, "mockTestQuestions"),
    where("testId", "==", resultData.testId)
  );
  const questionsSnapshot = await getDocs(q);
  const questions = {};
  questionsSnapshot.forEach((doc) => {
    questions[doc.id] = doc.data();
  });

  return { ...resultData, questions };
}

export default async function ResultPage({ params }) {
  const { resultId } = await params; // Await params to resolve the promise
  const result = await getResultData(resultId);

  if (!result) notFound();

  const { score, totalQuestions, answers, questions } = result;
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className='bg-slate-100 min-h-screen py-12 md:py-20'>
      <div className='container mx-auto p-4'>
        <div className='max-w-4xl mx-auto bg-white p-6 sm:p-8 md:p-12 rounded-2xl shadow-2xl border border-slate-200'>
          <h1 className='text-3xl md:text-4xl font-extrabold text-center text-slate-900'>
            Test Result
          </h1>

          {/* Score Summary */}
          <div className='text-center my-10 p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg'>
            <p className='text-lg opacity-80'>You Scored</p>
            <p className='text-6xl font-extrabold my-2'>
              {score}{" "}
              <span className='opacity-80 text-4xl'>/ {totalQuestions}</span>
            </p>
            <p className='text-2xl font-semibold bg-white/20 px-4 py-1 inline-block rounded-full'>
              {percentage}%
            </p>
            <AdvancedAnalysis resultId={resultId} />
          </div>

          {/* Question by Question Review */}
          <div className='mt-12'>
            <h2 className='text-2xl font-bold mb-6 text-slate-900'>
              Detailed Review
            </h2>
            <div className='space-y-8'>
              {Object.keys(questions).map((questionId, index) => {
                const question = questions[questionId];
                const userAnswer = answers[questionId]; // { answer, timeTaken }
                const isCorrect = userAnswer?.answer === question.correctAnswer;

                return (
                  <div
                    key={questionId}
                    className={`p-6 border-l-4 rounded-r-lg ${
                      isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                    }`}
                  >
                    <h3 className='font-bold text-lg text-slate-900'>
                      Question {index + 1}
                    </h3>
                    <div
                      className='w-full h-auto border-2 border-slate-200 rounded-lg p-4 bg-white my-4'
                      dangerouslySetInnerHTML={{
                        __html: question.questionSvgCode,
                      }}
                    />
                    <p className='mt-4 text-sm text-slate-700'>
                      Your answer:{" "}
                      <span
                        className={`font-bold ${
                          isCorrect ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {userAnswer?.answer || "Not Answered"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className='mt-1 text-sm text-green-800'>
                        Correct answer:{" "}
                        <span className='font-bold'>
                          {question.correctAnswer}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className='text-center mt-12 flex justify-center space-x-4'>
            <BackButton />
            <Link
              href='/mock-tests'
              className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg'
            >
              Take Another Test
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
