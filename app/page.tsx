"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  ChevronDown,
  Gem,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

type FaqItem = {
  q: string;
  a: string;
};

function Glow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Hero glow */}
      <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-[90px]" />
      <div className="absolute left-1/2 top-[120px] h-[380px] w-[780px] -translate-x-1/2 rounded-full bg-white/7 blur-[90px]" />

      {/* Section glows */}
      <div className="absolute left-[-180px] top-[780px] h-[420px] w-[420px] rounded-full bg-white/7 blur-[110px]" />
      <div className="absolute right-[-200px] top-[1120px] h-[520px] w-[520px] rounded-full bg-white/8 blur-[120px]" />
      <div className="absolute left-1/2 top-[2140px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-white/7 blur-[120px]" />
    </div>
  );
}

function PillRow() {
  const items = [
    "Swap USDT ↔ NGN",
    "Pay artisans",
    "Withdraw to bank",
    "Fast settlement",
    "Transparent rates",
    "Always compliant",
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {items.map((t) => (
        <div
          key={t}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#A1A1A1] backdrop-blur"
        >
          {t}
        </div>
      ))}
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur transition hover:bg-white/[0.05]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-white">
            {title}
          </div>
          <div className="mt-1 text-sm leading-6 text-[#A1A1A1]">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

type BentoCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
};

function BentoCard({ title, description, icon, className }: BentoCardProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(900px_400px_at_20%_0%,rgba(255,255,255,0.09),transparent_55%)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-white">
            {title}
          </div>
          <div className="mt-1 text-sm leading-6 text-[#A1A1A1]">
            {description}
          </div>
        </div>
      </div>

      {/* subtle bottom shine */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-40px] h-24 bg-white/10 blur-[60px]"
      />
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {kicker ? (
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
          {kicker}
        </div>
      ) : null}
      <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-balance text-sm leading-6 text-[#A1A1A1] sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function Page() {
  const { login } = usePrivy();

  const faqs: FaqItem[] = useMemo(
    () => [
      {
        q: "How does SwiftFix keep swaps secure?",
        a: "Swaps and payouts are executed with strict validation and atomic updates to prevent partial state. If any step fails, your funds remain safe.",
      },
      {
        q: "What payment methods do you support?",
        a: "You can swap USDT to NGN, pay vetted artisans, and withdraw to your local bank. More rails will be added over time.",
      },
      {
        q: "Are there hidden fees?",
        a: "No. SwiftFix is built for clarity—rates and fees are transparent before you confirm any action.",
      },
      {
        q: "Do I need KYC?",
        a: "For certain limits and withdrawals, identity checks may be required. We keep the process lightweight and compliant.",
      },
    ],
    []
  );

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen bg-[#101010] text-white">
      <Glow />

      {/* Top nav */}
      <header className="relative z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="SwiftFix"
              width={120}
              height={24}
              priority
              className="h-6 w-auto"
            />
          </div>

          <nav className="hidden items-center gap-8 text-sm text-[#A1A1A1] md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#trust" className="hover:text-white">
              Trust
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => login()}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,255,255,0.06)] transition hover:bg-white/90"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pb-14 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Control Your Capital.
              <span className="block">The Smart Way.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-sm leading-6 text-[#A1A1A1] sm:text-base">
              Seamlessly swap USDT to NGN, pay trusted artisans, and withdraw to
              your local bank.
            </p>

            <div className="mt-7 flex items-center justify-center">
              <button
                type="button"
                onClick={() => login()}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(255,255,255,0.08)] transition hover:bg-white/90"
              >
                Get Started
              </button>
            </div>

            <PillRow />

            {/* trust row (icons) */}
            <div
              id="trust"
              className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-[#A1A1A1]"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-white/80" />
                Compliance-led
              </div>
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-white/80" />
                Secure by design
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/80" />
                Fast & simple
              </div>
              <div className="flex items-center gap-2">
                <Gem className="h-4 w-4 text-white/80" />
                Premium experience
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="relative z-10">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="lg:pt-6">
              <div className="text-sm font-semibold text-white/90">
                The strategic choice.
              </div>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#A1A1A1]">
                Built for people moving real value—swaps, payments, and
                withdrawals in one clean flow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureCard
                title="Swap & Pay"
                description="Instantly move between USDT and NGN, then pay in one step."
                icon={<ArrowLeftRight className="h-5 w-5" />}
              />
              <FeatureCard
                title="Trusted Artisans"
                description="Send funds only to vetted providers with clear receipts."
                icon={<Users className="h-5 w-5" />}
              />
              <FeatureCard
                title="Zero Hidden Fees"
                description="Transparent pricing before you confirm any transaction."
                icon={<BadgeCheck className="h-5 w-5" />}
              />
              <FeatureCard
                title="Airtight Compliance"
                description="Designed to meet regulatory expectations without friction."
                icon={<ShieldCheck className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Secondary features / bento */}
      <section className="relative z-10">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-2 sm:px-6 sm:pb-24">
          <SectionHeading
            title="Future banking you need"
            subtitle="A premium toolkit for swaps, payments, and withdrawals—built for speed and confidence."
          />

          <div className="mt-10 grid gap-3 lg:grid-cols-12">
            <BentoCard
              className="lg:col-span-5"
              title="Unified Wallet"
              description="Track balances and activity across flows with a clean, focused dashboard."
              icon={<Wallet className="h-5 w-5" />}
            />
            <BentoCard
              className="lg:col-span-7"
              title="Bank Withdrawals"
              description="Withdraw to your local bank with verification-first rails and clear confirmations."
              icon={<Banknote className="h-5 w-5" />}
            />
            <BentoCard
              className="lg:col-span-7"
              title="Structured Transactions"
              description="Every move is recorded with consistent metadata—easy to audit and reconcile."
              icon={<BadgeCheck className="h-5 w-5" />}
            />
            <BentoCard
              className="lg:col-span-5"
              title="Security Controls"
              description="Modern auth, secure sessions, and safeguards designed for financial UX."
              icon={<LockKeyhole className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <SectionHeading title="FAQ" subtitle="Quick answers to common questions." />

          <div className="mt-10 space-y-3">
            {faqs.map((item, idx) => {
              const open = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(open ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <div className="text-sm font-semibold tracking-tight text-white">
                      {item.q}
                    </div>
                    <ChevronDown
                      className={[
                        "h-4 w-4 shrink-0 text-[#A1A1A1] transition-transform",
                        open ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  </button>
                  {open ? (
                    <div className="px-5 pb-5 text-sm leading-6 text-[#A1A1A1]">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Showcase collaborations */}
      <section className="relative z-10">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1A1]">
                Showcase Collaborations
              </div>
              <div className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Trusted by teams building the future.
              </div>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#A1A1A1]">
                We partner with technology providers and communities to deliver
                safe, seamless financial flows.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {["Partner", "Partner", "Partner", "Partner", "Partner", "Partner"].map(
                (p, i) => (
                  <div
                    key={`${p}-${i}`}
                    className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-4 text-xs font-semibold tracking-wide text-white/80"
                  >
                    {p}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6">
          <div className="grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Image
                src="/logo.png"
                alt="SwiftFix"
                width={120}
                height={24}
                className="h-6 w-auto"
              />
              <p className="mt-4 text-sm leading-6 text-[#A1A1A1]">
                Control your capital with modern swaps, payments, and compliant
                withdrawals.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Product</div>
              <div className="mt-4 space-y-2 text-sm text-[#A1A1A1]">
                <a href="#features" className="block hover:text-white">
                  Features
                </a>
                <a href="#trust" className="block hover:text-white">
                  Trust
                </a>
                <a href="#faq" className="block hover:text-white">
                  FAQ
                </a>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Company</div>
              <div className="mt-4 space-y-2 text-sm text-[#A1A1A1]">
                <Link href="/dashboard" className="block hover:text-white">
                  Dashboard
                </Link>
                <Link href="/settings" className="block hover:text-white">
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => login()}
                  className="block text-left hover:text-white"
                >
                  Sign In
                </button>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Get started</div>
              <p className="mt-4 text-sm leading-6 text-[#A1A1A1]">
                Log in to start swapping USDT to NGN and withdrawing to your
                bank.
              </p>
              <button
                type="button"
                onClick={() => login()}
                className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#A1A1A1] sm:flex-row">
            <div>© {new Date().getFullYear()} SwiftFix. All rights reserved.</div>
            <div className="flex items-center gap-5">
              <a className="hover:text-white" href="#">
                Privacy
              </a>
              <a className="hover:text-white" href="#">
                Terms
              </a>
              <a className="hover:text-white" href="#">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
