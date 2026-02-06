import { google } from "googleapis";
import { prisma } from "./prisma";
import { summarizeEmail } from "./ai";

export async function getGmailClient(userId: string) {
  // Get user's OAuth account
  const oauthAccount = await prisma.oAuthAccount.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!oauthAccount) {
    throw new Error("No Google OAuth account found for user");
  }

  // Check if token is expired
  const now = new Date();
  if (oauthAccount.expiresAt <= now && oauthAccount.refreshToken) {
    // Refresh the token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google"
    );

    oauth2Client.setCredentials({
      refresh_token: oauthAccount.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update the token in DB
    await prisma.oAuthAccount.update({
      where: { id: oauthAccount.id },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: new Date(credentials.expiry_date!),
      },
    });

    oauth2Client.setCredentials({
      access_token: credentials.access_token,
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  // Use existing token
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  );

  oauth2Client.setCredentials({
    access_token: oauthAccount.accessToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

interface FetchEmailsOptions {
  maxResults?: number;
  unreadOnly?: boolean;
  sender?: string;
  keywords?: string;
}

interface EmailDetail {
  emailId: string;
  sender: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
}

export async function fetchEmails(
  userId: string,
  options: FetchEmailsOptions = {}
): Promise<EmailDetail[]> {
  const {
    maxResults = 50,
    unreadOnly = true,
    sender,
    keywords,
  } = options;

  const gmail = await getGmailClient(userId);

  // Build query
  let query = unreadOnly ? "is:unread" : "";
  if (sender) query += ` from:${sender}`;
  if (keywords) query += ` ${keywords}`;

  // Fetch message list
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: query.trim() || undefined,
  });

  const messages = response.data.messages || [];

  // Fetch full details for each message
  const emailDetails = await Promise.all(
    messages.map(async (message: any) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full",
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
          ?.value || "";

      const sender = getHeader("from");
      const subject = getHeader("subject");
      const dateStr = getHeader("date");

      // Extract body
      let body = "";
      let snippet = detail.data.snippet || "";

      const getBody = (payload: any): string => {
        if (payload.body?.data) {
          return Buffer.from(payload.body.data, "base64").toString("utf-8");
        }
        if (payload.parts) {
          for (const part of payload.parts) {
            if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
              if (part.body?.data) {
                return Buffer.from(part.body.data, "base64").toString("utf-8");
              }
            }
            const nestedBody = getBody(part);
            if (nestedBody) return nestedBody;
          }
        }
        return "";
      };

      body = getBody(detail.data.payload);

      return {
        emailId: message.id!,
        sender,
        subject,
        snippet,
        body,
        receivedAt: dateStr ? new Date(dateStr) : new Date(),
      };
    })
  );

  // Cache emails in database WITH AI SUMMARY
  await Promise.all(
    emailDetails.map(async (email: EmailDetail) => {
      // Generate AI summary
      const summary = await summarizeEmail(email.body);

      return prisma.emailCache.upsert({
        where: {
          userId_emailId: {
            userId,
            emailId: email.emailId,
          },
        },
        update: {
          sender: email.sender,
          subject: email.subject,
          snippet: email.snippet,
          body: email.body,
          summary: summary, // Add AI summary here
          receivedAt: email.receivedAt,
        },
        create: {
          userId,
          emailId: email.emailId,
          sender: email.sender,
          subject: email.subject,
          snippet: email.snippet,
          body: email.body,
          summary: summary, // Add AI summary here
          receivedAt: email.receivedAt,
        },
      });
    })
  );

  return emailDetails;
}

export async function getCachedEmails(
  userId: string,
  options: {
    unreadOnly?: boolean;
    sender?: string;
    limit?: number;
  } = {}
) {
  const { unreadOnly = false, sender, limit = 50 } = options;

  const where: any = { userId };
  
  if (unreadOnly) {
    where.replied = false;
  }
  
  if (sender) {
    where.sender = { contains: sender };
  }

  return prisma.emailCache.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: limit,
  });
}

export async function markEmailAsReplied(userId: string, emailId: string) {
  return prisma.emailCache.update({
    where: {
      userId_emailId: {
        userId,
        emailId,
      },
    },
    data: {
      replied: true,
    },
  });
}

export async function sendEmail(
  userId: string,
  emailData: {
    to: string;
    subject: string;
    body: string;
    inReplyTo?: string; // Original email ID for threading
  }
) {
  const gmail = await getGmailClient(userId);

  // Create email in RFC 2822 format
  const message = [
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    emailData.body,
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
      threadId: emailData.inReplyTo, // Optional: keep in same thread
    },
  });

  return result.data;
}