'use client';

import React from 'react';

export default function EnvCheck() {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  
  console.log('Environment check:', {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    serverUrl,
    nodeEnv: process.env.NODE_ENV
  });

  return (
    <div className="fixed top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded text-sm z-50">
      <div><strong>Server URL:</strong> {serverUrl}</div>
      <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
      <div><strong>Socket connecting to:</strong> {serverUrl}</div>
    </div>
  );
}
