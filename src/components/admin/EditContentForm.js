"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function EditContentForm({
  content,
  contentType,
  onFormSubmit,
}) {
  const [svgCodes, setSvgCodes] = useState({});
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (content) {
      if (contentType === "dailyVocabulary") {
        setSvgCodes({
          wordSvg: content.wordSvgCode || "",
          meaningSvg: content.meaningSvgCode || "",
        });
      } else {
        setSvgCodes({ contentSvg: content.contentSvgCode || "" });
        setCategory(content.category || "");
      }
    }
  }, [content, contentType]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSvgCodes((prev) => ({ ...prev, [name]: evt.target.result }));
        toast.success("New SVG file loaded.");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Updating item...");

    try {
      const payload = {
        type: contentType,
        category: contentType === "dailyGk" ? category : undefined,
        svgCodes,
      };

      const res = await fetch(`/api/admin/daily-content/${content.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update item.");

      toast.success("Item updated successfully!", { id: loadingToast });
      onFormSubmit();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {contentType === "dailyVocabulary" ? (
        <>
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Upload New Word SVG
            </label>
            <input
              type='file'
              name='wordSvg'
              accept='image/svg+xml'
              onChange={handleFileChange}
              className='w-full text-sm text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Word SVG Code
            </label>
            <textarea
              value={svgCodes.wordSvg || ""}
              onChange={(e) =>
                setSvgCodes((p) => ({ ...p, wordSvg: e.target.value }))
              }
              className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg font-mono text-sm h-24'
              required
            ></textarea>
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Upload New Meaning SVG
            </label>
            <input
              type='file'
              name='meaningSvg'
              accept='image/svg+xml'
              onChange={handleFileChange}
              className='w-full text-sm text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Meaning SVG Code
            </label>
            <textarea
              value={svgCodes.meaningSvg || ""}
              onChange={(e) =>
                setSvgCodes((p) => ({ ...p, meaningSvg: e.target.value }))
              }
              className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg font-mono text-sm h-24'
              required
            ></textarea>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Upload New Content SVG
            </label>
            <input
              type='file'
              name='contentSvg'
              accept='image/svg+xml'
              onChange={handleFileChange}
              className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Content SVG Code
            </label>
            <textarea
              value={svgCodes.contentSvg || ""}
              onChange={(e) =>
                setSvgCodes((p) => ({ ...p, contentSvg: e.target.value }))
              }
              className='w-full p-3 border border-slate-300 rounded-lg font-mono text-sm h-24'
              required
            ></textarea>
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Category
            </label>
            <input
              type='text'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full p-3 border border-slate-300 rounded-lg'
              required
            />
          </div>
        </>
      )}
      <div className='flex justify-end pt-2'>
        <button
          type='submit'
          disabled={isLoading}
          className='px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
