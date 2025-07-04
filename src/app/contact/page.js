"use client";
import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

// --- Reusable Toast Component ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses =
    "fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white transition-all duration-300";
  const typeClasses = {
    success: "bg-green-600",
    error: "bg-red-600",
    loading: "bg-blue-600",
  };

  const Icon = {
    success: CheckCircle,
    error: AlertTriangle,
    loading: Info,
  }[type];

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <Icon className='w-6 h-6 mr-3' />
      <span>{message}</span>
      <button
        onClick={onClose}
        className='ml-4 p-1 rounded-full hover:bg-white/20'
      >
        <X className='w-5 h-5' />
      </button>
    </div>
  );
};

// --- Enhanced Contact Page ---
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" }); // { type: 'success' | 'error' | 'loading', message: '...' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List of disposable email domains to block
  const disposableEmailDomains = [
    "mailinator.com",
    "temp-mail.org",
    "10minutemail.com",
  ];

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (
      disposableEmailDomains.some((domain) => formData.email.endsWith(domain))
    ) {
      newErrors.email = "Disposable email addresses are not allowed.";
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long.";
    }

    setErrors(newErrors);
    // Return true if there are no errors
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Clear previous errors and status
    setErrors({});

    if (!validateForm()) {
      setStatus({
        type: "error",
        message: "Please fix the errors before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "loading", message: "Sending your message..." });

    // Sanitize data before sending
    const sanitizedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim(),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (res.ok) {
        setStatus({
          type: "success",
          message: "Message sent successfully! We will get back to you soon.",
        });
        setFormData({ name: "", email: "", message: "" }); // Clear form
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send message.");
      }
    } catch (error) {
      setStatus({ type: "error", message: `Error: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
              <form onSubmit={handleSubmit} className='space-y-6' noValidate>
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
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg shadow-sm transition text-slate-900 ${
                        errors.name
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                    {errors.name && (
                      <p className='mt-2 text-sm text-red-600'>{errors.name}</p>
                    )}
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
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg shadow-sm transition text-slate-900 ${
                        errors.email
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                    {errors.email && (
                      <p className='mt-2 text-sm text-red-600'>
                        {errors.email}
                      </p>
                    )}
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
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg shadow-sm transition text-slate-900 ${
                        errors.message
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    ></textarea>
                    {errors.message && (
                      <p className='mt-2 text-sm text-red-600'>
                        {errors.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all'
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {status.message && (
        <Toast
          message={status.message}
          type={status.type}
          onClose={() => setStatus({ type: "", message: "" })}
        />
      )}
    </>
  );
}
