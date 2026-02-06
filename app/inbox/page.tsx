

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import { EmailList } from "../components/EmailList";
import { getEmails } from "../actions/email-actions";


export default async function InboxPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/");
  }

  // Fetch emails on server
  const emails = await getEmails({ limit: 50 });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-sm text-gray-600">
          {session.user?.email}
        </p>
      </div>
      
      <EmailList initialEmails={emails} />
    </div>
  );
}