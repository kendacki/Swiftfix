"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import PartnersSection from "@/components/PartnersSection";
import {
  ArrowLeftRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  ChevronDown,
  Landmark,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
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
    <div className="relative min-h-screen bg-white text-zinc-900">
      <div className="relative overflow-hidden bg-zinc-100">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        </div>

        {/* Top nav */}
        <header className="sticky top-0 z-20">
          <div className="mx-auto w-full max-w-6xl px-4 pt-3 sm:px-6 sm:pt-4">
            <motion.div
              className="grid grid-cols-2 items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3 backdrop-blur-xl sm:px-5 md:grid-cols-3"
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
                  className="h-6 w-auto opacity-95 brightness-0 invert"
                />
              </div>

              <nav className="hidden items-center justify-center gap-10 text-sm font-medium text-white md:flex">
                <a href="#features" className="transition hover:text-white/80">
                  Features
                </a>
                <a href="#trust" className="transition hover:text-white/80">
                  Trust
                </a>
                <a href="#faq" className="transition hover:text-white/80">
                  FAQ
                </a>
              </nav>

              <div className="flex items-center justify-end gap-3">
                <motion.button
                  type="button"
                  onClick={() => login()}
                  className="rounded-full border border-fuchsia-500/80 bg-black px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(217,70,239,0.25),0_14px_45px_rgba(217,70,239,0.18)] transition hover:border-fuchsia-400/90 hover:bg-zinc-950"
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
          <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 pb-10 pt-0 sm:px-6 sm:pb-16 sm:pt-2 md:pt-3 lg:grid-cols-2 lg:gap-16 xl:gap-24">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-4 z-[5] hidden w-[min(92vw,560px)] translate-y-[18%] sm:left-6 md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, ease: easeInOut, delay: 0.05 }}
            >
              <motion.div
                className="relative"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: easeInOut,
                }}
              >
                <div className="relative p-5 sm:p-6">
                  <div className="relative rounded-3xl border-2 border-fuchsia-500 bg-transparent shadow-[0_0_0_1px_rgba(217,70,239,0.35),0_18px_60px_rgba(192,38,211,0.22)]">
                    <div className="relative aspect-[1024/487] w-full">
                      <Image
                        src="/hero-laptop-mockup.png"
                        alt="SwiftFix dashboard shown on a laptop"
                        fill
                        className="object-contain object-bottom"
                        sizes="(max-width: 1024px) 92vw, 560px"
                      />
                    </div>

                    <motion.div
                      className="pointer-events-none absolute left-[-2%] top-[-10%] z-10 w-[clamp(96px,18%,118px)]"
                      style={{ rotate: "-15deg" }}
                      animate={{ y: [0, -6, 0], rotate: [-15, -12, -15] }}
                      transition={{
                        duration: 4.8,
                        repeat: Infinity,
                        ease: easeInOut,
                        delay: 0.1,
                      }}
                    >
                      <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 via-fuchsia-600 to-purple-600 px-2 py-1 text-white shadow-[0_6px_22px_rgba(217,70,239,0.28)] ring-1 ring-white/25">
                        <div className="text-[10px] font-semibold tracking-tight">
                          +$356.30
                        </div>
                        <TrendingUp className="h-3 w-3 shrink-0 opacity-95" />
                      </div>
                    </motion.div>

                    <motion.div
                      className="pointer-events-none absolute bottom-[14%] left-[-8%] z-10 w-[clamp(124px,30%,178px)]"
                      style={{ rotate: "10deg" }}
                      animate={{ y: [0, -7, 0], rotate: [10, 7, 10] }}
                      transition={{
                        duration: 5.2,
                        repeat: Infinity,
                        ease: easeInOut,
                        delay: 0.05,
                      }}
                    >
                      <div className="rounded-xl bg-fuchsia-600 p-1.5 text-white shadow-[0_8px_26px_rgba(217,70,239,0.26)] ring-1 ring-white/20">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex -space-x-1">
                            <Image
                              src="/hero-floater-avatar-1.jpg"
                              alt=""
                              width={48}
                              height={48}
                              className="h-5 w-5 rounded-full border border-white object-cover"
                              sizes="20px"
                            />
                            <Image
                              src="/hero-floater-avatar-2.jpg"
                              alt=""
                              width={48}
                              height={48}
                              className="h-5 w-5 rounded-full border border-white object-cover"
                              sizes="20px"
                            />
                            <Image
                              src="/hero-floater-avatar-3.jpg"
                              alt=""
                              width={48}
                              height={48}
                              className="h-5 w-5 rounded-full border border-white object-cover"
                              sizes="20px"
                            />
                          </div>
                          <div className="rounded-md bg-white/15 p-0.5 ring-1 ring-white/25">
                            <Wallet className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="mt-1 text-[10px] font-bold leading-tight tracking-tight">
                          Pay Artisan
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="pointer-events-none absolute right-[-16%] top-[30%] z-10 w-[clamp(108px,20%,126px)]"
                      style={{ rotate: "9deg" }}
                      animate={{ y: [0, -6, 0], rotate: [9, 6, 9] }}
                      transition={{
                        duration: 5.6,
                        repeat: Infinity,
                        ease: easeInOut,
                        delay: 0.2,
                      }}
                    >
                      <div className="rounded-xl bg-white p-1.5 shadow-[0_8px_26px_rgba(17,24,39,0.07)] ring-1 ring-fuchsia-500">
                        <div className="flex items-start gap-1">
                          <Image
                            src="/hero-floater-avatar-mark.jpg"
                            alt=""
                            width={48}
                            height={48}
                            className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-fuchsia-200"
                            sizes="24px"
                          />
                          <div className="min-w-0">
                            <div className="text-[9px] font-bold leading-tight text-fuchsia-600">
                              Mark Lindsey
                            </div>
                            <div className="text-[8px] leading-tight text-zinc-500">
                              Personal Account
                            </div>
                          </div>
                        </div>
                        <div className="my-1 h-px w-full bg-zinc-200" />
                        <div className="flex items-center justify-between text-[9px] text-zinc-600">
                          <span>Transfer</span>
                          <ArrowUpRight className="h-2.5 w-2.5 text-zinc-500" />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="order-1 w-full max-w-xl -translate-y-20 text-center sm:max-w-2xl sm:-translate-y-28 sm:text-right lg:order-1 lg:max-w-3xl lg:-translate-y-36 lg:text-left"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                className="text-center font-semibold tracking-tight sm:text-right lg:text-left"
                variants={fadeUp}
              >
                <span className="block whitespace-nowrap text-black max-sm:text-[clamp(1.0625rem,4.2vw+0.6rem,1.875rem)] sm:text-5xl md:text-6xl">
                  Control Your Savings.
                </span>
                <span className="mt-1 block text-pretty text-3xl text-purple-600 sm:mt-0 sm:text-5xl md:text-6xl">
                  The Swift Way.
                </span>
              </motion.h1>
              <motion.p
                className="mt-5 max-w-xl text-pretty text-center text-sm leading-6 text-zinc-800 sm:text-right sm:text-base sm:leading-7 lg:text-left"
                variants={fadeUp}
              >
                Seamlessly request trusted artisans, and pay them in Naira or USDT.
              </motion.p>
              <motion.div
                className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-end lg:justify-start"
                variants={fadeUp}
              >
                  <motion.button
                    type="button"
                    onClick={() => login()}
                    className="rounded-full bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{ y: [0, -2, 0] }}
                    transition={{
                      duration: 3.8,
                      repeat: Infinity,
                      ease: easeInOut,
                    }}
                  >
                    Get Started
                  </motion.button>
                  <motion.span
                    className="inline-flex"
                    animate={{ y: [0, -2, 0] }}
                    transition={{
                      duration: 3.8,
                      repeat: Infinity,
                      ease: easeInOut,
                      delay: 0.12,
                    }}
                  >
                    <Link
                      href="#faq"
                      className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900"
                    >
                      Learn More
                    </Link>
                  </motion.span>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative z-10 order-2 flex justify-center lg:order-2 lg:justify-end lg:pl-8 xl:pl-14"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeInOut }}
            >
              <motion.div
                className="relative aspect-square w-full max-w-[320px] bg-transparent !bg-none sm:max-w-md lg:max-w-none"
                animate={{ y: [0, -9, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: easeInOut,
                  delay: 0.1,
                }}
              >
                <Image
                  src="/hero-right-character.png"
                  alt="Illustration of a character"
                  fill
                  className="bg-transparent !bg-none object-contain object-center"
                  sizes="(max-width: 1024px) 320px, 42vw"
                  priority
                  style={{ backgroundColor: "transparent" }}
                />
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Features grid */}
      <section id="features" className="relative z-10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-15% 0px -10% 0px" }}
            variants={fadeUp}
          >
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              The strategic choice for{" "}
              <span className="rounded-xl bg-purple-600 px-2.5 py-1 text-white shadow-[0_10px_30px_rgba(147,51,234,0.22)]">
                Financial Growth
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-sm font-medium leading-6 text-zinc-600 sm:text-base sm:leading-7">
              Built for people that are intentional about Financial Growth
            </p>
          </motion.div>

          <motion.div
            className="relative mx-auto mt-12 max-w-5xl"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-15% 0px -10% 0px" }}
          >
            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              <motion.div
                className="group relative overflow-hidden rounded-2xl bg-zinc-900 shadow-[0_18px_60px_rgba(17,24,39,0.18)] ring-1 ring-zinc-200"
                variants={fadeUp}
              >
                <div className="absolute inset-0">
                  <Image
                    src="/features-swap-pay.jpg"
                    alt=""
                    fill
                    className="object-cover object-center opacity-90"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                </div>

                <div className="relative flex min-h-[260px] flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-2">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.22)] ring-1 ring-white/25">
                      <ArrowLeftRight className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-5 text-xl font-semibold tracking-tight">
                    Swap &amp; Pay
                  </div>
                  <div className="mt-2 max-w-[40ch] text-sm leading-6 text-white/85">
                    Instantly move between USDT and NGN, then pay in one step.
                  </div>
                  <button
                    type="button"
                    onClick={() => login()}
                    className="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-lime-200 px-5 py-2 text-xs font-semibold text-zinc-900 shadow-[0_12px_34px_rgba(163,230,53,0.28)] transition group-hover:bg-lime-100"
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>

              <motion.div
                className="relative overflow-hidden rounded-2xl bg-violet-100 shadow-[0_18px_60px_rgba(17,24,39,0.08)] ring-1 ring-zinc-200"
                variants={fadeUp}
              >
                <div className="relative flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_14px_40px_rgba(124,58,237,0.18)] ring-2 ring-violet-400/35">
                    <PiggyBank className="h-9 w-9 text-violet-700" />
                  </div>
                  <div className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">
                    Trusted Artisans
                  </div>
                  <div className="mt-2 max-w-[42ch] text-sm leading-6 text-zinc-700">
                    Send funds only to vetted providers with clear receipts.
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="relative overflow-hidden rounded-2xl bg-lime-200 shadow-[0_18px_60px_rgba(17,24,39,0.08)] ring-1 ring-zinc-200"
                variants={fadeUp}
              >
                <div className="relative flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_14px_40px_rgba(16,185,129,0.18)] ring-2 ring-emerald-400/25">
                    <Landmark className="h-9 w-9 text-emerald-700" />
                  </div>
                  <div className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">
                    Zero Hidden Fees
                  </div>
                  <div className="mt-2 max-w-[42ch] text-sm leading-6 text-zinc-700">
                    Transparent pricing before you confirm any transaction.
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Secondary features / bento */}
      <section id="trust" className="relative z-10 min-h-[100svh] bg-white">
        <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl items-center px-4 pb-16 pt-2 sm:px-6 sm:pb-24">
          <div className="w-full">
            <motion.div
              className="grid gap-10"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
            >
              <motion.div
                className="grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]"
                variants={fadeUp}
              >
                <h2 className="text-balance text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
                  Future banking{" "}
                  <span className="rounded-xl bg-purple-600 px-2.5 py-1 text-white shadow-[0_10px_30px_rgba(147,51,234,0.22)]">
                    you need
                  </span>
                </h2>
                <p className="max-w-xl text-balance text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7 lg:pt-6">
                  Payment now handled wth ease seamlessly — swaps, payouts, and receipts
                  designed for real-world usage.
                </p>
              </motion.div>

              <motion.div
                className="grid gap-6 rounded-3xl bg-gradient-to-r from-violet-100 via-white to-lime-100 p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)] ring-1 ring-zinc-200 sm:p-8"
                variants={fadeUp}
              >
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      value: "99.9%",
                      label: "Reliable rails",
                      body: "Built to keep swaps, payments, and withdrawals moving.",
                    },
                    {
                      value: "2s",
                      label: "Swap speed",
                      body: "Fast confirmations for USDT ⇄ NGN flows.",
                    },
                    {
                      value: "24/7",
                      label: "Monitoring",
                      body: "Real-time signals to protect your activity.",
                    },
                    {
                      value: "0",
                      label: "Hidden fees",
                      body: "Transparent pricing before you confirm.",
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="relative">
                      <div className="text-3xl font-semibold tracking-tight text-purple-700">
                        {metric.value}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-zinc-900">
                        {metric.label}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-zinc-600">
                        {metric.body}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]"
                variants={fadeUp}
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    How it works <span className="text-purple-600">•</span>
                  </div>
                  <h3 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                    <span className="rounded-xl bg-purple-600 px-2.5 py-1 text-white shadow-[0_10px_30px_rgba(147,51,234,0.22)]">
                      Empowering people
                    </span>{" "}
                    to take control of their finances
                  </h3>
                </div>
                <p className="max-w-xl text-balance text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7 lg:pt-6">
                  SwiftFix helps you execute swaps, pay trusted artisans, and withdraw
                  to your bank with consistent transaction records.
                </p>
              </motion.div>

              <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                variants={stagger}
              >
                <motion.div
                  className="group relative overflow-hidden rounded-2xl bg-zinc-900 shadow-[0_18px_60px_rgba(17,24,39,0.22)] ring-1 ring-zinc-200"
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25, ease: easeInOut }}
                >
                  <div className="absolute inset-0">
                    <Image
                      src="/trust-feature-card.jpg"
                      alt=""
                      fill
                      className="object-cover object-center opacity-90"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/40 to-transparent" />
                  </div>
                  <div className="relative flex min-h-[240px] flex-col justify-end p-6 text-white">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.25)] ring-1 ring-white/25">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-base font-semibold tracking-tight">
                      Unified Wallet
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/85">
                      Track balances and activity across flows with a clean, focused
                      dashboard.
                    </div>
                  </div>
                </motion.div>

                {[
                  {
                    icon: <Banknote className="h-6 w-6 text-violet-800" />,
                    title: "Bank Withdrawals",
                    body: "Withdraw to your local bank with verification-first rails and clear confirmations.",
                    tint: "bg-violet-200 text-zinc-900 ring-violet-300/70",
                  },
                  {
                    icon: <BadgeCheck className="h-6 w-6 text-purple-800" />,
                    title: "Structured Transactions",
                    body: "Every move is recorded with consistent metadata—easy to audit and reconcile.",
                    tint: "bg-purple-100 text-zinc-900 ring-purple-200/80",
                  },
                  {
                    icon: <ShieldCheck className="h-6 w-6 text-emerald-800" />,
                    title: "Security Controls",
                    body: "Modern auth, secure sessions, and safeguards designed for financial UX.",
                    tint: "bg-lime-200 text-zinc-900 ring-lime-300/70",
                  },
                ].map((card) => (
                  <motion.div
                    key={card.title}
                    className={[
                      "relative overflow-hidden rounded-2xl p-6 shadow-[0_18px_60px_rgba(17,24,39,0.10)] ring-1",
                      card.tint,
                    ].join(" ")}
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25, ease: easeInOut }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.10)] ring-1 ring-black/5">
                        {card.icon}
                      </div>
                    </div>
                    <div className="mt-5 text-base font-semibold tracking-tight text-zinc-900">
                      {card.title}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-zinc-700">
                      {card.body}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="relative z-10 min-h-[100svh] overflow-hidden bg-white"
      >
        <div className="mx-auto flex min-h-[100svh] w-full max-w-3xl items-center px-4 py-16 sm:px-6 sm:py-24">
          <div className="w-full">
            <motion.div
              className="mx-auto max-w-2xl text-center"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-15% 0px -10% 0px" }}
            >
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                <span className="rounded-xl bg-purple-600 px-2.5 py-1 text-white shadow-[0_10px_30px_rgba(147,51,234,0.22)]">
                  FAQ
                </span>
              </h2>
              <p className="mt-4 text-balance text-sm leading-6 text-zinc-600 sm:text-base">
                Quick answers to common questions.
              </p>
            </motion.div>

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
                  className={[
                    "overflow-hidden rounded-2xl border border-purple-800/25 bg-purple-700 shadow-[0_18px_60px_rgba(88,28,135,0.22)] transition",
                    open
                      ? "ring-2 ring-purple-400/60 shadow-[0_0_0_1px_rgba(192,132,252,0.35),0_22px_80px_rgba(88,28,135,0.18)]"
                      : "hover:bg-purple-600 hover:ring-1 hover:ring-purple-400/25",
                  ].join(" ")}
                  variants={fadeUp}
                  layout
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(open ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-white"
                  >
                    <div className="text-sm font-semibold tracking-tight text-white">
                      {item.q}
                    </div>
                    <ChevronDown
                      className={[
                        "h-4 w-4 shrink-0 text-white/80 transition-transform",
                        open ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  </button>
                  {open ? (
                    <motion.div
                      className="px-5 pb-5 text-sm leading-6 text-white/85"
                      initial={{ height: 0, opacity: 0, y: -4 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -4 }}
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
      <footer className="relative z-10 bg-black">
        <motion.div
          className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          variants={fadeUp}
        >
          <div className="grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Image
                  src="/logo-footer.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 object-contain brightness-0 invert"
                />
                <span className="text-lg font-semibold tracking-tight text-white">
                  SwiftFix
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                Control your capital with modern swaps, payments, and compliant
                withdrawals.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Get started</div>
              <p className="mt-4 text-sm leading-6 text-white/70">
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

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
            <div className="text-purple-400">
              © {new Date().getFullYear()} SwiftFix. All rights reserved.
            </div>
            <div className="flex items-center gap-5 text-white/60">
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
