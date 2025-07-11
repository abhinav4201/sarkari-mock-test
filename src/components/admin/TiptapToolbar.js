"use client";

import { useState, useCallback } from "react";
import {
  Link as LinkIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
} from "lucide-react";
import LinkModal from "./LinkModal";

const ToolbarButton = ({ onClick, isActive, title, children }) => (
  <button
    type='button'
    onClick={onClick}
    title={title}
    className={`p-2 rounded font-medium text-sm transition-colors ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-slate-700 hover:bg-slate-200"
    }`}
  >
    {children}
  </button>
);

export default function TiptapToolbar({ editor }) {
  // --- THIS IS THE FIX ---
  // All hooks are now called at the top level, in the same order, on every render.
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const handleSetLink = useCallback(
    (url) => {
      // The editor check is now inside the callback, not at the top level.
      if (!editor) return;

      if (url) {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      } else {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      }
    },
    [editor]
  );

  // The check for the editor now happens AFTER all hooks have been called.
  if (!editor) {
    return null;
  }

  const openLinkModal = () => {
    setIsLinkModalOpen(true);
  };

  return (
    <>
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSetLink={handleSetLink}
        initialUrl={editor.getAttributes("link").href}
      />
      <div className='border-b border-slate-300 p-2 flex items-center flex-wrap gap-1 bg-slate-50'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title='Bold'
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title='Italic'
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={openLinkModal}
          isActive={editor.isActive("link")}
          title='Set Link'
        >
          <LinkIcon size={16} />
        </ToolbarButton>

        <div className='w-px h-6 bg-slate-300 mx-1'></div>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title='Heading 2'
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title='Heading 3'
        >
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title='Bullet List'
        >
          <List size={16} />
        </ToolbarButton>
      </div>
    </>
  );
}
