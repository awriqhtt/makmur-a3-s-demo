import { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-6 h-px bg-brand" />
      <span className="text-xs font-semibold tracking-widest uppercase text-brand font-data">
        {children}
      </span>
    </div>
  );
}

export default function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] leading-[1.05] mb-4">
        {title}
      </h2>
      {body && <p className="text-ink/70 text-base md:text-lg leading-relaxed">{body}</p>}
    </div>
  );
}
