"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useUser } from "@privy-io/react-auth";
import { ShieldCheck } from "lucide-react";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";
import { updateUserMetadata } from "@/actions/privy";

function readMetaPhone(user: ReturnType<typeof usePrivy>["user"]): string {
  const meta = (user as unknown as { customMetadata?: Record<string, unknown> } | null)
    ?.customMetadata;
  const p = meta?.phone;
  return typeof p === "string" ? p : "";
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, getAccessToken } = usePrivy();
  const { refreshUser } = useUser();
  const [email, setEmail] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const e = user?.email?.address;
    if (e) setEmail(e);
    const meta = (user as unknown as { customMetadata?: Record<string, unknown> })
      ?.customMetadata;
    const dn = meta?.displayName ?? meta?.name;
    if (typeof dn === "string") setNameInput(dn);
    else setNameInput("");

    const phoneMeta = readMetaPhone(user);
    setPhoneInput(phoneMeta || user?.phone?.number || "");
  }, [user]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(id);
  }, [flash]);

  const handleSaveProfile = async () => {
    if (!ready) return;
    setSaving(true);
    setFlash(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setFlash({ kind: "err", text: "Could not get session. Please sign in again." });
        return;
      }
      const trimmedName = nameInput.trim() || "User";
      const trimmedPhone = phoneInput.trim();
      const res = await updateUserMetadata(token, {
        displayName: trimmedName,
        phone: trimmedPhone,
      });
      if (!res.success) {
        setFlash({ kind: "err", text: res.error ?? "Could not save profile." });
        return;
      }
      await getAccessToken(); // Forces Privy to refetch user + customMetadata so useKYC updates everywhere.
      await refreshUser();
      setFlash({ kind: "ok", text: "Profile updated!" });
    } catch (e) {
      console.error(e);
      setFlash({ kind: "err", text: "Could not save profile." });
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

        {flash ? (
          <div
            role="status"
            className={
              flash.kind === "ok"
                ? "mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
                : "mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900"
            }
          >
            {flash.text}
          </div>
        ) : null}

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
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={!ready}
              placeholder="Your phone number"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Display name
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={!ready}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
            />
          </label>
        </div>

        <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-center text-xs text-zinc-500">
          To change email, please contact support.
        </p>

        <button
          type="button"
          onClick={() => void handleSaveProfile()}
          disabled={!ready || saving}
          className="mt-6 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
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
