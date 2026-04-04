"use client";

import { useState } from "react";
import { Key, Layers, Trash2 } from "lucide-react";

export function SecuritySettingsList() {
  const [withdrawal2fa, setWithdrawal2fa] = useState(false);
  const activeDeviceCount = 5;

  const onDeleteAccount = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "This will permanently delete your account. This action cannot be undone. Continue?",
      )
    ) {
      // Wire to backend when available
      console.warn("Delete account requested");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <Key className="h-5 w-5 text-slate-800" aria-hidden />
          </div>
          <span className="font-semibold text-slate-900">Withdrawal 2FA</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={withdrawal2fa}
          onClick={() => setWithdrawal2fa((v) => !v)}
          className={[
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
            withdrawal2fa ? "bg-emerald-600" : "bg-zinc-300",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              withdrawal2fa ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <Layers className="h-5 w-5 text-slate-800" aria-hidden />
          </div>
          <span className="font-semibold text-slate-900">Active Devices</span>
        </div>
        <span className="shrink-0 text-base font-bold text-slate-900">
          {activeDeviceCount}
        </span>
      </div>

      <button
        type="button"
        onClick={onDeleteAccount}
        className="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3.5 text-left transition hover:bg-gray-200/90 focus:outline-none focus:ring-2 focus:ring-red-300"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <Trash2 className="h-5 w-5 text-red-600" aria-hidden />
          </div>
          <span className="font-semibold text-red-600">Delete Account</span>
        </div>
      </button>
    </div>
  );
}
