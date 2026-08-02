import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "brand" | "ghost";

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-full transition-all duration-200";
  const styles: Record<Variant, string> = {
    primary: "bg-ink text-white hover:bg-brand",
    outline: "border border-line text-ink hover:border-ink bg-white",
    brand: "bg-brand text-white hover:bg-ink",
    ghost: "text-ink hover:text-brand",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
