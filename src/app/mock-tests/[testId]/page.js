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
    <div className='bg-slate-100 min-h-screen flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-4xl'>
        {/* Header */}
        <div className='bg-white p-4 rounded-t-2xl shadow-lg border-b border-slate-200 flex justify-between items-center sticky top-0 z-10'>
          <h1 className='text-lg md:text-xl font-bold text-slate-900 truncate'>
            Mock Test in Progress
          </h1>
          <div className='text-xl md:text-2xl font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full'>{`${minutes}:${
            seconds < 10 ? "0" : ""
          }${seconds}`}</div>
        </div>

        <div className='bg-white p-6 sm:p-8 rounded-b-2xl shadow-lg'>
          {/* Question Area */}
          {currentQuestion ? (
            <div>
              <h2 className='text-lg font-semibold mb-4 text-slate-900'>
                Question {currentQuestionIndex + 1}{" "}
                <span className='text-slate-500'>of {questions.length}</span>
              </h2>
              <div
                className='w-full h-auto border-2 border-slate-200 rounded-lg p-4 bg-slate-50 mb-6'
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.questionSvgCode,
                }}
              />
              <div className='space-y-4'>
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleAnswerSelect(currentQuestion.id, option)
                    }
                    className={`block w-full text-left p-4 border-2 rounded-lg transition-all duration-200 text-base md:text-lg font-medium ${
                      answers[currentQuestion.id] === option
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-slate-900 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className='text-center p-8'>
              <p className='text-slate-700'>Loading questions...</p>
            </div>
          )}

          {/* Navigation */}
          <div className='flex justify-between mt-10 pt-6 border-t border-slate-200'>
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentQuestionIndex === 0}
              className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg disabled:opacity-50 hover:bg-slate-300 transition-colors'
            >
              Previous
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={submitTest}
                disabled={testState === "submitting"}
                className='px-6 py-2 bg-green-600 text-white font-semibold rounded-lg disabled:bg-green-400 hover:bg-green-700 transition-colors'
              >
                {testState === "submitting" ? "Submitting..." : "Submit Test"}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
                className='px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors'
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}
