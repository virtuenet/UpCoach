"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  MessageSquare,
  Building,
} from "lucide-react";

interface ContactFormProps {
  variant?: "default" | "sidebar" | "full";
  onSuccess?: (data: ContactFormData) => void;
  className?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
}

export default function ContactForm({
  variant = "default",
  onSuccess,
  className = "",
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    message: "",
    source: "contact-form",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrorMessage("Please enter your name");
      setStatus("error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      setStatus("error");
      return false;
    }

    if (!formData.message.trim()) {
      setErrorMessage("Please enter a message");
      setStatus("error");
      return false;
    }

    if (formData.message.length < 10) {
      setErrorMessage("Message must be at least 10 characters");
      setStatus("error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");

        // Track conversion
        const { trackContactForm } = await import("@/services/analytics");
        trackContactForm(variant);

        onSuccess?.(formData);

        // Reset form after delay
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            company: "",
            message: "",
            source: "contact-form",
          });
          setTouched({});
          setStatus("idle");
        }, 3000);
      } else {
        setStatus("error");
        setErrorMessage(
          data.message || "Something went wrong. Please try again.",
        );
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Network error. Please try again later.");
    }
  };

  const getFieldError = (field: keyof ContactFormData): string | null => {
    if (!touched[field]) return null;

    switch (field) {
      case "name":
        return formData.name.trim() ? null : "Name is required";
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(formData.email)
          ? null
          : "Valid email is required";
      case "message":
        if (!formData.message.trim()) return "Message is required";
        if (formData.message.length < 10)
          return "Message must be at least 10 characters";
        return null;
      default:
        return null;
    }
  };

  if (variant === "sidebar") {
    return (
      <div className={`bg-gray-50 rounded-2xl p-6 ${className}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Get in Touch</h3>
        <p className="text-gray-600 mb-6">
          Have questions? We'd love to hear from you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur("name")}
              placeholder="Your name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                getFieldError("name") ? "border-red-500" : "border-gray-200"
              }`}
              disabled={status === "loading" || status === "success"}
            />
            {getFieldError("name") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("name")}
              </p>
            )}
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              placeholder="Email address"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                getFieldError("email") ? "border-red-500" : "border-gray-200"
              }`}
              disabled={status === "loading" || status === "success"}
            />
            {getFieldError("email") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("email")}
              </p>
            )}
          </div>

          <div>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              onBlur={() => handleBlur("message")}
              placeholder="Your message"
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none ${
                getFieldError("message") ? "border-red-500" : "border-gray-200"
              }`}
              disabled={status === "loading" || status === "success"}
            />
            {getFieldError("message") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("message")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === "loading" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            {status === "success" && <CheckCircle className="w-5 h-5" />}
            {status === "idle" && <Send className="w-5 h-5" />}
            {status === "loading" && "Sending..."}
            {status === "success" && "Sent!"}
            {status === "idle" && "Send Message"}
            {status === "error" && "Try Again"}
          </button>

          {status === "error" && errorMessage && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </p>
          )}
        </form>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`max-w-4xl mx-auto ${className}`}
      >
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left side - Information */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Let's Build Something
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                {" "}
                Amazing Together
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Whether you have a question, feedback, or want to explore
              partnership opportunities, we're here to help.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                  <p className="text-gray-600">hello@upcoach.ai</p>
                  <p className="text-sm text-gray-500">
                    We'll respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-secondary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Live Chat
                  </h3>
                  <p className="text-gray-600">
                    Available Mon-Fri, 9am-6pm EST
                  </p>
                  <p className="text-sm text-gray-500">
                    Average response time: 2 minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Enterprise
                  </h3>
                  <p className="text-gray-600">For teams of 50+</p>
                  <p className="text-sm text-gray-500">enterprise@upcoach.ai</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="full-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("name")}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                        getFieldError("name")
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      disabled={status === "loading" || status === "success"}
                    />
                  </div>
                  {getFieldError("name") && (
                    <p className="text-red-500 text-sm mt-1">
                      {getFieldError("name")}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="company"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      disabled={status === "loading" || status === "success"}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                      getFieldError("email")
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                    disabled={status === "loading" || status === "success"}
                  />
                </div>
                {getFieldError("email") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getFieldError("email")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={() => handleBlur("message")}
                    rows={5}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none ${
                      getFieldError("message")
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                    disabled={status === "loading" || status === "success"}
                  />
                </div>
                {getFieldError("message") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getFieldError("message")}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "loading" && (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
                {status === "success" && <CheckCircle className="w-5 h-5" />}
                {status === "idle" && <Send className="w-5 h-5" />}
                {status === "loading" && "Sending Your Message..."}
                {status === "success" && "Message Sent Successfully!"}
                {status === "idle" && "Send Message"}
                {status === "error" && "Try Again"}
              </button>

              {status === "success" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-600 text-center"
                >
                  Thank you! We'll get back to you within 24 hours.
                </motion.p>
              )}

              {status === "error" && errorMessage && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-600 text-center flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errorMessage}
                </motion.p>
              )}
            </form>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={() => handleBlur("name")}
          placeholder="Your name"
          className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
            getFieldError("name") ? "border-red-500" : "border-gray-200"
          }`}
          disabled={status === "loading" || status === "success"}
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={() => handleBlur("email")}
          placeholder="Email address"
          className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
            getFieldError("email") ? "border-red-500" : "border-gray-200"
          }`}
          disabled={status === "loading" || status === "success"}
        />
      </div>

      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        onBlur={() => handleBlur("message")}
        placeholder="Your message"
        rows={4}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none ${
          getFieldError("message") ? "border-red-500" : "border-gray-200"
        }`}
        disabled={status === "loading" || status === "success"}
      />

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
        {status === "success" && <CheckCircle className="w-5 h-5" />}
        Send Message
      </button>

      {(status === "error" || status === "success") && (
        <p
          className={`text-sm text-center ${
            status === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {status === "error" ? errorMessage : "Message sent successfully!"}
        </p>
      )}
    </form>
  );
}
