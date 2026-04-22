"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

/** Magenta from Figma style override on “Swift Way.” (r:0.96955, g:0.06837, b:0.93951) */
const MAGENTA = "#F711F0";

type LandingHeroProps = {
  onLogin: () => void;
};

export function LandingHero({ onLogin }: LandingHeroProps) {
  return (
    <section
      className="relative z-20 isolate min-h-[100svh] overflow-hidden text-zinc-900"
      style={{ fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-4 pb-10 pt-4 sm:px-5 sm:pt-5 sm:pb-12">
        <motion.header
          className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 rounded-full bg-black px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5 md:px-5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeInOut }}
        >
          <Link
            href="/"
            className="flex min-w-0 items-center gap-1.5"
            style={{ fontFamily: "var(--font-montserrat-alt), ui-sans-serif, sans-serif" }}
          >
            <Image
              src="/logo.png"
              alt="Swiftfix"
              width={112}
              height={22}
              className="h-5 w-auto max-w-[7.5rem] brightness-0 invert sm:max-w-[8rem]"
              priority
            />
            <span className="sr-only">Swiftfix</span>
          </Link>

          <nav
            className="hidden min-w-0 items-center justify-center gap-5 text-sm font-medium text-white/95 md:flex md:gap-7 md:text-[15px] lg:text-base"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            aria-label="Primary"
          >
            <a href="#features" className="shrink-0 transition hover:opacity-90">
              Features
            </a>
            <a href="#trust" className="shrink-0 transition hover:opacity-90">
              Trust
            </a>
            <a href="#faq" className="shrink-0 transition hover:opacity-90">
              FAQ
            </a>
          </nav>

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={onLogin}
              className="rounded-full border-2 border-[#F711F0] bg-transparent px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm"
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            >
              Sign In
            </button>
          </div>
        </motion.header>

        <div className="mt-6 grid flex-1 grid-cols-1 items-start gap-7 sm:mt-7 sm:gap-8 lg:mt-8 lg:grid-cols-12 lg:gap-5 xl:gap-6">
          <div className="order-2 flex justify-center lg:order-1 lg:col-span-5">
            <motion.div
              className="relative w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] lg:max-w-none lg:max-w-[min(100%,340px)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: easeInOut, delay: 0.1 }}
            >
              <div className="relative aspect-[476/667] w-full max-w-[320px] overflow-hidden sm:max-w-[340px] lg:ml-0 lg:max-w-[min(100%,360px)]">
                <Image
                  src="/hero-vr-portrait.png"
                  alt="Person with VR headset"
                  fill
                  className="object-contain object-bottom"
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  priority
                />
              </div>
            </motion.div>
          </div>

          <div className="order-1 flex min-w-0 flex-col gap-6 sm:gap-7 lg:order-2 lg:col-span-7">
            <motion.div
              className="flex w-full flex-col items-center gap-3 text-center sm:gap-4 lg:items-end lg:text-right"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                variants={fadeUp}
                className="max-w-xl text-balance text-2xl font-semibold leading-tight tracking-tight text-black sm:max-w-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl"
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              >
                <span className="text-black">
                  Control Your Savings,
                  <br />
                  The{" "}
                </span>
                <span style={{ color: MAGENTA }}>Swift Way.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="max-w-md text-sm font-normal leading-relaxed text-zinc-600 sm:max-w-lg sm:text-base lg:max-w-md"
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              >
                Seamlessly request trusted artisans, and pay them in Naira or Usdt
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-0.5 flex w-full max-w-sm flex-col items-stretch justify-center gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3 lg:justify-end"
              >
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex h-10 min-w-[8.5rem] items-center justify-center rounded-full bg-[#F711F0] px-5 text-sm font-semibold text-white sm:h-11 sm:min-w-[9.5rem] sm:px-6 sm:text-[15px]"
                  style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  Get Started
                </button>
                <Link
                  href="#features"
                  className="inline-flex h-10 min-w-[8.5rem] items-center justify-center rounded-full bg-black px-5 text-center text-sm font-semibold text-white sm:h-11 sm:min-w-[9.5rem] sm:px-6 sm:text-[15px]"
                  style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative w-full pt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeInOut, delay: 0.12 }}
            >
              <div className="relative mx-auto w-full max-w-lg sm:max-w-xl lg:max-w-2xl">
                <div className="relative aspect-[1440/640] w-full sm:aspect-[5/2]">
                  <Image
                    src="/hero-macbook-mockup.png"
                    alt="Swiftfix app dashboard preview"
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
