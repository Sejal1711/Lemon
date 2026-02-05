"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function TestPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/emails/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxResults: 10,
          unreadOnly: true,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    }
    setLoading(false);
  };

  const getCached = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/emails/cached?unreadOnly=true&limit=20");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    }
    setLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Please sign in first</h1>
          <a href="/" className="text-blue-400 underline mt-4 inline-block">
            Go to home page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Email Fetch Test</h1>
        <p className="text-gray-400 mb-8">Signed in as: {session.user?.email}</p>
        
        <div className="space-x-4 mb-8">
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-600 disabled:cursor-not-allowed transition"
          >
            {loading ? "Loading..." : "Fetch Unread Emails"}
          </button>
          
          <button
            onClick={getCached}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-600 disabled:cursor-not-allowed transition"
          >
            {loading ? "Loading..." : "Get Cached Emails"}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-400">Result:</h2>
            
            {result.error ? (
              <div className="bg-red-900/50 border border-red-500 rounded p-4 text-red-200">
                <p className="font-bold">Error:</p>
                <p>{result.error}</p>
              </div>
            ) : (
              <>
                {result.success && (
                  <div className="mb-4 text-green-400">
                    ✓ Success! Found {result.count} email(s)
                  </div>
                )}
                
                <pre className="bg-gray-950 text-gray-300 p-4 rounded overflow-auto max-h-96 text-sm border border-gray-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-gray-400 text-center">
            Click a button above to fetch emails
          </div>
        )}
      </div>
    </div>
  );
}