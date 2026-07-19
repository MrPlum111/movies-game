import { posterUrl, profileUrl } from "@/lib/format";

type Props = {
  path: string | null;
  alt: string;
  kind?: "poster" | "profile";
  className?: string;
};

export function Poster({ path, alt, kind = "poster", className = "" }: Props) {
  const src = kind === "profile" ? profileUrl(path) : posterUrl(path);
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--muted)] text-[var(--muted-fg)] text-xs tracking-wide ${className}`}
        aria-label={alt}
      >
        No image
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`object-cover ${className}`} />
  );
}
