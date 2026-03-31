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
    <section className="py-16 bg-white dark:bg-[#101010] border-y border-gray-100 dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8">
          Powered By Industry Leaders
        </p>

        {/* The Grid: Changes from 2 columns on mobile, to 4 on tablet, to 7 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center justify-items-center opacity-80">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="relative w-28 h-12 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
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

