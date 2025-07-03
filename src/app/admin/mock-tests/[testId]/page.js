import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { notFound } from "next/navigation";
import QuestionUploader from "@/components/admin/QuestionUploader";

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
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export default async function ManageTestQuestionsPage({ params }) {
  const { testId } = params;
  const test = await getTestDetails(testId);
  const questions = await getTestQuestions(testId);

  if (!test) {
    notFound();
  }

  return (
    <div>
      <h1 className='text-3xl font-bold mb-2 text-slate-900'>
        Manage Questions
      </h1>
      <p className='text-lg text-indigo-600 font-semibold'>{test.title}</p>
      <p className='mb-6 text-slate-600 mt-1'>
        Currently has {questions.length} question(s).
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
        <div className='lg:col-span-1 bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold mb-6 text-slate-900'>
            Add New Question
          </h2>
          <QuestionUploader testId={testId} />
        </div>
        <div className='lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold mb-6 text-slate-900'>
            Added Questions
          </h2>
          <div className='space-y-6'>
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <div
                  key={q.id}
                  className='p-4 border border-slate-200 rounded-lg'
                >
                  <p className='font-bold text-slate-900'>
                    Question {index + 1}
                  </p>
                  <div
                    className='my-2 border rounded-md p-2 bg-slate-50'
                    dangerouslySetInnerHTML={{ __html: q.questionSvgCode }}
                  />
                  <ul className='text-sm space-y-1 mt-2'>
                    {q.options.map((opt, i) => (
                      <li
                        key={i}
                        className={`flex items-center ${
                          opt === q.correctAnswer
                            ? "font-bold text-green-700"
                            : "text-slate-800"
                        }`}
                      >
                        {opt === q.correctAnswer && (
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                            className='w-5 h-5 mr-2 text-green-500'
                          >
                            <path
                              fillRule='evenodd'
                              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.06 0l4.25-5.832z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className='text-center text-slate-600 p-8'>
                No questions added for this test yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
