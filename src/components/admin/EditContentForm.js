"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal"; // We'll reuse the Modal component
import { Expand } from "lucide-react"; // And the Expand icon

export default function EditContentForm({
  content,
  contentType,
  onFormSubmit,
}) {
  const [svgCodes, setSvgCodes] = useState({});
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for the fullscreen preview modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewingSvg, setPreviewingSvg] = useState("");

  // Pre-fill the form when the 'content' prop is available
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

  // Read a newly uploaded file and update the state
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

  // Open the fullscreen preview modal with the correct SVG code
  const openPreview = (svgCode) => {
    setPreviewingSvg(svgCode);
    setIsPreviewModalOpen(true);
  };

  // Handle form submission
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

  // A reusable component for the SVG input/preview block
  const SvgInputBlock = ({ label, name, code }) => (
    <div className='space-y-4 p-4 border rounded-lg'>
      <div>
        <label
          htmlFor={`edit-${name}`}
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          {label}
        </label>
        <input
          id={`edit-${name}`}
          type='file'
          name={name}
          accept='image/svg+xml'
          onChange={handleFileChange}
          className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>
      {code && (
        <div>
          <div className='flex justify-between items-center mb-1'>
            <label className='text-sm font-medium text-slate-900'>
              Preview
            </label>
            <button
              type='button'
              onClick={() => openPreview(code)}
              className='flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800'
            >
              <Expand className='h-4 w-4 mr-1' /> View Fullscreen
            </button>
          </div>
          <div className='border border-slate-300 rounded-lg p-2 h-32 overflow-auto bg-slate-50'>
            <div dangerouslySetInnerHTML={{ __html: code }} />
          </div>
        </div>
      )}
      <div>
        <label
          htmlFor={`code-${name}`}
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          SVG Code
        </label>
        <textarea
          id={`code-${name}`}
          value={code || ""}
          onChange={(e) =>
            setSvgCodes((p) => ({ ...p, [name]: e.target.value }))
          }
          className='w-full p-3 border border-slate-300 rounded-lg font-mono text-sm h-24 text-slate-900'
          required
        ></textarea>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title='SVG Fullscreen Preview'
      >
        <div className='p-4 bg-slate-100 rounded-lg'>
          <div
            className='w-full h-full'
            dangerouslySetInnerHTML={{ __html: previewingSvg }}
          />
        </div>
      </Modal>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {contentType === "dailyVocabulary" ? (
          <>
            <SvgInputBlock
              label='Word SVG'
              name='wordSvg'
              code={svgCodes.wordSvg}
            />
            <SvgInputBlock
              label='Meaning SVG'
              name='meaningSvg'
              code={svgCodes.meaningSvg}
            />
          </>
        ) : (
          <>
            <SvgInputBlock
              label='Content SVG'
              name='contentSvg'
              code={svgCodes.contentSvg}
            />
            <div>
              <label
                htmlFor='edit-category'
                className='block text-sm font-medium text-slate-900 mb-1'
              >
                Category
              </label>
              <input
                id='edit-category'
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
    </>
  );
}
