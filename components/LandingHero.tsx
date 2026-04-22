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

      <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 pb-12 pt-5 sm:px-6 sm:pt-6 sm:pb-16">
        <motion.header
          className="flex w-full max-w-6xl items-center justify-between gap-3 rounded-[30px] bg-black px-4 py-3.5 sm:px-6 sm:py-4"
          style={{ minHeight: "72px" }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeInOut }}
        >
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2"
            style={{ fontFamily: "var(--font-montserrat-alt), ui-sans-serif, sans-serif" }}
          >
            <Image
              src="/logo.png"
              alt="Swiftfix"
              width={140}
              height={28}
              className="h-7 w-auto max-w-[min(100%,9rem)] brightness-0 invert"
              priority
            />
            <span className="sr-only">Swiftfix</span>
          </Link>

          <nav
            className="hidden min-w-0 items-center justify-center gap-6 text-[18px] font-medium text-white sm:gap-8 sm:text-[22px] md:flex md:text-[25px] md:leading-[37.5px]"
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
              className="rounded-[30px] border-[3px] border-[#F711F0] bg-transparent px-4 py-2.5 text-[16px] font-semibold text-white sm:px-5 sm:py-3 sm:text-[22px] md:text-[25px] md:leading-[37.5px]"
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            >
              Sign In
            </button>
          </div>
        </motion.header>

        <div className="mt-8 grid flex-1 grid-cols-1 items-start gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-6 xl:gap-8">
          <div className="order-2 flex justify-center lg:order-1 lg:col-span-5">
            <motion.div
              className="relative w-full max-w-md lg:max-w-none"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: easeInOut, delay: 0.1 }}
            >
              <div className="relative aspect-[476/667] w-full max-w-[420px] overflow-hidden sm:max-w-md lg:ml-0">
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

          <div className="order-1 flex min-w-0 flex-col gap-8 lg:order-2 lg:col-span-7">
            <motion.div
              className="flex w-full flex-col items-center gap-4 text-center sm:gap-5 lg:items-end lg:text-right"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                variants={fadeUp}
                className="max-w-[40rem] text-balance text-3xl font-semibold sm:text-4xl md:text-5xl md:leading-tight lg:text-6xl xl:text-[70px] xl:font-semibold xl:leading-[70px] xl:tracking-[0.12em]"
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
                className="max-w-xl text-base font-normal leading-[30px] text-black sm:text-lg lg:max-w-[32rem] lg:text-[20px]"
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              >
                Seamlessly request trusted artisans, and pay them in Naira or Usdt
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-1 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-end sm:gap-4"
              >
                <button
                  type="button"
                  onClick={onLogin}
                  className="h-14 min-w-[10rem] rounded-[30px] bg-[#F711F0] px-6 text-[18px] font-semibold text-white sm:h-16 sm:min-w-[12rem] sm:text-[22px] md:text-[25px] md:leading-[37.5px]"
                  style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  Get Started
                </button>
                <Link
                  href="#features"
                  className="inline-flex h-14 min-w-[10rem] items-center justify-center rounded-[30px] bg-black px-6 text-center text-[18px] font-semibold text-white sm:h-16 sm:min-w-[12rem] sm:text-[22px] md:text-[25px] md:leading-[37.5px]"
                  style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeInOut, delay: 0.12 }}
            >
              <div className="relative mx-auto w-full max-w-2xl lg:max-w-3xl">
                <div className="relative aspect-[1440/640] w-full sm:aspect-[3/1]">
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
