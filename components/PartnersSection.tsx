import Image from "next/image";

export default function PartnersSection() {
  // We repeat the 3 logos to perfectly fill your 7 slots
  const partners = [
    { name: "Paystack", src: "/partner-paystack.png", needsInvert: true },
    { name: "Privy", src: "/partner-privy.png", needsInvert: false },
    { name: "TinyFish", src: "/partner-tinyfish.png", needsInvert: true },
    { name: "Paystack", src: "/partner-paystack.png", needsInvert: true },
    { name: "Privy", src: "/partner-privy.png", needsInvert: false },
    { name: "TinyFish", src: "/partner-tinyfish.png", needsInvert: true },
    { name: "Paystack", src: "/partner-paystack.png", needsInvert: true }, // Ends on Paystack to make 7
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

        {/* The Grid: Changes from 2 columns on mobile, to 4 on tablet, to 7 on desktop */}
        <div className="grid grid-cols-2 items-center justify-items-center gap-8 opacity-95 md:grid-cols-4 lg:grid-cols-7">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="relative h-14 w-36 grayscale opacity-85 transition-all duration-300 hover:grayscale-0 hover:opacity-100 sm:h-16 sm:w-44"
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
    </section>
  );
}

