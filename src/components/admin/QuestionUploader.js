// src/components/admin/QuestionUploader.js

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

/**
 * Converts a string of text into a multi-line, responsive SVG image.
 * Uses a <foreignObject> to embed HTML for automatic word wrapping.
 * @param {string} text The text to convert.
 * @returns {string} The SVG code as a string.
 */
const textToSvg = (text) => {
  // Sanitize text to be safely embedded in HTML
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const svgWidth = 800; // The base width of the SVG canvas
  const svgHeight = 250; // Increased height to allow for several lines of text

  // CSS for the wrapping div inside the SVG
  const style = `
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    font-size: 28px;
    color: #1e293b;
    line-height: 1.4;
    white-space: normal;
    word-wrap: break-word;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  `;

  // The SVG structure with a foreignObject containing a div
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <foreignObject x="15" y="15" width="${svgWidth - 30}" height="${
    svgHeight - 30
  }">
        <div xmlns="http://www.w3.org/1999/xhtml" style="${style
          .replace(/\s\s+/g, " ")
          .trim()}">
          <div>${sanitizedText}</div>
        </div>
      </foreignObject>
    </svg>
  `;
};

export default function QuestionUploader({
  testId,
  onUploadSuccess,
  testIsPremium,
}) {
  // NEW: Accept testIsPremium prop
  const [questionText, setQuestionText] = useState("");
  const [questionSvgFile, setQuestionSvgFile] = useState(null);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
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
    if (file) {
      setQuestionSvgFile(file);
      if (file) {
        setQuestionText("");
      }
    }
  };

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
          explanation: explanation || "",
          isPremium: testIsPremium, // NEW: Inherit premium status from the parent test
          status: "pending_review", // NEW: Set initial status for review
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
      setExplanation("");
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
      <div>
        <label
          htmlFor='explanation'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Explanation (Optional)
        </label>
        <textarea
          id='explanation'
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder='Explain why the correct answer is right...'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          rows={3}
        />
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
