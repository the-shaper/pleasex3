"use client";

import ReactMarkdown from "react-markdown";
import { ButtonBase } from "./buttonBase";

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  title?: string;
  content: string;
  contactEmail?: string;
  contactSubject?: string;
  contactButtonText?: string;
}

export function LegalModal({
  isOpen,
  onClose,
  className = "",
  title = "Legal Document",
  content,
  contactEmail = "create@twilightfringe.com",
  contactSubject = "Legal Inquiry",
  contactButtonText = "CONTACT US",
}: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-text/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-bg border-2 border-text max-w-3xl w-full max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex border-b-1 border-text bg-blue-2 max-h-16 items-center">
          <div className="flex flex-row justify-between items-center w-full">
            <h2 className="flex-1 py-4 px-6 text-lg font-bold uppercase leading-none text-text">
              {title}
            </h2>
            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-1 py-4 px-3 text-lg font-bold uppercase max-w-16 transition-colors border-l-1 border-text bg-gray-subtle text-text hover:bg-text hover:text-bg max-h-16 h-full flex items-center justify-center"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative custom-scrollbar">
          {/* Markdown Content */}
          <div className="legal-content font-spaceMono text-sm text-text leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl md:text-4xl font-bold text-text mb-8 tracking-tighter">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl md:text-3xl font-bold text-text mt-8 mb-4 tracking-tight">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl md:text-2xl font-bold text-text mt-6 mb-3">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg md:text-xl font-bold text-text mt-4 mb-2">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-base md:text-lg font-bold text-text mt-3 mb-2">
                    {children}
                  </h5>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-text">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue hover:text-blue-2 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="mb-2">{children}</li>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-gray-subtle">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-subtle">{children}</thead>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => (
                  <tr className="border-b border-gray-subtle">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2 text-left font-bold text-text border-r border-gray-subtle">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 text-text border-r border-gray-subtle">
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Contact Button */}
          <div className="flex flex-col gap-3 mt-8">
            <ButtonBase
              variant="neutral"
              className="w-full bg-blue hover:bg-blue-2 hover:font-bold"
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(contactSubject)}`}
            >
              {contactButtonText}
            </ButtonBase>
          </div>
        </div>
      </div>
    </div>
  );
}
