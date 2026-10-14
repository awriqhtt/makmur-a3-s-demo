import Image from "next/image";

export default function Logomark({
  dark = false,
  compact = false,
  unoptimized = false,
  markOnly = false,
}: {
  dark?: boolean;
  compact?: boolean;
  unoptimized?: boolean;
  markOnly?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2.5 select-none"
      suppressHydrationWarning
    >
      <Image
        src="/logo.png"
        alt="Makmur A3'S"
        width={619}
        height={269}
        priority
        unoptimized={unoptimized}
        className={compact ? "h-6 w-auto" : "h-8 w-auto md:h-10"}
      />
      {!compact && !markOnly && (
        <div className="leading-tight" suppressHydrationWarning>
          <div
            className={`font-display text-[15px] md:text-base leading-none ${dark ? "text-white" : "text-ink"}`}
            suppressHydrationWarning
          >
            Makmur A3&apos;S
          </div>
          <div
            className={`text-[9px] md:text-[10px] tracking-[0.2em] uppercase font-data leading-none mt-1.5 ${dark ? "text-white/50" : "text-ink/45"}`}
            suppressHydrationWarning
          >
            Supply &amp; Packaging
          </div>
        </div>
      )}
    </div>
  );
}
