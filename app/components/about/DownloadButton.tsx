'use client';

import React from 'react';

interface DownloadButtonProps {
  text: string;
}

export default function DownloadButton({ text }: DownloadButtonProps) {
  return (
    <button
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      onClick={() => {
        window.print();
      }}
    >
      <span>📄</span>
      {text}
    </button>
  );
}
