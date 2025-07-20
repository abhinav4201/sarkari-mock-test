// components/admin/AddQuestionBankForm.js
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Reusing the textToSvg function from your existing components
const textToSvg = (text) => {
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svgWidth = 800;
  const svgHeight = 250;
  const style = `box-sizing: border-box; font-family: Arial, sans-serif; font-size: 28px; color: #1e293b; line-height: 1.4; white-space: normal; word-wrap: break-word; width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-start;`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}"><foreignObject x="15" y="15" width="${
    svgWidth - 30
  }" height="${
    svgHeight - 30
  }"><div xmlns="http://www.w3.org/1999/xhtml" style="${style
    .replace(/\s\s+/g, " ")
    .trim()}"><div>${sanitizedText}</div></div></foreignObject></svg>`;
};

export default function AddQuestionBankForm({ onUploadSuccess }) {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [isPremium, setIsPremium] = useState(false); // NEW: State for premium status
  const [isLoading, setIsLoading] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !questionText ||
      options.some((opt) => opt === "") ||
      !correctAnswer ||
      !topic ||
      !subject
    ) {
      return toast.error(
        "Please fill all fields, including topic and subject."
      );
    }
    setIsLoading(true);
    const loadingToast = toast.loading("Adding question to bank...");

    try {
      const finalSvgCode = textToSvg(questionText);
      await addDoc(collection(db, "questionBank"), {
        questionSvgCode: finalSvgCode,
        options,
        correctAnswer,
        explanation: explanation || "",
        topic,
        subject,
        isPremium: isPremium, // NEW: Add isPremium to the document
        createdAt: serverTimestamp(),
      });

      toast.success("Question added successfully!", { id: loadingToast });
      // Reset form
      e.target.reset();
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setExplanation("");
      setTopic("");
      setSubject("");
      setIsPremium(false); // NEW: Reset premium status
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
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Question Text
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder='Type your question here...'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Topic
        </label>
        <input
          type='text'
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='e.g., Indian History'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Subject
        </label>
        <input
          type='text'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='e.g., General Studies'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
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
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Correct Answer
        </label>
        <select
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
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Explanation (Optional)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder='Explain why the correct answer is right...'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          rows={3}
        />
      </div>

      {/* NEW: Checkbox for premium status */}
      <div className='pt-2'>
        <div className='flex items-center'>
          <input
            type='checkbox'
            id='isPremiumQuestion'
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
            className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
          />
          <label
            htmlFor='isPremiumQuestion'
            className='ml-2 block text-sm font-medium text-slate-900'
          >
            Mark this as a Premium Question?
          </label>
        </div>
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
