"use client";

import ReactMarkdown from "react-markdown";
import { ButtonBase } from "@/components/general/buttonBase";
import { PRIVACY_POLICY_CONTENT } from "@/lib/privPolicyContent";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue hover:text-blue-2 underline text-sm mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-text uppercase tracking-tighter mt-4">
            Privacy Policy
          </h1>
        </div>

        {/* Content */}
        <div className="bg-bg border-2 border-text p-8 md:p-12">
          <div className="privacy-content font-spaceMono text-sm text-text leading-relaxed">
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
                  <strong className="font-bold text-coral">{children}</strong>
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
              {PRIVACY_POLICY_CONTENT}
            </ReactMarkdown>
          </div>

          {/* Contact Button */}
          <div className="flex flex-col gap-3 mt-8">
            <ButtonBase
              variant="neutral"
              className="w-full bg-blue hover:bg-blue-2 hover:font-bold"
              href="mailto:create@twilightfringe.com?subject=Privacy Policy Inquiry"
            >
              CONTACT US
            </ButtonBase>
          </div>
        </div>
      </div>
    </div>
  );
}
