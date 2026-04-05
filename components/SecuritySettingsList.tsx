"use client";

import { useCallback, useState } from "react";
import { Key, Layers, Trash2, X } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { toggleWithdrawal2FA } from "@/actions/privy";
import type { LinkedAccountWithMetadata } from "@privy-io/react-auth";

function truncateAddress(addr: string, head = 6, tail = 4) {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function accountLabel(account: LinkedAccountWithMetadata): { kind: string; id: string } {
  switch (account.type) {
    case "email":
      return { kind: "Email", id: account.address };
    case "phone":
      return { kind: "Phone", id: account.number };
    case "wallet":
    case "smart_wallet":
      return { kind: "Wallet", id: truncateAddress(account.address) };
    case "google_oauth":
      return { kind: "Google", id: account.email };
    default:
      return { kind: account.type.replace(/_/g, " "), id: "Linked account" };
  }
}

export function SecuritySettingsList() {
  const {
    user,
    authenticated,
    getAccessToken,
    refreshUser,
    unlinkEmail,
    unlinkWallet,
    unlinkPhone,
    unlinkGoogle,
    unlinkTwitter,
    unlinkDiscord,
    unlinkGithub,
  } = usePrivy();

  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [unlinkingIdx, setUnlinkingIdx] = useState<number | null>(null);

  const meta = user?.customMetadata as Record<string, unknown> | undefined;
  const is2FAEnabled = meta?.withdrawal2FAEnabled === true;

  const linked = user?.linkedAccounts ?? [];
  const connectionCount = linked.length;

  const handleToggle2FA = async (checked: boolean) => {
    if (!user || !authenticated) return;
    setIsUpdating(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Could not get session. Please sign in again.");
        return;
      }
      const res = await toggleWithdrawal2FA(token, checked);
      if (res.success) {
        await getAccessToken();
        await refreshUser();
        toast.success("Security settings updated");
      } else {
        toast.error(res.error ?? "Failed to update settings");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const onDeleteAccount = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "This will permanently delete your account. This action cannot be undone. Continue?",
      )
    ) {
      console.warn("Delete account requested");
      toast.message("Account deletion is not wired yet.");
    }
  };

  const canUnlink = linked.length > 1;

  const unlinkAccount = useCallback(
    async (account: LinkedAccountWithMetadata, idx: number) => {
      if (!canUnlink) return;
      setUnlinkingIdx(idx);
      try {
        switch (account.type) {
          case "email":
            await unlinkEmail(account.address);
            break;
          case "phone":
            await unlinkPhone(account.number);
            break;
          case "wallet":
          case "smart_wallet":
            await unlinkWallet(account.address);
            break;
          case "google_oauth":
            await unlinkGoogle(account.subject);
            break;
          case "twitter_oauth":
            await unlinkTwitter(account.subject);
            break;
          case "discord_oauth":
            await unlinkDiscord(account.subject);
            break;
          case "github_oauth":
            await unlinkGithub(account.subject);
            break;
          default:
            toast.error("Unlink is not supported for this account type yet.");
            return;
        }
        await refreshUser();
        toast.success("Connection removed");
      } catch (e) {
        console.error(e);
        toast.error("Could not unlink this connection");
      } finally {
        setUnlinkingIdx(null);
      }
    },
    [
      canUnlink,
      unlinkEmail,
      unlinkPhone,
      unlinkWallet,
      unlinkGoogle,
      unlinkTwitter,
      unlinkDiscord,
      unlinkGithub,
      refreshUser,
    ],
  );

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
          aria-checked={is2FAEnabled}
          disabled={isUpdating || !authenticated}
          onClick={() => void handleToggle2FA(!is2FAEnabled)}
          className={[
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            is2FAEnabled ? "bg-emerald-600" : "bg-zinc-300",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              is2FAEnabled ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setConnectionsOpen(true)}
        className="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3.5 text-left transition hover:bg-gray-200/90 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <Layers className="h-5 w-5 text-slate-800" aria-hidden />
          </div>
          <span className="font-semibold text-slate-900">Active Connections</span>
        </div>
        <span className="shrink-0 text-base font-bold text-slate-900">
          {connectionCount}
        </span>
      </button>

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

      {connectionsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connections-title"
          onClick={() => setConnectionsOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 id="connections-title" className="text-lg font-semibold text-zinc-900">
                Active Connections
              </h2>
              <button
                type="button"
                onClick={() => setConnectionsOpen(false)}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {linked.length === 0 ? (
                <p className="text-sm text-zinc-600">No linked accounts.</p>
              ) : (
                <ul className="space-y-3">
                  {linked.map((account, idx) => {
                    const { kind, id } = accountLabel(account);
                    const key = `${account.type}-${idx}-${id}`;
                    const busy = unlinkingIdx === idx;
                    return (
                      <li
                        key={key}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            {kind}
                          </div>
                          <div className="truncate text-sm font-medium text-zinc-900">
                            {id}
                          </div>
                        </div>
                        {canUnlink ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void unlinkAccount(account, idx)}
                            className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {busy ? "…" : "Unlink"}
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-500">Only connection</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
