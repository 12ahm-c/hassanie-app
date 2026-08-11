import type { Metadata } from "next";
import { ToastContainer } from "@/components/shared/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hassaniya Translation Manager",
  description: "Manage and translate Arabic sentences to Hassaniya",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
            <a href="/" className="text-lg font-semibold text-gray-900">
              Hassaniya Translation Manager
            </a>
            <div className="ml-8 flex gap-4">
              <a
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </a>
              <a
                href="/sentences"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sentences
              </a>
              <a
                href="/sentences/add"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Add Sentences
              </a>
              <a
                href="/mono"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Mono
              </a>
              <a
                href="/qa"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Q&A
              </a>
              <a
                href="/export"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Export
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl p-4">{children}</main>
        <ToastContainer />
      </body>
    </html>
  );
}
