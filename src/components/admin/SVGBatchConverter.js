"use client";
import { useState } from "react";
import ImageTracer from "imagetracerjs";
import { saveSvg, clearAllSvgs } from "@/lib/indexedDb";
import Modal from "../ui/Modal";
import { Sparkles, Download, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

// High-fidelity tracing options for better quality
const tracerOptions = {
  ltres: 0.1,
  qtres: 0.1,
  pathomit: 1,
  rightangleenhance: false,
  colorsampling: 2,
  numberofcolors: 128,
  mincolorratio: 0,
  colorquantcycles: 5,
  strokewidth: 0,
  linefilter: false,
  scale: 1,
  roundcoords: 1,
  viewbox: true,
  desc: false,
  lcpr: 0,
  qcpr: 0,
};

export default function SVGBatchConverter() {
  const [results, setResults] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 100);
    setPendingFiles(files);
    setResults([]);
  };

  const handleBatchConvert = () => {
    setIsConverting(true);
    const toastId = toast.loading(
      `Converting ${pendingFiles.length} images with high-quality settings...`
    );
    const promises = pendingFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            ImageTracer.imageToSVG(
              event.target.result,
              async (svg) => {
                const item = { name: file.name, svg };
                try {
                  await saveSvg(item);
                  resolve(item);
                } catch (error) {
                  reject(error);
                }
              },
              tracerOptions // Using high-fidelity options here
            );
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    Promise.all(promises)
      .then((data) => {
        toast.success(`${data.length} images converted successfully!`, {
          id: toastId,
        });
        setResults(data);
        setPendingFiles([]);
      })
      .catch((error) => {
        toast.error("An error occurred during conversion.", { id: toastId });
        console.error("Error during batch conversion:", error);
      })
      .finally(() => setIsConverting(false));
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      results
        .map((r) => `"${r.name}","${r.svg.replace(/"/g, '""')}"`)
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "svg_batch_output.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV download started!");
  };

  const triggerClearStorage = async () => {
    await clearAllSvgs();
    setResults([]);
    setIsModalOpen(false);
    toast.success("SVG storage has been cleared!");
  };

  return (
    <>
      <div className='p-6 bg-white rounded-2xl shadow-lg border border-slate-200'>
        <h2 className='text-2xl font-bold text-slate-900 mb-4'>
          Batch SVG Converter
        </h2>
        <label className='w-full cursor-pointer px-4 py-10 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-800 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-2'>
          <UploadCloud className='h-10 w-10 text-slate-500' />
          <span className='text-slate-900'>
            {pendingFiles.length > 0
              ? `${pendingFiles.length} files selected`
              : "Click to select up to 100 images"}
          </span>
          <span className='text-xs text-slate-500'>PNG, JPG, GIF, etc.</span>
          <input
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={handleFileSelect}
          />
        </label>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4'>
          <button
            onClick={handleBatchConvert}
            disabled={pendingFiles.length === 0 || isConverting}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg shadow font-semibold hover:bg-blue-700 transition-all active:scale-95 active:bg-blue-800 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100'
          >
            <Sparkles className='h-5 w-5' />
            {isConverting ? "Converting..." : "Convert All"}
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={results.length === 0}
            className='px-4 py-2 bg-green-600 text-white rounded-lg shadow font-semibold hover:bg-green-700 transition-all active:scale-95 active:bg-green-800 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100'
          >
            <Download className='h-5 w-5' />
            Download CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className='px-4 py-2 bg-red-600 text-white rounded-lg shadow font-semibold hover:bg-red-700 transition-all active:scale-95 active:bg-red-800 flex items-center justify-center gap-2'
          >
            <Trash2 className='h-5 w-5' />
            Clear Storage
          </button>
        </div>
        {results.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6'>
            {results.map((res, index) => (
              <div
                key={index}
                className='border border-slate-200 p-3 rounded-lg bg-slate-50'
              >
                <h4 className='text-sm font-semibold mb-2 text-slate-900 truncate'>
                  {res.name}
                </h4>
                <div
                  className='bg-white p-2 border border-slate-200 rounded-md h-32 flex items-center justify-center overflow-hidden'
                  dangerouslySetInnerHTML={{ __html: res.svg }}
                ></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title='Confirm Clear Storage'
      >
        <p className='text-slate-600'>
          Are you sure you want to delete all converted SVGs from storage? This
          action cannot be undone.
        </p>
        <div className='flex justify-end gap-4 mt-6'>
          <button
            onClick={() => setIsModalOpen(false)}
            className='px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition-all active:scale-95'
          >
            Cancel
          </button>
          <button
            onClick={triggerClearStorage}
            className='px-4 py-2 bg-red-600 text-white rounded-lg shadow font-semibold hover:bg-red-700 transition-all active:scale-95'
          >
            Confirm Clear
          </button>
        </div>
      </Modal>
    </>
  );
}
