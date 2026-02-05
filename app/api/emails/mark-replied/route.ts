import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { markEmailAsReplied } from "@/lib/gmail";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailId } = await req.json();

    if (!emailId) {
      return NextResponse.json({ error: "Email ID required" }, { status: 400 });
    }

    const userId = (session as any).userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    await markEmailAsReplied(userId, emailId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking email as replied:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark email as replied" },
      { status: 500 }
    );
  }
}