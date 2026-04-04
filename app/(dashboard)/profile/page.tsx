"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ShieldCheck } from "lucide-react";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready } = usePrivy();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const e = user?.email?.address;
    if (e) setEmail(e);
    const meta = (user as unknown as { customMetadata?: { name?: string } })
      ?.customMetadata;
    if (typeof meta?.name === "string") setDisplayName(meta.name);
  }, [user]);

  const phone = user?.phone?.number ?? "";

  const onSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Update your personal information.
        </p>

        <div className="mt-6 flex flex-col items-center">
          <ProfileAvatarUpload />
        </div>

        <div className="mt-6 space-y-3">
          <label className="block text-xs font-medium text-zinc-500">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!ready}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Phone
            <input
              type="tel"
              value={phone}
              readOnly
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!ready}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
            />
          </label>
        </div>

        <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-center text-xs text-zinc-500">
          To change email and username, contact support.
        </p>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!ready || saving}
          className="mt-6 w-full rounded-full bg-zinc-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/kyc")}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-800 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-slate-800" />
          Verify Identity
        </button>
      </div>
    </div>
  );
}
