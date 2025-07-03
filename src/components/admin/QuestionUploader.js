"use client";

import { useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function QuestionUploader({ testId }) {
  const [questionSvg, setQuestionSvg] = useState(null);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionSvg || options.includes("") || !correctAnswer) {
      setStatus("Error: Please fill all fields and select a file.");
      return;
    }
    setStatus("Uploading...");

    try {
      // 1. Upload SVG to Firebase Storage
      const storageRef = ref(
        storage,
        `mockTestQuestions/${testId}/${Date.now()}_${questionSvg.name}`
      );
      const snapshot = await uploadBytes(storageRef, questionSvg);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Send data to our API route
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          questionSvgUrl: downloadURL,
          options,
          correctAnswer,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add question");
      }

      setStatus("Question added successfully!");
      // Reset form
      setQuestionSvg(null);
      e.target.reset(); // Resets file input and other form elements
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      router.refresh(); // Refresh the page to show the new question in the list
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block font-bold'>Question SVG</label>
        <input
          type='file'
          accept='image/svg+xml'
          onChange={(e) => setQuestionSvg(e.target.files[0])}
          className='w-full p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
          required
        />
      </div>
      <div>
        <label className='block font-bold'>Options</label>
        {options.map((opt, index) => (
          <input
            key={index}
            type='text'
            value={opt}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className='w-full p-2 border rounded mb-2'
            required
          />
        ))}
      </div>
      <div>
        <label className='block font-bold'>Correct Answer</label>
        <select
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          className='w-full p-2 border rounded'
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
        className='w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
        disabled={status.includes("Uploading")}
      >
        Add Question
      </button>
      {status && <p className='mt-2 text-center'>{status}</p>}
    </form>
  );
}
