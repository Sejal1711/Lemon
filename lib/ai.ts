import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!
});

export async function summarizeEmail(emailBody: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `Summarize this email in 1-2 concise lines:\n\n${emailBody}\n\nSummary:`
    });

    return text.trim();
  } catch (error) {
    console.error('AI summarization error:', error);
    return emailBody.substring(0, 100) + '...';
  }
}
export async function generateReply(emailData: {
  subject: string;
  body: string;
  sender: string;
}): Promise<string> {
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `You are a professional email assistant. Generate a polite and professional reply to this email.

From: ${emailData.sender}
Subject: ${emailData.subject}

Email Body:
${emailData.body}

Generate a professional reply (just the body text, no subject line or greeting duplicates):`,
    });

    return text.trim();
  } catch (error) {
    console.error('AI reply generation error:', error);
    throw new Error('Failed to generate reply');
  }
}