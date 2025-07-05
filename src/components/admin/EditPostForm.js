"use client";

import { db } from "@/lib/firebase";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Reusable Tiptap Toolbar
const TiptapToolbar = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className='border border-slate-300 rounded-t-lg p-2 flex items-center flex-wrap gap-2 bg-slate-50'>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("bold")
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        Bold
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("italic")
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        Italic
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("heading", { level: 2 })
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        H2
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("bulletList")
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        List
      </button>
    </div>
  );
};

export default function EditPostForm({ post, onFormSubmit }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [featuredImageSvgCode, setFeaturedImageSvgCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your content here..." }),
    ],
    content: "", // Start empty, will be populated by useEffect
    editorProps: {
      attributes: {
        class:
          "prose max-w-none w-full p-4 border-x border-b border-slate-300 rounded-b-lg min-h-[200px] focus:outline-none text-slate-900",
      },
    },
  });

  // Pre-fill the form and editor when the 'post' prop is available
  useEffect(() => {
    if (post && editor) {
      setTitle(post.title || "");
      setSlug(post.slug || "");
      setYoutubeUrl(post.youtubeUrl || "");
      setFeaturedImageSvgCode(post.featuredImageSvgCode || "");
      editor.commands.setContent(post.content || "");
    }
  }, [post, editor]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setFeaturedImageSvgCode(evt.target.result);
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const htmlContent = editor.getHTML();
    setIsLoading(true);
    const loadingToast = toast.loading("Updating post...");

    try {
      // Create a reference to the specific post document
      const postRef = doc(db, "posts", post.id);

      // Update the document directly from the client
      await updateDoc(postRef, {
        title,
        content: htmlContent,
        slug,
        youtubeUrl: youtubeUrl || "",
        featuredImageSvgCode: featuredImageSvgCode || "",
      });

      toast.success("Post updated successfully!", { id: loadingToast });
      onFormSubmit(); // Close modal and refresh list
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label className='block text-sm font-medium text-slate-800 mb-1'>
          Post Title
        </label>
        <input
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-800 mb-1'>
          Featured Image SVG
        </label>
        <input
          type='file'
          accept='image/svg+xml'
          onChange={handleFileChange}
          className='w-full text-sm text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Content
        </label>
        <div className='border border-slate-300 text-slate-900 rounded-lg overflow-hidden'>
          <TiptapToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>
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
