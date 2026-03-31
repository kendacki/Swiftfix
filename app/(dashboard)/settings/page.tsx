 "use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { BadgeCheck, ChevronRight, LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";

type SettingsCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "default" | "danger";
};

function SettingsCard({
  title,
  description,
  icon,
  onClick,
  disabled,
  variant = "default",
}: SettingsCardProps) {
  const danger = variant === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "group flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2",
        danger
          ? "border-red-200 bg-white hover:border-red-300 focus:ring-red-300"
          : "border-zinc-200 bg-white hover:border-zinc-300 focus:ring-zinc-300",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-lg",
            danger ? "bg-red-600 text-white" : "bg-zinc-900 text-white",
          ].join(" ")}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div
            className={[
              "truncate text-sm font-semibold",
              danger ? "text-red-700" : "text-zinc-900",
            ].join(" ")}
          >
            {title}
          </div>
          <div className="truncate text-xs text-zinc-600">{description}</div>
        </div>
      </div>

      <ChevronRight
        className={[
          "h-4 w-4 shrink-0 transition-colors",
          danger ? "text-red-500 group-hover:text-red-600" : "text-zinc-500 group-hover:text-zinc-700",
        ].join(" ")}
      />
    </button>
  );
}

type ActiveSection = "profile" | "security" | "identity" | null;

export default function SettingsPage() {
  const { ready, authenticated, user, logout } = usePrivy();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const displayIdentifier =
    user?.phone?.number ?? user?.email?.address ?? "User";

  const onLogout = async () => {
    await logout();
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manage your account, security, and identity.
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <div className="font-semibold">{authenticated ? displayIdentifier : "Guest"}</div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <SettingsCard
            title="Profile"
            description="Update your personal information."
            icon={<UserRound className="h-5 w-5" />}
            onClick={() => setActiveSection("profile")}
            disabled={!ready}
          />

          <SettingsCard
            title="Security"
            description="Manage your security preferences."
            icon={<ShieldCheck className="h-5 w-5" />}
            onClick={() => setActiveSection("security")}
            disabled={!ready}
          />

          <SettingsCard
            title="Identity Verification"
            description="Verify your identity for compliance."
            icon={<BadgeCheck className="h-5 w-5" />}
            onClick={() => setActiveSection("identity")}
            disabled={!ready}
          />

          <SettingsCard
            title="Log Out"
            description="End your current session."
            icon={<LogOut className="h-5 w-5" />}
            variant="danger"
            onClick={onLogout}
            disabled={!ready}
          />
        </div>

        {activeSection && (
          <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">
            Coming soon:{" "}
            {activeSection === "profile"
              ? "Profile"
              : activeSection === "security"
                ? "Security"
                : "Identity Verification"}
          </div>
        )}
      </div>
    </div>
  );
}

