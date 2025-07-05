"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

// Helper function to convert plain text to a basic SVG image
const textToSvg = (text) => {
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const style = `font-family: Arial, sans-serif; font-size: 24px; fill: #1e293b;`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100"><text x="10" y="40" style="${style}">${sanitizedText}</text></svg>`;
};

export default function QuestionUploader({ testId, onUploadSuccess }) {
  const [questionText, setQuestionText] = useState("");
  const [questionSvgFile, setQuestionSvgFile] = useState(null);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTextChange = (e) => {
    setQuestionText(e.target.value);
    if (e.target.value && questionSvgFile) {
      setQuestionSvgFile(null);
      const fileInput = document.getElementById("question-svg-upload");
      if (fileInput) fileInput.value = "";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setQuestionSvgFile(file);
    if (file) {
      setQuestionText("");
    }
  };

  // THIS IS THE FIX: The missing function has been added back.
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      (!questionText && !questionSvgFile) ||
      options.some((opt) => opt === "") ||
      !correctAnswer
    ) {
      return toast.error(
        "Please provide a Text Question OR an SVG file, and fill all options."
      );
    }
    setIsLoading(true);
    const loadingToast = toast.loading("Adding question...");

    try {
      let finalSvgCode = "";
      if (questionText) {
        finalSvgCode = textToSvg(questionText);
      } else if (questionSvgFile) {
        finalSvgCode = await questionSvgFile.text();
      }

      await runTransaction(db, async (transaction) => {
        const testRef = doc(db, "mockTests", testId);
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists()) throw new Error("Parent test does not exist!");

        const newQuestionRef = doc(collection(db, "mockTestQuestions"));
        transaction.set(newQuestionRef, {
          testId,
          questionSvgCode: finalSvgCode,
          options,
          correctAnswer,
          createdAt: serverTimestamp(),
        });

        const newCount = (testDoc.data().questionCount || 0) + 1;
        transaction.update(testRef, { questionCount: newCount });
      });

      toast.success("Question added successfully!", { id: loadingToast });
      e.target.reset();
      setQuestionText("");
      setQuestionSvgFile(null);
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label
          htmlFor='question-text'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Question (as Text)
        </label>
        <textarea
          id='question-text'
          value={questionText}
          onChange={handleTextChange}
          disabled={!!questionSvgFile}
          placeholder='Type your question here...'
          className='w-full p-3 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-900'
        />
      </div>

      <div className='relative flex items-center'>
        <div className='flex-grow border-t border-slate-300'></div>
        <span className='flex-shrink mx-4 text-slate-500 font-semibold'>
          OR
        </span>
        <div className='flex-grow border-t border-slate-300'></div>
      </div>

      <div>
        <label
          htmlFor='question-svg-upload'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Question (as SVG File)
        </label>
        <input
          id='question-svg-upload'
          type='file'
          accept='image/svg+xml'
          onChange={handleFileChange}
          disabled={!!questionText}
          className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Options
        </label>
        {options.map((opt, index) => (
          <input
            key={index}
            type='text'
            value={opt}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className='w-full p-3 border border-slate-300 rounded-lg mb-2 text-slate-900'
            required
          />
        ))}
      </div>
      <div>
        <label
          htmlFor='correct-answer'
          className='block text-sm font-medium text-slate-900 mb-1'
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
        disabled={isLoading}
        className='w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400'
      >
        {isLoading ? "Adding..." : "Add Question"}
      </button>
    </form>
  );
}
