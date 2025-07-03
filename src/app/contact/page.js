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
    <div className='container mx-auto px-4 py-12'>
      <div className='max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg'>
        <h1 className='text-3xl font-bold text-center mb-6'>Contact Us</h1>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Form fields... */}
          <button type='submit'>Send Message</button>
          {status && <p className='mt-4 text-center'>{status}</p>}
        </form>
      </div>
    </div>
  );
}
