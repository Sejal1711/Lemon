'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCachedEmails, fetchEmails, markEmailAsReplied } from "@/lib/gmail";

// Get cached emails from database
export async function getEmails(options?: {
  unreadOnly?: boolean;
  sender?: string;
  limit?: number;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  const emails = await getCachedEmails(userId, {
    unreadOnly: options?.unreadOnly ?? false,
    sender: options?.sender,
    limit: options?.limit ?? 50,
  });

  return emails;
}

// Fetch new emails from Gmail (with AI summaries)
export async function fetchNewEmails(options?: {
  maxResults?: number;
  unreadOnly?: boolean;
  sender?: string;
  keywords?: string;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  const emails = await fetchEmails(userId, {
    maxResults: options?.maxResults ?? 50,
    unreadOnly: options?.unreadOnly ?? true,
    sender: options?.sender,
    keywords: options?.keywords,
  });

  return {
    success: true,
    count: emails.length,
    emails,
  };
}

// Mark email as replied
export async function markAsReplied(emailId: string) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  await markEmailAsReplied(userId, emailId);
  
  return { success: true };
}