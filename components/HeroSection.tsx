"use client";

import Image from "next/image";
import { Diamond, Search, ArrowRight } from "lucide-react";

type HeroSectionProps = {
  onLogin: () => void;
};

export default function HeroSection({ onLogin }: HeroSectionProps) {
  return (
    <section
      className={[
        "relative min-h-screen overflow-hidden",
        "bg-[url('/portrait-young-african-american-man-with-vr-glasses.jpg')] bg-cover bg-center bg-no-repeat",
      ].join(" ")}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25"
      />
      <div className="absolute inset-0 bg-black/30" aria-hidden />

      <div className="relative mx-auto flex h-full min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2 text-white">
            <Diamond className="h-5 w-5" />
            <span className="text-base font-extrabold tracking-tight">
              Crypto Art
            </span>
          </div>

          <nav className="hidden items-center gap-10 text-sm text-zinc-300 md:flex">
            <a href="#" className="transition hover:text-white">
              Home
            </a>
            <a href="#" className="transition hover:text-white">
              Artworks
            </a>
            <a href="#" className="transition hover:text-white">
              Creators
            </a>
            <a href="#" className="transition hover:text-white">
              Community
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/15"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/20">
              <Image
                src="/avatar.png"
                alt="Profile"
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
          </div>
        </header>

        {/* Hero grid */}
        <div className="grid flex-grow grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2">
          {/* Left */}
          <div>
            <h1 className="text-balance text-5xl font-extrabold leading-tight tracking-tight text-white lg:text-7xl">
              Explore &amp; Create Unique Artworks.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-zinc-300">
              Discover, collect, and sell extraordinary NFTs on the world&apos;s
              first &amp; largest digital marketplace.
            </p>

            <div className="mt-10 flex max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/10 p-2 backdrop-blur-md">
              <Search className="ml-3 h-5 w-5 text-zinc-300" />
              <input
                className="w-full bg-transparent px-3 text-sm text-white placeholder-zinc-400 focus:outline-none"
                placeholder="Search items, collections..."
              />
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#B6FF00] text-black transition hover:bg-[#a3e600]"
                aria-label="Submit search"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-lg">
              <div className="relative aspect-square overflow-hidden rounded-3xl">
                <Image
                  src="/nft-image.png"
                  alt="NFT preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 384px"
                  priority
                />
              </div>

              <div className="mt-4">
                <div className="text-lg font-bold text-white">The Unknown</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                  <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/15">
                    <Image
                      src="/avatar.png"
                      alt="Creator"
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span>Krypto Space</span>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="text-xs text-zinc-400">
                    Highest Bid:
                    <div className="mt-1 text-sm font-semibold text-white">
                      0.98 ETH
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    Value:
                    <div className="mt-1 text-lg font-extrabold text-white">
                      4.99 ETH
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-[#B6FF00] py-3 text-sm font-bold text-black transition hover:bg-[#a3e600]"
                >
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

