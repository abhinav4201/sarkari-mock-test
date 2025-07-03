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
import BulkQuestionUploader from "@/components/admin/BulkQuestionUploader";
import QuestionList from "@/components/admin/QuestionList";

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
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // If createdAt exists, convert it to milliseconds. Otherwise, use null.
      createdAt: data.createdAt ? data.createdAt.toMillis() : null,
    };
  });
}

export default async function ManageTestQuestionsPage({ params }) {
  const { testId } = await params; // Await params to resolve the promise
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
            <p className='text-sm text-slate-600 mb-4'>
              Upload multiple questions at once using a CSV file. Paste the full
              SVG code for each question into the 'questionSvgCode' column.
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
