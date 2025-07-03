"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DailyContentUploader({ uploadType }) {
  // State to hold the SVG code as strings
  const [svgCodes, setSvgCodes] = useState({});
  const [category, setCategory] = useState(""); // Only for GK
  const [status, setStatus] = useState("");
  const router = useRouter();

  // Generic file handler that uses FileReader
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target; // 'wordSvg', 'meaningSvg', or 'contentSvg'

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
    setStatus("Uploading...");

    // Prepare payload based on upload type
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

      if (!res.ok) throw new Error("Failed to upload content");

      setStatus("Content uploaded successfully!");
      e.target.reset();
      setSvgCodes({});
      setCategory("");
      router.refresh();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-xl font-semibold mb-4'>
        Upload New{" "}
        {uploadType === "vocabulary" ? "Vocabulary" : "General Knowledge"}
      </h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {uploadType === "vocabulary" ? (
          <>
            <div>
              <label className='block font-bold'>Word SVG</label>
              <input
                type='file'
                name='wordSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full'
                required
              />
              {svgCodes.wordSvg && (
                <p className='text-xs text-green-600 mt-1'>Word SVG loaded.</p>
              )}
            </div>
            <div>
              <label className='block font-bold'>Meaning SVG</label>
              <input
                type='file'
                name='meaningSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full'
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
              <label className='block font-bold'>Content SVG</label>
              <input
                type='file'
                name='contentSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full'
                required
              />
              {svgCodes.contentSvg && (
                <p className='text-xs text-green-600 mt-1'>
                  Content SVG loaded.
                </p>
              )}
            </div>
            <div>
              <label className='block font-bold'>Category</label>
              <input
                type='text'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder='e.g., Country Capitals'
                className='w-full p-2 border rounded'
                required
              />
            </div>
          </>
        )}
        <button
          type='submit'
          className='w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
        >
          Upload
        </button>
        {status && <p className='mt-2 text-center'>{status}</p>}
      </form>
    </div>
  );
}
