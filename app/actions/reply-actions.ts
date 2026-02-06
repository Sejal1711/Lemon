'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateReply } from "@/lib/ai";
import { sendEmail, markEmailAsReplied } from "@/lib/gmail";
import { revalidatePath } from "next/cache";

// Generate AI draft reply
export async function draftReply(emailData: {
  emailId: string;
  subject: string;
  body: string;
  sender: string;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  try {
    const replyBody = await generateReply({
      subject: emailData.subject,
      body: emailData.body,
      sender: emailData.sender,
    });

    return {
      success: true,
      reply: replyBody,
    };
  } catch (error: any) {
    console.error('Error drafting reply:', error);
    throw new Error(error.message || 'Failed to draft reply');
  }
}

// Send email reply
export async function sendReply(emailData: {
  emailId: string;
  to: string;
  subject: string;
  body: string;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  try {
    // Send via Gmail
    await sendEmail(userId, {
      to: emailData.to,
      subject: `Re: ${emailData.subject}`,
      body: emailData.body,
      inReplyTo: emailData.emailId,
    });

    // Mark as replied in database
    await markEmailAsReplied(userId, emailData.emailId);

    // Refresh the inbox page
    revalidatePath('/inbox');

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error: any) {
    console.error('Error sending reply:', error);
    throw new Error(error.message || 'Failed to send email');
  }
}