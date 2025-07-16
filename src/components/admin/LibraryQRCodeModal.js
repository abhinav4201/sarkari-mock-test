// src/components/admin/LibraryQRCodeModal.js

"use client";

import Modal from "../ui/Modal";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";

export default function LibraryQRCodeModal({ isOpen, onClose, library }) {
  if (!library) return null;

  const joinUrl = `${window.location.origin}/join?libraryId=${library.id}`;

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${library.libraryName}-Join-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Onboarding for ${library.libraryName}`}
    >
      <div className='text-center p-6'>
        <h3 className='text-lg font-semibold text-slate-800'>
          QR Code for Student Sign-Up
        </h3>
        <p className='text-sm text-slate-600 mb-4'>
          Students can scan this code with their phone to join.
        </p>
        <div className='bg-white p-4 inline-block border rounded-lg'>
          <QRCodeSVG id='qr-code-svg' value={joinUrl} size={256} />
        </div>
        <p className='mt-4 font-mono bg-slate-100 p-2 rounded-md text-slate-700'>{`Join Code: ${library.uniqueJoinCode}`}</p>
        <button
          onClick={handleDownload}
          className='mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700'
        >
          <Download size={16} /> Download QR Code
        </button>
      </div>
    </Modal>
  );
}
