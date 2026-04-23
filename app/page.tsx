"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import PartnersSection from "@/components/PartnersSection";
import {
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  ChevronDown,
  LockKeyhole,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

type FaqItem = {
  q: string;
  a: string;
};

const easeInOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: easeInOut },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

function Glow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Hero flare */}
      <div className="absolute left-1/2 top-[-260px] h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_60%)] blur-[90px]" />
      <div className="absolute left-1/2 top-[80px] h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_65%)] blur-[110px]" />

      {/* Mid-page atmospherics */}
      <div className="absolute left-[-260px] top-[860px] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_65%)] blur-[120px]" />
      <div className="absolute right-[-280px] top-[1280px] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_68%)] blur-[130px]" />

      {/* Footer flare */}
      <div className="absolute left-1/2 bottom-[-420px] h-[900px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_65%)] blur-[140px]" />
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
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, transition: { duration: 0.25, ease: easeInOut } }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl transition hover:bg-white/[0.03]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_40%)] opacity-70"
      />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-white">
            {title}
          </div>
          <div className="mt-1 text-sm leading-6 text-white/60">
            {description}
          </div>
        </div>
      </div>
    </motion.div>
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
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, transition: { duration: 0.25, ease: easeInOut } }}
      className={[
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_45%)] before:opacity-70",
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
          <div className="mt-1 text-sm leading-6 text-white/60">
            {description}
          </div>
        </div>
      </div>

      {/* subtle bottom shine */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-40px] h-24 bg-white/10 blur-[70px]"
      />
    </motion.div>
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
    <motion.div
      className="mx-auto max-w-2xl text-center"
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-15% 0px -10% 0px" }}
    >
      {kicker ? (
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          {kicker}
        </div>
      ) : null}
      <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-balance text-sm leading-6 text-white/60 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </motion.div>
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
    <div className="relative min-h-screen bg-black text-white">
      <Glow />

      {/* Top nav */}
      <header className="sticky top-0 z-20">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6">
          <motion.div
            className="grid grid-cols-2 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 backdrop-blur-xl sm:px-5 md:grid-cols-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeInOut }}
          >
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="SwiftFix"
                width={120}
                height={24}
                priority
                className="h-6 w-auto opacity-90"
              />
            </div>

            <nav className="hidden items-center justify-center gap-10 text-sm text-white md:flex">
              <a href="#features" className="transition hover:text-white/90">
                Features
              </a>
              <a href="#trust" className="transition hover:text-white/90">
                Trust
              </a>
              <a href="#faq" className="transition hover:text-white/90">
                FAQ
              </a>
            </nav>

            <div className="flex items-center justify-end gap-3">
              <motion.button
                type="button"
                onClick={() => login()}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(255,255,255,0.10)] transition hover:bg-white/90"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: easeInOut }}
              >
                Sign In
              </motion.button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 min-h-[100svh]">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.15),rgba(0,0,0,0.75)_60%,rgba(0,0,0,0.95)_100%)]" />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl items-start justify-end px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8 md:pt-10">
          <motion.div
            className="max-w-xl text-right sm:max-w-2xl"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.h1
              className="text-balance text-right text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
              variants={fadeUp}
            >
              <span className="block text-black">Control Your Capital.</span>
              <span className="mt-1 block text-pink-400 sm:mt-0">The Smart Way.</span>
            </motion.h1>
            <motion.p
              className="mt-5 max-w-xl text-balance text-right text-sm leading-6 text-white sm:text-base sm:leading-7"
              variants={fadeUp}
            >
              Seamlessly swap USDT to NGN, pay trusted artisans, and withdraw to your
              local bank.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="relative z-10 min-h-[100svh] overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/features-bg.png"
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="100vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.10),rgba(0,0,0,0.78)_62%,rgba(0,0,0,0.95)_100%)]" />
          <div className="absolute inset-0 bg-black/35" />
        </div>
        <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl items-center px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-start">
            <motion.div
              className="lg:pt-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-15% 0px -10% 0px" }}
              variants={fadeUp}
            >
              <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                The strategic choice.
              </h2>
              <p className="mt-4 max-w-xl text-balance text-lg font-medium leading-7 text-white/70 sm:text-xl sm:leading-8">
                Built for people that are intentional about Financial Growth
              </p>
            </motion.div>

            <motion.div
              className="grid gap-3 sm:grid-cols-2"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-15% 0px -10% 0px" }}
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Secondary features / bento */}
      <section id="trust" className="relative z-10 min-h-[100svh]">
        <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl items-center px-4 pb-16 pt-2 sm:px-6 sm:pb-24">
          <div className="w-full">
          <SectionHeading
            title="Future banking you need"
            subtitle="Payment now handled wth ease seamlessly"
          />

          <motion.div
            className="mt-10 grid gap-3 lg:grid-cols-12"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          >
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
          </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 min-h-[100svh] overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/faq-bg.png"
            alt=""
            fill
            className="object-cover opacity-85"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.10),rgba(0,0,0,0.78)_62%,rgba(0,0,0,0.95)_100%)]" />
          <div className="absolute inset-0 bg-black/35" />
        </div>
        <div className="mx-auto flex min-h-[100svh] w-full max-w-3xl items-center px-4 py-16 sm:px-6 sm:py-24">
          <div className="w-full">
          <SectionHeading title="FAQ" subtitle="Quick answers to common questions." />

          <motion.div
            className="mt-10 space-y-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          >
            {faqs.map((item, idx) => {
              const open = openFaqIndex === idx;
              return (
                <motion.div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
                  variants={fadeUp}
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
                        "h-4 w-4 shrink-0 text-white/60 transition-transform",
                        open ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  </button>
                  {open ? (
                    <motion.div
                      className="px-5 pb-5 text-sm leading-6 text-white/60"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.35, ease: easeInOut }}
                    >
                      {item.a}
                    </motion.div>
                  ) : null}
                </motion.div>
              );
            })}
          </motion.div>
          </div>
        </div>
      </section>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        variants={fadeUp}
      >
        <PartnersSection />
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10">
        <motion.div
          className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          variants={fadeUp}
        >
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
                <Link
                  href="/dashboard"
                  prefetch={false}
                  className="block hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  prefetch={false}
                  className="block hover:text-white"
                >
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
        </motion.div>
      </footer>
    </div>
  );
}
