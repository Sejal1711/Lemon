"use client";

import { useState, useTransition } from "react";
import { draftReply, sendReply } from "../actions/reply-actions";

interface EmailCardProps {
  email: {
    id: string;
    emailId: string;
    sender: string;
    subject: string;
    body: string;
    summary: string | null;
    receivedAt: Date;
    replied: boolean;
  };
}

export function EmailCard({ email }: EmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [isDrafting, startDraftTransition] = useTransition();
  const [isSending, startSendTransition] = useTransition();

  const handleDraftReply = () => {
    startDraftTransition(async () => {
      try {
        const result = await draftReply({
          emailId: email.emailId,
          subject: email.subject,
          body: email.body,
          sender: email.sender,
        });

        if (result.success) {
          setReplyDraft(result.reply);
          setShowReply(true);
        }
      } catch (error: any) {
        alert('Error: ' + error.message);
      }
    });
  };

  const handleSendReply = () => {
    if (!replyDraft.trim()) {
      alert('Reply cannot be empty');
      return;
    }

    startSendTransition(async () => {
      try {
        const result = await sendReply({
          emailId: email.emailId,
          to: email.sender,
          subject: email.subject,
          body: replyDraft,
        });

        if (result.success) {
          alert('✅ Email sent successfully!');
          setShowReply(false);
          setReplyDraft("");
        }
      } catch (error: any) {
        alert('Error: ' + error.message);
      }
    });
  };

  return (
    <div
      className={`rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
        email.replied 
          ? "bg-gradient-to-br from-white to-gray-50 border-gray-200" 
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      }`}
    >
      <div className="p-5">
        {/* Email Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {email.sender.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {email.sender.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500">{email.sender}</p>
              </div>
            </div>
            <p className="font-semibold text-gray-800 mt-2 text-base">
              {email.subject}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-4">
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {new Date(email.receivedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {email.replied && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Replied
              </span>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {email.summary && (
          <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg">
            <p className="text-sm text-gray-800">
              <span className="font-bold text-amber-700">🤖 AI Summary:</span>{" "}
              <span className="text-gray-700">{email.summary}</span>
            </p>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide Details
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show Details
            </>
          )}
        </button>

        {/* Email Body (Expanded) */}
        {isExpanded && (
          <div className="mt-4 p-4 bg-white rounded-lg border-2 border-gray-200 shadow-inner">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {email.body.substring(0, 500)}
              {email.body.length > 500 && (
                <span className="text-gray-500 italic">... (truncated)</span>
              )}
            </p>

            {/* Draft Reply Button */}
            {!email.replied && !showReply && (
              <button
                onClick={handleDraftReply}
                disabled={isDrafting}
                className="mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDrafting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Draft Reply
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Reply Draft Section */}
        {showReply && (
          <div className="mt-5 p-5 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-indigo-300 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h4 className="font-bold text-gray-900 text-lg">Draft Reply</h4>
            </div>
            
            <textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-800 shadow-sm font-medium text-sm leading-relaxed"
              placeholder="Edit your AI-generated reply..."
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSendReply}
                disabled={isSending}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Reply
                  </>
                )}
              </button>

              <button
                onClick={() => setShowReply(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}