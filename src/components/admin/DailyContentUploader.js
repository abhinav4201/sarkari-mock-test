"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Helper function to convert plain text to a basic SVG
const textToSvg = (text, options = {}) => {
  const { width = 800, height = 100, fontSize = 24 } = options;
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const style = `font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: #1e293b;`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="10" y="40" style="${style}">${sanitizedText}</text></svg>`;
};

const InputGroup = ({
  name,
  title,
  textValue,
  fileValue,
  onTextChange,
  onFileChange,
}) => (
  <div className='space-y-4 rounded-lg border border-slate-200 p-4'>
    <h3 className='font-semibold text-slate-900'>{title}</h3>
    <div>
      <label
        htmlFor={`${name}Text`}
        className='block text-sm font-medium text-slate-800 mb-1'
      >
        {title} (as Text)
      </label>
      <textarea
        id={`${name}Text`}
        value={textValue}
        onChange={onTextChange}
        disabled={!!fileValue}
        placeholder={`Type ${title.toLowerCase()} here...`}
        className='w-full p-3 border border-slate-300 rounded-lg disabled:bg-slate-100 text-slate-900'
        rows={2}
      />
    </div>
    <div className='relative flex items-center'>
      <div className='flex-grow border-t border-slate-300'></div>
      <span className='flex-shrink mx-4 text-slate-500 text-sm'>OR</span>
      <div className='flex-grow border-t border-slate-300'></div>
    </div>
    <div>
      <label
        htmlFor={`${name}File`}
        className='block text-sm font-medium text-slate-800 mb-1'
      >
        {title} (as SVG)
      </label>
      <input
        id={`${name}File`}
        type='file'
        accept='image/svg+xml'
        onChange={onFileChange}
        disabled={!!textValue}
        className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:cursor-not-allowed'
      />
    </div>
  </div>
);

export default function DailyContentUploader({ uploadType, onUploadSuccess }) {
  // State for both text and file inputs
  const [wordText, setWordText] = useState("");
  const [wordFile, setWordFile] = useState(null);
  const [meaningText, setMeaningText] = useState("");
  const [meaningFile, setMeaningFile] = useState(null);
  const [contentText, setContentText] = useState("");
  const [contentFile, setContentFile] = useState(null);

  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = (e) => {
    setWordText("");
    setWordFile(null);
    setMeaningText("");
    setMeaningFile(null);
    setContentText("");
    setContentFile(null);
    setCategory("");
    if (e) e.target.reset();
  };

  const processInput = async (text, file) => {
    if (text) return textToSvg(text);
    if (file) return await file.text();
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    const loadingToast = toast.loading("Uploading content...");

    try {
      const collectionName =
        uploadType === "vocabulary" ? "dailyVocabulary" : "dailyGk";
      let dataToWrite;

      if (uploadType === "vocabulary") {
        const wordSvgCode = await processInput(wordText, wordFile);
        const meaningSvgCode = await processInput(meaningText, meaningFile);
        if (!wordSvgCode || !meaningSvgCode) {
          throw new Error(
            "Word and Meaning are both required (as text or SVG)."
          );
        }
        dataToWrite = {
          wordSvgCode,
          meaningSvgCode,
          createdAt: serverTimestamp(),
        };
      } else {
        // GK upload
        const contentSvgCode = await processInput(contentText, contentFile);
        if (!contentSvgCode || !category) {
          throw new Error(
            "Content (as text or SVG) and Category are both required."
          );
        }
        dataToWrite = {
          contentSvgCode,
          category,
          createdAt: serverTimestamp(),
        };
      }

      await addDoc(collection(db, collectionName), dataToWrite);

      toast.success("Content uploaded successfully!", { id: loadingToast });
      resetForm(e);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2 className='text-xl font-semibold mb-6 text-slate-900'>
        New {uploadType === "vocabulary" ? "Vocabulary" : "General Knowledge"}
      </h2>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {uploadType === "vocabulary" ? (
          <>
            <InputGroup
              name='word'
              title='Word'
              textValue={wordText}
              fileValue={wordFile}
              onTextChange={(e) => setWordText(e.target.value)}
              onFileChange={(e) => setWordFile(e.target.files[0])}
            />
            <InputGroup
              name='meaning'
              title='Meaning'
              textValue={meaningText}
              fileValue={meaningFile}
              onTextChange={(e) => setMeaningText(e.target.value)}
              onFileChange={(e) => setMeaningFile(e.target.files[0])}
            />
          </>
        ) : (
          <>
            <InputGroup
              name='content'
              title='Content'
              textValue={contentText}
              fileValue={contentFile}
              onTextChange={(e) => setContentText(e.target.value)}
              onFileChange={(e) => setContentFile(e.target.files[0])}
            />
            <div>
              <label
                htmlFor='category'
                className='block text-sm font-medium text-slate-800 mb-1'
              >
                Category
              </label>
              <input
                id='category'
                type='text'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder='e.g., Country Capitals'
                className='w-full p-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500'
                required
              />
            </div>
          </>
        )}
        <button
          type='submit'
          disabled={isUploading}
          className='w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400'
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
