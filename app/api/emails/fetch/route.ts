import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { fetchEmails } from "@/lib/gmail";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as any).userId;

    const body = await req.json();
    const { maxResults = 50, unreadOnly = true, sender, keywords } = body;

    const emails = await fetchEmails(userId, {
      maxResults,
      unreadOnly,
      sender,
      keywords,
    });

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
