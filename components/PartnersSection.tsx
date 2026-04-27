import Image from "next/image";

export default function PartnersSection() {
  const partners = [
    { name: "Paystack", src: "/partner-paystack.svg", needsInvert: false },
    { name: "Privy", src: "/partner-privy.png", needsInvert: false },
    { name: "TinyFish", src: "/partner-tinyfish.png", needsInvert: true },
  ];

  return (
    <section className="border-y border-white/10 bg-black py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-white">
          Powered By{" "}
          <span className="rounded-xl bg-purple-600 px-2.5 py-1 text-white shadow-[0_10px_30px_rgba(147,51,234,0.22)]">
            Industry Leaders
          </span>
        </p>

        <div className="relative overflow-hidden">
          <div className="partners-marquee flex w-max items-center gap-10 opacity-95 sm:gap-14">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="relative h-14 w-36 shrink-0 grayscale opacity-85 transition-all duration-300 hover:grayscale-0 hover:opacity-100 sm:h-16 sm:w-44"
              >
                <Image
                  src={partner.src}
                  alt={`${partner.name} Logo`}
                  fill
                  className={[
                    "object-contain",
                    partner.needsInvert ? "brightness-0 invert" : "",
                  ].join(" ")}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .partners-marquee {
          animation: partners-marquee-scroll 16s linear infinite;
        }

        @keyframes partners-marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}

