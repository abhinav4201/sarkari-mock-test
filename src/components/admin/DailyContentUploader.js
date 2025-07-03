"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // Import toast

export default function DailyContentUploader({ uploadType }) {
  const [svgCodes, setSvgCodes] = useState({});
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false); // Changed from 'status'
  const router = useRouter();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;

    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSvgCodes((prev) => ({ ...prev, [name]: evt.target.result }));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    const loadingToast = toast.loading("Uploading content..."); // Use toast for loading

    const payload = {
      type: uploadType,
      category: uploadType === "gk" ? category : undefined,
      svgCodes: svgCodes,
    };

    try {
      const res = await fetch("/api/admin/daily-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload");
      }

      toast.success("Content uploaded successfully!", { id: loadingToast }); // Use toast for success
      e.target.reset();
      setSvgCodes({});
      setCategory("");
      router.refresh(); // Refresh page to show the new item in the list
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast }); // Use toast for error
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2 className='text-xl font-semibold mb-6 text-slate-900'>
        Upload New{" "}
        {uploadType === "vocabulary" ? "Vocabulary" : "General Knowledge"}
      </h2>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {uploadType === "vocabulary" ? (
          <>
            <div>
              <label
                htmlFor='wordSvg'
                className='block text-sm font-medium text-slate-800 mb-1'
              >
                Word SVG
              </label>
              <input
                id='wordSvg'
                type='file'
                name='wordSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                required
              />
              {svgCodes.wordSvg && (
                <p className='text-xs text-green-600 mt-1'>Word SVG loaded.</p>
              )}
            </div>
            <div>
              <label
                htmlFor='meaningSvg'
                className='block text-sm font-medium text-slate-800 mb-1'
              >
                Meaning SVG
              </label>
              <input
                id='meaningSvg'
                type='file'
                name='meaningSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                required
              />
              {svgCodes.meaningSvg && (
                <p className='text-xs text-green-600 mt-1'>
                  Meaning SVG loaded.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <label
                htmlFor='contentSvg'
                className='block text-sm font-medium text-slate-800 mb-1'
              >
                Content SVG
              </label>
              <input
                id='contentSvg'
                type='file'
                name='contentSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                required
              />
              {svgCodes.contentSvg && (
                <p className='text-xs text-green-600 mt-1'>
                  Content SVG loaded.
                </p>
              )}
            </div>
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
