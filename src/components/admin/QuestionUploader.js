"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export default function QuestionUploader({ testId }) {
  const [questionSvgCode, setQuestionSvgCode] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setQuestionSvgCode(evt.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionSvgCode || options.includes("") || !correctAnswer) {
      setStatus("Error: Please select an SVG file and fill all fields.");
      return;
    }
    setStatus("Submitting...");

    try {
      // Run the transaction directly from the client
      await runTransaction(db, async (transaction) => {
        const testRef = doc(db, "mockTests", testId);
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists()) throw new Error("Parent test does not exist!");

        // Write 1: Create new question
        const newQuestionRef = doc(collection(db, "mockTestQuestions"));
        transaction.set(newQuestionRef, {
          testId,
          questionSvgCode,
          options,
          correctAnswer,
          createdAt: serverTimestamp(),
        });

        // Write 2: Update the question count
        const newCount = (testDoc.data().questionCount || 0) + 1;
        transaction.update(testRef, { questionCount: newCount });
      });

      setStatus("Question added successfully!");
      e.target.reset();
      setQuestionSvgCode("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      router.refresh();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label
          htmlFor='question-svg'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Question SVG
        </label>
        <input
          id='question-svg'
          type='file'
          accept='image/svg+xml'
          onChange={handleFileChange}
          className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
          required
        />
        {questionSvgCode && (
          <p className='text-xs text-green-600 mt-1'>
            SVG file loaded successfully.
          </p>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-800 mb-1'>
          Options
        </label>
        {options.map((opt, index) => (
          <input
            key={index}
            type='text'
            value={opt}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className='w-full p-3 border border-slate-300 rounded-lg mb-2 text-slate-900 placeholder:text-slate-500'
            required
          />
        ))}
      </div>
      <div>
        <label
          htmlFor='correct-answer'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Correct Answer
        </label>
        <select
          id='correct-answer'
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        >
          <option value='' disabled>
            Select the correct option
          </option>
          {options.map(
            (opt, index) =>
              opt && (
                <option key={index} value={opt}>
                  {opt}
                </option>
              )
          )}
        </select>
      </div>
      <button
        type='submit'
        className='w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700'
      >
        Add Question
      </button>

      {/* THIS IS THE FIX: The text color is now conditional */}
      {status && (
        <p
          className={`mt-2 text-center text-sm font-medium ${
            status.startsWith("Error:") ? "text-red-600" : "text-green-600"
          }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}
