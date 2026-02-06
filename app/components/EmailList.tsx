"use client";

import { useState, useTransition } from "react";
import { fetchNewEmails } from "../actions/email-actions";


export function EmailList({ initialEmails }: { initialEmails: any[] }) {
  const [emails, setEmails] = useState(initialEmails);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await fetchNewEmails({ maxResults: 50, unreadOnly: true });
      if (result.success) {
        // Refresh the page to get updated data
        window.location.reload();
      }
    });
  };

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
        >
          {isPending ? "Fetching..." : "🔄 Fetch New Emails"}
        </button>
      </div>

      <div className="space-y-3">
        {emails.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No emails yet</p>
        ) : (
          emails.map((email: any) => (
            <div
              key={email.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                email.replied ? "bg-white" : "bg-blue-50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{email.sender}</p>
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
                    <span className="font-medium">📝 Summary:</span>{" "}
                    {email.summary}
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