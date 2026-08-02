import { Heart } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

export default function WishlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-16">
      <SectionHeading
        eyebrow="Saved items"
        title="Your wishlist"
        body="Products you've saved for later. Sign in to sync your wishlist across devices."
      />
      <div className="mt-14 border border-dashed border-line rounded-3xl py-20 flex flex-col items-center text-center">
        <Heart className="w-8 h-8 text-brand mb-4" />
        <p className="text-ink/45 max-w-sm">
          This is a placeholder screen for the presentation build — wishlist items will appear here once product
          saving is wired up.
        </p>
      </div>
    </div>
  );
}
