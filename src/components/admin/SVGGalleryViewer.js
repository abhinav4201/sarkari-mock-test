"use client";
import { useEffect, useState } from "react";
import { getAllSvgs, clearAllSvgs } from "@/lib/indexedDb";
import Modal from "../ui/Modal";
import { Copy, Trash2, ImageOff, Expand } from "lucide-react";
import toast from "react-hot-toast";

export default function SVGGalleryViewer() {
  const [svgs, setSvgs] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedSvg, setSelectedSvg] = useState(null); // State for fullscreen modal

  // Fetch SVGs on mount and then poll for changes
  useEffect(() => {
    async function fetchSvgs() {
      const data = await getAllSvgs();
      setSvgs(data);
    }
    fetchSvgs(); // Initial fetch
    const interval = setInterval(fetchSvgs, 2000); // Poll for updates
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleCopy = (svgCode) => {
    navigator.clipboard.writeText(svgCode);
    toast.success("SVG copied to clipboard!");
  };

  const triggerClearGallery = async () => {
    await clearAllSvgs();
    setSvgs([]);
    setIsClearModalOpen(false);
    toast.success("SVG gallery has been cleared!");
  };

  return (
    <>
      <div className='p-6 bg-white rounded-2xl shadow-lg border border-slate-200'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6'>
          <h2 className='text-2xl font-bold text-slate-900'>
            Converted SVG Gallery
          </h2>
          {svgs.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className='mt-2 sm:mt-0 px-4 py-2 bg-red-600 text-white rounded-lg shadow font-semibold hover:bg-red-700 transition-all active:scale-95 active:bg-red-800 flex items-center justify-center gap-2'
            >
              <Trash2 className='h-5 w-5' />
              Clear Gallery
            </button>
          )}
        </div>
        {svgs.length === 0 ? (
          <div className='text-center py-16 border-2 border-dashed border-slate-300 rounded-lg'>
            <ImageOff className='mx-auto h-12 w-12 text-slate-400' />
            <h3 className='mt-2 text-lg font-semibold text-slate-900'>
              No SVGs in Gallery
            </h3>
            <p className='mt-1 text-sm text-slate-500'>
              The gallery updates automatically as you convert images.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {svgs.map((item, index) => (
              <div
                key={item.id || index} // Use a stable ID if available
                className='border border-slate-200 rounded-lg bg-slate-50 shadow-sm overflow-hidden flex flex-col'
              >
                <div className='p-3 border-b border-slate-200'>
                  <h4
                    className='text-sm font-semibold text-slate-900 truncate'
                    title={item.name}
                  >
                    {item.name}
                  </h4>
                </div>
                <div
                  className='h-32 bg-white p-2 flex items-center justify-center overflow-hidden flex-grow'
                  dangerouslySetInnerHTML={{ __html: item.svg }}
                />
                <div className='p-2 bg-slate-100 flex items-center justify-between gap-2'>
                  <button
                    onClick={() => handleCopy(item.svg)}
                    className='flex-grow px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-all active:scale-95 active:bg-blue-800 flex items-center justify-center gap-2'
                  >
                    <Copy className='h-4 w-4' />
                    Copy
                  </button>
                  <button
                    onClick={() => setSelectedSvg(item)}
                    title='Fullscreen'
                    className='flex-shrink-0 p-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-all active:scale-95'
                  >
                    <Expand className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen SVG Viewer Modal */}
      <Modal
        isOpen={!!selectedSvg}
        onClose={() => setSelectedSvg(null)}
        title={selectedSvg?.name || ""}
        size='5xl'
      >
        <div className='bg-slate-100 rounded-lg p-4 h-[70vh] w-full flex items-center justify-center'>
          {selectedSvg && (
            <div
              className='w-full h-full'
              dangerouslySetInnerHTML={{ __html: selectedSvg.svg }}
            />
          )}
        </div>
      </Modal>

      {/* Clear Gallery Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title='Confirm Clear Gallery'
      >
        <p className='text-slate-600'>
          Are you sure you want to delete all SVGs from the gallery? This action
          cannot be undone.
        </p>
        <div className='flex justify-end gap-4 mt-6'>
          <button
            onClick={() => setIsClearModalOpen(false)}
            className='px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition-all active:scale-95'
          >
            Cancel
          </button>
          <button
            onClick={triggerClearGallery}
            className='px-4 py-2 bg-red-600 text-white rounded-lg shadow font-semibold hover:bg-red-700 transition-all active:scale-95'
          >
            Confirm Clear
          </button>
        </div>
      </Modal>
    </>
  );
}
