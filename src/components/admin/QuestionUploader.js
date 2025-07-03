"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuestionUploader({ testId }) {
  const [questionSvgCode, setQuestionSvgCode] = useState(""); // We store the SVG *code* here
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // This function reads the selected file and stores its text content
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        // The result of the read operation
        setQuestionSvgCode(evt.target.result);
      };
      // Read the file as a text string
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
      // The payload is already correct because we're sending the SVG code string
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          questionSvgCode,
          options,
          correctAnswer,
        }),
      });

      if (!res.ok) throw new Error("Failed to add question");

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
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block font-bold'>Question SVG</label>
        {/* We use input type="file" for a better UX */}
        <input
          type='file'
          accept='image/svg+xml'
          onChange={handleFileChange} // The magic happens here
          className='w-full p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
          required
        />
        {/* Optional: Show a preview or confirmation that the file is loaded */}
        {questionSvgCode && (
          <p className='text-xs text-green-600 mt-1'>
            SVG file loaded successfully.
          </p>
        )}
      </div>

      {/* The rest of the form is unchanged */}
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
      >
        Add Question
      </button>
      {status && <p className='mt-2 text-center'>{status}</p>}
    </form>
  );
}
