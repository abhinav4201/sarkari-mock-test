"use client";
import { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Mail,
  Phone,
  MessageSquare,
  Linkedin,
  Twitter,
} from "lucide-react";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses =
    "fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white transition-all duration-300 z-50";
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

// New decorative background component
const ContactBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    <Mail className='absolute top-10 left-5 h-32 w-32 text-blue-500/10 transform -rotate-12' />
    <Phone className='absolute top-1/4 right-5 h-24 w-24 text-green-500/10 transform rotate-12' />
    {/* Simple WhatsApp SVG Icon */}
    <svg
      className='absolute bottom-1/4 left-1/3 h-20 w-20 text-green-500/10'
      viewBox='0 0 24 24'
      fill='currentColor'
    >
      <path d='M16.75 13.96c.25.13.42.2.52.32.1.13.15.28.15.44 0 .2-.07.38-.22.54-.15.15-.33.28-.53.38-.2.1-.42.15-.65.15-.28 0-.55-.06-.8-.18-.25-.12-.5-.28-.75-.48s-.5-.45-.75-.73c-.25-.28-.48-.58-.68-.9-.2-.32-.35-.65-.48-.98-.12-.33-.18-.65-.18-.95 0-.3.07-.6.2-.85.13-.25.32-.45.55-.6.23-.15.48-.22.75-.22.2 0 .38.03.53.1.15.07.28.15.4.28l.1.12c.08.1.13.2.15.3.02.1.03.2.03.3 0 .1-.02.2-.05.3-.03.1-.08.2-.13.28l-.13.15c-.05.05-.1.1-.15.15-.05.05-.08.08-.08.1 0 .03.02.07.05.1.03.03.07.07.1.1.15.15.3.32.5.5.2.18.38.33.58.45.05.03.1.05.13.05h.15c.05 0 .1-.02.13-.05.03-.03.07-.07.1-.1l.1-.12c.1-.12.2-.22.3-.3.1-.08.2-.13.3-.15s.2-.03.3-.03c.12 0 .23.03.33.08.1.05.2.13.28.2l.1.15zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z' />
    </svg>
    <Linkedin className='absolute bottom-10 right-1/3 h-16 w-16 text-blue-700/10 transform rotate-6' />
    <Twitter className='absolute bottom-1/4 left-5 h-20 w-20 text-sky-500/10 transform -rotate-6' />
  </div>
);

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disposableEmailDomains = [
    "mailinator.com",
    "temp-mail.org",
    "10minutemail.com",
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

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

    const phoneRegex = /^\d{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid 10-digit phone number.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      value = numericValue.slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    const sanitizedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
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
        setFormData({ name: "", email: "", phone: "", message: "" });
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
      <div className='relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 py-16 sm:py-24 overflow-hidden'>
        <ContactBackground />
        <div className='relative z-10 container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='max-w-2xl mx-auto'>
            <div className='text-center'>
              <h1 className='text-4xl font-extrabold text-slate-900'>
                Get In Touch
              </h1>
              <p className='mt-3 text-lg text-slate-700'>
                Have a question or feedback? We'd love to hear from you.
              </p>
            </div>
            <div className='mt-12 bg-white/80 backdrop-blur-sm p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200/50'>
              <form onSubmit={handleSubmit} className='space-y-6' noValidate>
                <div>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium text-slate-800'
                  >
                    Full Name
                  </label>
                  <div className='relative mt-1'>
                    <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                      <User className='h-5 w-5 text-slate-400' />
                    </div>
                    <input
                      type='text'
                      name='name'
                      id='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full p-3 pl-10 border rounded-lg shadow-sm transition text-slate-900 ${
                        errors.name
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className='mt-2 text-sm text-red-600'>{errors.name}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-slate-800'
                  >
                    Email Address
                  </label>
                  <div className='relative mt-1'>
                    <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                      <Mail className='h-5 w-5 text-slate-400' />
                    </div>
                    <input
                      type='email'
                      name='email'
                      id='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full p-3 pl-10 border rounded-lg shadow-sm transition text-slate-900 ${
                        errors.email
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className='mt-2 text-sm text-red-600'>{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor='phone'
                    className='block text-sm font-medium text-slate-800'
                  >
                    Phone Number
                  </label>
                  <div className='relative mt-1'>
                    <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                      <Phone className='h-5 w-5 text-slate-400' />
                    </div>
                    <input
                      type='tel'
                      name='phone'
                      id='phone'
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      maxLength='10'
                      className={`w-full p-3 pl-10 border rounded-lg shadow-sm transition text-slate-900 ${
                        errors.phone
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className='mt-2 text-sm text-red-600'>{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor='message'
                    className='block text-sm font-medium text-slate-800'
                  >
                    Message
                  </label>
                  <div className='relative mt-1'>
                    <div className='pointer-events-none absolute top-3 left-0 flex items-center pl-3'>
                      <MessageSquare className='h-5 w-5 text-slate-400' />
                    </div>
                    <textarea
                      name='message'
                      id='message'
                      rows='4'
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className={`w-full p-3 pl-10 border rounded-lg shadow-sm transition text-slate-900 ${
                        errors.message
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    ></textarea>
                  </div>
                  {errors.message && (
                    <p className='mt-2 text-sm text-red-600'>
                      {errors.message}
                    </p>
                  )}
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
