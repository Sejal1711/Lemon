"use client";

import { useState, useTransition } from "react";

import { EmailCard } from "./EmailCard";
import { fetchNewEmails } from "../actions/email-actions";

export function EmailList({ initialEmails }: { initialEmails: any[] }) {
  const [emails, setEmails] = useState(initialEmails);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await fetchNewEmails({ maxResults: 50, unreadOnly: true });
      if (result.success) {
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
            <EmailCard key={email.id} email={email} />
          ))
        )}
      </div>
    </div>
  );
}