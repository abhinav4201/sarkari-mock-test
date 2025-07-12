"use client";
import { useState } from "react";
import ImageTracer from "imagetracerjs";
import { saveSvg } from "@/lib/indexedDb";
import { UploadCloud, Copy, Download } from "lucide-react";
import toast from "react-hot-toast";
import SvgDisplayer from "../ui/SvgDisplayer"; // Ensure path is correct

// High-fidelity tracing options for better quality
const tracerOptions = {
  ltres: 0.1, // Lower values mean higher accuracy
  qtres: 0.1, // Lower values mean higher accuracy
  pathomit: 1,
  rightangleenhance: false,
  // Color quantization options
  colorsampling: 2,
  numberofcolors: 128, // Increased colors for more detail
  mincolorratio: 0,
  colorquantcycles: 5, // More cycles for better color grouping
  // SVG rendering options
  strokewidth: 0, // Set to 0 to avoid adding strokes to filled areas
  linefilter: false,
  scale: 1,
  roundcoords: 1,
  viewbox: true,
  desc: false,
  lcpr: 0,
  qcpr: 0,
};

export default function SVGSingleConverter() {
  const [svgCode, setSvgCode] = useState("");
  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setPreview("");
      setSvgCode("");
    }
  };

  const handleConvert = () => {
    if (selectedFile) {
      const toastId = toast.loading("Converting with high-quality settings...");
      const reader = new FileReader();
      reader.onload = function (e) {
        // Pass the high-fidelity options to the tracer
        ImageTracer.imageToSVG(
          e.target.result,
          function (svgString) {
            toast.success("High-quality conversion complete!", { id: toastId });
            setSvgCode(svgString);
            setPreview(svgString);
            saveSvg({ name: selectedFile.name, svg: svgString });
          },
          tracerOptions
        );
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCopy = () => {
    if (!svgCode) return;
    navigator.clipboard.writeText(svgCode);
    toast.success("SVG code copied to clipboard!");
  };

  const handleDownload = () => {
    if (!svgCode) return;
    const blob = new Blob([svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.replace(/\.[^/.]+$/, "") + ".svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  return (
    <div className='p-6 bg-white rounded-2xl shadow-lg border border-slate-200'>
      <div className='flex items-center space-x-4'>
        <label className='cursor-pointer px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2'>
          <UploadCloud className='h-5 w-5' />
          <span>Choose Image</span>
          <input
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleImageUpload}
          />
        </label>
        {fileName && (
          <span className='text-sm text-slate-600 truncate' title={fileName}>
            {fileName}
          </span>
        )}
      </div>
      <button
        onClick={handleConvert}
        disabled={!selectedFile}
        className='mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md font-semibold hover:bg-blue-700 transition-all active:scale-95 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100'
      >
        Convert to SVG
      </button>
      {preview && (
        <div className='mt-6'>
          <h3 className='text-lg font-bold text-slate-900 mb-2'>Preview</h3>
          <SvgDisplayer
            svgCode={preview}
            className='w-full h-auto min-h-[200px] max-h-[50vh] p-2 rounded-lg border border-slate-300 bg-slate-50'
          />
          <div className='mt-4 flex flex-col sm:flex-row gap-4'>
            <button
              onClick={handleCopy}
              className='flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg shadow font-semibold hover:bg-slate-700 transition-all active:scale-95 active:bg-slate-800 flex items-center justify-center gap-2'
            >
              <Copy className='h-5 w-5' />
              Copy SVG Code
            </button>
            <button
              onClick={handleDownload}
              className='flex-1 px-4 py-2 bg-green-600 text-white rounded-lg shadow font-semibold hover:bg-green-700 transition-all active:scale-95 active:bg-green-800 flex items-center justify-center gap-2'
            >
              <Download className='h-5 w-5' />
              Download SVG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
