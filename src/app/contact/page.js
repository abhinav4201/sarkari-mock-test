"use client";
import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setStatus("Message sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        throw new Error("Failed to send message.");
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className='bg-gradient-to-b from-indigo-50 via-white to-white py-16 sm:py-24'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='text-center'>
            <h1 className='text-4xl font-extrabold text-slate-900'>
              Get In Touch
            </h1>
            <p className='mt-3 text-lg text-slate-700'>
              Have a question or feedback? We'd love to hear from you.
            </p>
          </div>
          <div className='mt-12 bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-100'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-slate-800'
                >
                  Full Name
                </label>
                <div className='mt-1'>
                  <input
                    type='text'
                    name='name'
                    id='name'
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-900'
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-slate-800'
                >
                  Email Address
                </label>
                <div className='mt-1'>
                  <input
                    type='email'
                    name='email'
                    id='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-900'
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor='message'
                  className='block text-sm font-medium text-slate-800'
                >
                  Message
                </label>
                <div className='mt-1'>
                  <textarea
                    name='message'
                    id='message'
                    rows='4'
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className='w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-900'
                  ></textarea>
                </div>
              </div>
              <div>
                <button
                  type='submit'
                  disabled={status.includes("Sending")}
                  className='w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all'
                >
                  {status.includes("Sending") ? "Sending..." : "Send Message"}
                </button>
              </div>
              {status && !status.includes("Sending") && (
                <p className='mt-4 text-center text-sm font-medium text-slate-800'>
                  {status}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );


}
