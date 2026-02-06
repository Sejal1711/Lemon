"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function InboxPage() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch("/api/emails/cached?limit=50");
        const data = await response.json();
        
        if (data.success) {
          setEmails(data.emails || []);
        }
      } catch (error) {
        console.error("Error fetching emails:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchEmails();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <a href="/" className="text-blue-600 underline">Go to home</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-500">Loading emails...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Inbox</h1>
      
      <div className="space-y-3">
        {emails.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No emails yet</p>
        ) : (
          emails.map((email: any) => (
            <div
              key={email.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                email.replied ? 'bg-white' : 'bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {email.sender}
                  </p>
                  <p className="font-medium text-gray-800 mt-1">
                    {email.subject}
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-4">
                  {new Date(email.receivedAt).toLocaleDateString()}
                </span>
              </div>
              
              {/* AI Generated Summary */}
              {email.summary && (
                <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">📝 Summary:</span> {email.summary}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
