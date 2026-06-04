import Image from "next/image";
import fs from "node:fs";
import path from "node:path";

const logoPath = path.join(process.cwd(), "public", "assets", "logo", "logo.webp");

export function Logo() {
  const hasLogo = fs.existsSync(logoPath);

  if (hasLogo) {
    return (
      <div className="flex items-center">
        <Image
          src="/assets/logo/logo.webp"
          alt="Awesome Genie"
          width={154}
          height={52}
          className="h-12 w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-pink text-lg font-black text-brand-accent">
          AG
        </div>
      <span className="text-lg font-black text-brand-ink">Awesome Genie</span>
    </div>
  );
}
