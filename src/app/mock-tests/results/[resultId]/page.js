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
  const result = await getResultData(params.resultId);

  if (!result) notFound();

  const { score, totalQuestions, answers, questions } = result;
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className='container mx-auto p-4 md:p-8'>
      <div className='bg-white p-6 rounded-lg shadow-lg'>
        <h1 className='text-3xl font-bold text-center'>Test Result</h1>

        {/* Score Summary */}
        <div className='text-center my-8'>
          <p className='text-lg'>You Scored</p>
          <p className='text-6xl font-extrabold text-blue-600 my-2'>
            {score} / {totalQuestions}
          </p>
          <p className='text-2xl font-semibold'>{percentage}%</p>
        </div>

        {/* Question by Question Review */}
        <div className='mt-12'>
          <h2 className='text-2xl font-bold mb-6'>Detailed Review</h2>
          <div className='space-y-8'>
            {Object.keys(questions).map((questionId, index) => {
              const question = questions[questionId];
              const userAnswer = answers[questionId];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div
                  key={questionId}
                  className={`p-4 border rounded-lg ${
                    isCorrect
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  }`}
                >
                  <h3 className='font-semibold'>Question {index + 1}</h3>
                  <img
                    src={question.questionSvgUrl}
                    alt=''
                    className='w-full h-auto border rounded my-2 bg-white'
                  />
                  <p className='mt-4'>
                    Your answer:{" "}
                    <span className='font-bold'>
                      {userAnswer || "Not Answered"}
                    </span>
                  </p>
                  {!isCorrect && (
                    <p className='text-green-700'>
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

        <div className='text-center mt-12'>
          <Link
            href='/mock-tests'
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Take Another Test
          </Link>
        </div>
      </div>
    </div>
  );
}
