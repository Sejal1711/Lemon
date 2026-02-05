"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <main className="flex h-screen items-center justify-center">
        <button
          onClick={() => signIn("google")}
          className="px-6 py-3 bg-black text-white rounded-lg"
        >
          Sign in with Google
        </button>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4">
      <p>Signed in as {session.user?.email}</p>
      <button
        onClick={() => signOut()}
        className="px-6 py-2 bg-red-500 text-white rounded-lg"
      >
        Sign out
      </button>
    </main>
  );
}
