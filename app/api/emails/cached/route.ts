import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { getCachedEmails } from "@/lib/gmail";
import { authOptions } from "../../auth/[...nextauth]/route";


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // If user not logged in
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const sender = searchParams.get("sender")?.trim() || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Fetch cached emails
    const emails = await getCachedEmails(userId, { unreadOnly, sender, limit });

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error: any) {
    console.error("Error fetching cached emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cached emails" },
      { status: 500 }
    );
  }
}
