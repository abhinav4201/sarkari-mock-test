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
      <h1 className='text-3xl font-bold mb-2'>
        Manage Questions for:{" "}
        <span className='text-blue-600'>{test.title}</span>
      </h1>
      <p className='mb-6 text-gray-600'>
        Currently has {questions.length} question(s).
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-1'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Add New Question</h2>
            <QuestionUploader testId={testId} />
          </div>
        </div>
        <div className='lg:col-span-2'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Existing Questions</h2>
            <div className='space-y-4'>
              {questions.length > 0 ? (
                questions.map((q, index) => (
                  <div key={q.id} className='p-4 border rounded'>
                    <p className='font-bold'>Q{index + 1}:</p>
                    <img
                      src={q.questionSvgUrl}
                      alt={`Question ${index + 1}`}
                      className='w-full h-auto border my-2'
                    />
                    <ul className='list-disc pl-5 mt-2'>
                      {q.options.map((opt, i) => (
                        <li
                          key={i}
                          className={
                            opt === q.correctAnswer
                              ? "font-bold text-green-600"
                              : ""
                          }
                        >
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p>No questions added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
