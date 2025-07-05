"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { XCircle } from "lucide-react"; // Icon for the remove button

// Helper to convert text to our standard SVG format
const textToSvg = (text) => {
  if (!text) return "";
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const style = `box-sizing: border-box; font-family: Arial, sans-serif; font-size: 28px; color: #1e293b; line-height: 1.4; white-space: normal; word-wrap: break-word; width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-start;`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="250"><foreignObject x="15" y="15" width="770" height="220"><div xmlns="http://www.w3.org/1999/xhtml" style="${style
    .replace(/\s\s+/g, " ")
    .trim()}"><div>${sanitizedText}</div></div></foreignObject></svg>`;
};

// Helper to extract text from our standard SVG format
const extractTextFromSvg = (svgCode) => {
  if (!svgCode) return null;
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgCode, "image/svg+xml");
    const textElement = svgDoc.querySelector("foreignObject > div > div");
    return textElement ? textElement.textContent : null;
  } catch {
    return null;
  }
};

export default function EditContentForm({
  content,
  contentType,
  onFormSubmit,
}) {
  const [textInputs, setTextInputs] = useState({});
  const [svgSources, setSvgSources] = useState({});
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!content) return;
    const fields =
      contentType === "dailyVocabulary"
        ? { word: content.wordSvgCode, meaning: content.meaningSvgCode }
        : { content: content.contentSvgCode };
    const initialTexts = {};
    const initialSvgs = {};
    for (const [key, svgCode] of Object.entries(fields)) {
      const extractedText = extractTextFromSvg(svgCode);
      if (extractedText) {
        initialTexts[key] = extractedText;
        initialSvgs[key] = "";
      } else {
        initialTexts[key] = "";
        initialSvgs[key] = svgCode;
      }
    }
    setTextInputs(initialTexts);
    setSvgSources(initialSvgs);
    if (contentType === "dailyGk") {
      setCategory(content.category || "");
    }
  }, [content, contentType]);

  const handleTextChange = (name, value) => {
    setTextInputs((prev) => ({ ...prev, [name]: value }));
    if (value) {
      setSvgSources((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (name, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSvgSources((prev) => ({ ...prev, [name]: evt.target.result }));
        setTextInputs((prev) => ({ ...prev, [name]: "" }));
      };
      reader.readAsText(file);
    }
  };

  // FIX 1: Handler for the new "Remove SVG" button
  const handleRemoveSvg = (name) => {
    setSvgSources((prev) => ({ ...prev, [name]: "" }));
  };

  // FIX 2: Updated submit logic to only update changed fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Updating item...");

    try {
      const dataToUpdate = {};
      const fieldsToProcess =
        contentType === "dailyVocabulary" ? ["word", "meaning"] : ["content"];

      fieldsToProcess.forEach((field) => {
        const newSvgCode = textInputs[field]
          ? textToSvg(textInputs[field])
          : svgSources[field] || "";
        const originalSvgCode = content[field + "SvgCode"] || "";

        if (newSvgCode !== originalSvgCode) {
          dataToUpdate[field + "SvgCode"] = newSvgCode;
        }
      });

      if (contentType === "dailyGk" && category !== content.category) {
        dataToUpdate.category = category;
      }

      if (Object.keys(dataToUpdate).length === 0) {
        toast.success("No changes to save.", { id: loadingToast });
        setIsLoading(false);
        return;
      }

      const docRef = doc(db, contentType, content.id);
      await updateDoc(docRef, dataToUpdate);

      toast.success("Item updated successfully!", { id: loadingToast });
      onFormSubmit();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const InputGroup = ({ name, title }) => (
    <div className='space-y-4 rounded-lg border border-slate-200 p-4'>
      <h3 className='font-semibold text-slate-900'>{title}</h3>
      <div>
        <label className='block text-sm font-medium text-slate-800 mb-1'>
          {title} (as Text)
        </label>
        <textarea
          value={textInputs[name] || ""}
          onChange={(e) => handleTextChange(name, e.target.value)}
          disabled={!!svgSources[name]}
          className='w-full p-3 border border-slate-300 rounded-lg disabled:bg-slate-100 text-slate-900'
          rows={3}
        />
      </div>
      <div className='text-center text-sm font-semibold text-slate-500'>OR</div>
      <div>
        <div className='flex justify-between items-center mb-1'>
          <label className='block text-sm font-medium text-slate-800'>
            {title} (as SVG)
          </label>
          {/* The new "Remove SVG" button */}
          {svgSources[name] && (
            <button
              type='button'
              onClick={() => handleRemoveSvg(name)}
              className='flex items-center text-sm font-medium text-red-600 hover:text-red-800'
            >
              <XCircle className='h-4 w-4 mr-1' />
              Remove SVG
            </button>
          )}
        </div>
        <input
          type='file'
          accept='image/svg+xml'
          onChange={(e) => handleFileChange(name, e.target.files[0])}
          disabled={!!textInputs[name]}
          className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>
      {(textInputs[name] || svgSources[name]) && (
        <div>
          <label className='block text-sm font-medium text-slate-900 mb-1'>
            Preview
          </label>
          <SvgDisplayer
            svgCode={
              textInputs[name] ? textToSvg(textInputs[name]) : svgSources[name]
            }
            className='h-auto min-h-[8rem] border rounded-lg bg-slate-50 flex items-center'
          />
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {contentType === "dailyVocabulary" ? (
        <>
          <InputGroup name='word' title='Word' />
          <InputGroup name='meaning' title='Meaning' />
        </>
      ) : (
        <>
          <InputGroup name='content' title='Content' />
          <div>
            <label className='block text-sm font-medium text-slate-900 mb-1'>
              Category
            </label>
            <input
              type='text'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
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
