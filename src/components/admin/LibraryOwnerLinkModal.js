// src/components/admin/LibraryOwnerLinkModal.js

"use client";

import Modal from "../ui/Modal";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, MessageSquare } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LibraryOwnerLinkModal({ isOpen, onClose, library }) {
  const [whatsappNumber, setWhatsappNumber] = useState("");

  if (!library) return null;

  // Construct the join URL for owners
  const joinUrl = `${window.location.origin}/join?ownerJoinCode=${library.ownerJoinCode}`;

  const handleDownload = () => {
    const svg = document.getElementById("owner-qr-code-svg");
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
      downloadLink.download = `${library.libraryName}-Owner-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success("Owner join link copied to clipboard!");
  };

  const handleSendOnWhatsApp = () => {
    if (!/^\d{10}$/.test(whatsappNumber)) {
      return toast.error("Please enter a valid 10-digit mobile number.");
    }
    const message = `Welcome to Sarkari Mock Test! Access your library owner dashboard for ${library.libraryName} using this link: ${joinUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Owner Onboarding for ${library.libraryName}`}
    >
      <div className='text-center p-6'>
        <h3 className='text-lg font-semibold text-slate-800'>
          QR Code for Library Owner Sign-Up
        </h3>
        <p className='text-sm text-slate-600 mb-4'>
          The library owner can scan this code to access their analytics
          dashboard.
        </p>
        <div className='bg-white p-4 inline-block border rounded-lg'>
          <QRCodeSVG id='owner-qr-code-svg' value={joinUrl} size={256} />
        </div>
        <p className='mt-4 font-mono bg-slate-100 p-2 rounded-md text-slate-700'>{`Owner Code: ${library.ownerJoinCode}`}</p>

        <div className='mt-4'>
          <label className='text-sm font-medium text-slate-600'>
            Or share the link directly:
          </label>
          <div className='flex items-center gap-2 mt-1'>
            <input
              type='text'
              value={joinUrl}
              readOnly
              className='w-full bg-slate-100 p-2 border border-slate-300 rounded-md text-sm text-slate-700'
            />
            <button
              onClick={handleCopyLink}
              className='p-3 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300'
              title='Copy Link'
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div className='mt-6 pt-6 border-t'>
          <label className='text-sm font-medium text-slate-600'>
            Send link via WhatsApp:
          </label>
          <div className='flex items-center gap-2 mt-1'>
            <div className='relative w-full'>
              <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500'>
                +91
              </span>
              <input
                type='tel'
                value={whatsappNumber}
                onChange={(e) =>
                  setWhatsappNumber(
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder='10-digit mobile number'
                className='w-full bg-white p-2 pl-10 border border-slate-300 rounded-md text-slate-900'
              />
            </div>
            <button
              onClick={handleSendOnWhatsApp}
              className='p-3 bg-green-500 text-white rounded-md hover:bg-green-600'
              title='Send on WhatsApp'
            >
              <MessageSquare size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className='mt-8 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700'
        >
          <Download size={16} /> Download QR Code
        </button>
      </div>
    </Modal>
  );
}
