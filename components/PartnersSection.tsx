import Image from "next/image";

export default function PartnersSection() {
  // We repeat the 3 logos to perfectly fill your 7 slots
  const partners = [
    { name: "TinyFish", src: "/tinyfish.png" },
    { name: "Yellow Card", src: "/yellowcard.png" },
    { name: "Jobberman", src: "/jobberman.png" },
    { name: "TinyFish", src: "/tinyfish.png" },
    { name: "Yellow Card", src: "/yellowcard.png" },
    { name: "Jobberman", src: "/jobberman.png" },
    { name: "TinyFish", src: "/tinyfish.png" }, // Ends on TinyFish to make 7
  ];

  return (
    <section className="border-y border-white/10 bg-black py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-white/60">
          Powered By Industry Leaders
        </p>

        {/* The Grid: Changes from 2 columns on mobile, to 4 on tablet, to 7 on desktop */}
        <div className="grid grid-cols-2 items-center justify-items-center gap-8 opacity-80 md:grid-cols-4 lg:grid-cols-7">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="relative h-12 w-28 grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
            >
              <Image
                src={partner.src}
                alt={`${partner.name} Logo`}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

