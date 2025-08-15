"use client";

import Link from "next/link";
import {
  FaXTwitter,
  FaDiscord,
  FaTelegram,
  FaRedditAlien,
  FaGithub,
  FaLinkedinIn,
  FaFacebookF,
  FaYoutube,
  FaInstagram,
  FaMediumM,
} from "react-icons/fa6";

type FooterProps = {
  /** Altura mínima do footer em px (para igualar a 1ª imagem). Ex: 360, 420 */
  minHeight?: number;
  className?: string;
};

export default function Footer({ minHeight = 420, className = "" }: FooterProps) {
  const primaryLinks = [
    { href: "/governance", label: "Governance" },
    { href: "/validators", label: "Become a Validator" },
    { href: "/glossary", label: "Glossary" },
    { href: "/security", label: "Report a Security Issue" },
    { href: "/group", label: "The Chiliz Group" },
    { href: "/careers", label: "Careers" },
  ];

  const policyLinks = [
    { href: "/terms", label: "Terms of Use" },
    { href: "/cookies", label: "Cookies Policy" },
    { href: "/manage-cookies", label: "Manage Cookies" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/staking-risk", label: "Staking Risk Disclosure" },
    { href: "/recruitment-privacy", label: "Recruitment Privacy Policy" },
    { href: "/insider-trading", label: "Insider Trading Policy" },
  ];

  const socials = [
    { href: "https://x.com/chiliz", label: "X (Twitter)", icon: <FaXTwitter /> },
    { href: "https://discord.com/invite/chiliz", label: "Discord", icon: <FaDiscord /> },
    { href: "https://t.me/chiliz", label: "Telegram", icon: <FaTelegram /> },
    { href: "https://www.reddit.com/r/chiliz", label: "Reddit", icon: <FaRedditAlien /> },
    { href: "https://github.com/chiliz", label: "GitHub", icon: <FaGithub /> },
    { href: "https://www.linkedin.com/company/chiliz", label: "LinkedIn", icon: <FaLinkedinIn /> },
    { href: "https://facebook.com/chiliz", label: "Facebook", icon: <FaFacebookF /> },
    { href: "https://youtube.com/chiliz", label: "YouTube", icon: <FaYoutube /> },
    { href: "https://instagram.com/chiliz", label: "Instagram", icon: <FaInstagram /> },
    { href: "https://medium.com/@chiliz", label: "Medium", icon: <FaMediumM /> },
  ];

  return (
    <footer
      className={`w-full border-t border-white/10 bg-[#151513] text-[#FDFDFD] ${className}`}
      style={{ minHeight }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
        {/* Top link rows */}
        <div className="pt-10 md:pt-12">
          {/* ROW 1 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] uppercase tracking-wide text-white/80">
            <span className="text-[#A58CF5]">Chiliz</span>
            <span className="hidden text-white/20 md:inline">|</span>
            {primaryLinks.map((l, i) => (
              <div key={l.href} className="flex items-center gap-5">
                <Link
                  href={l.href}
                  className="transition hover:text-white"
                >
                  {l.label}
                </Link>
                {i < primaryLinks.length - 1 && (
                  <span className="hidden text-white/20 md:inline">|</span>
                )}
              </div>
            ))}
          </div>

          {/* ROW 2 – Policies */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] uppercase tracking-wide text-white/60">
            <span className="text-white/70">Policies</span>
            {policyLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition hover:text-white/90"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* ROW 3 – Support */}
          <div className="mt-6 text-[12px] uppercase tracking-wide text-white/60">
            <span className="mr-4 text-white/70">Support</span>
            <a
              href="mailto:chilizchainsupport@chiliz.com"
              className="underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              chilizchainsupport@chiliz.com
            </a>
          </div>
        </div>

        {/* Big claim */}
        <div className="pointer-events-none select-none pt-12 md:pt-16">
          <h2 className="font-extrabold leading-[0.9] text-[40px] md:text-[72px] tracking-tight">
            THE SPORTS
            <br />
            BLOCKCHAIN
          </h2>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-6 py-8 md:flex-row">
          <div className="flex items-center gap-3 text-sm text-white/70">
            {/* Logo placeholder - pode substituir por <Image /> se tiver logo */}
            <div className="rounded bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wider">
              chiliz
            </div>
            <span>© Copyright 2018 – {new Date().getFullYear()}. All Rights Reserved.</span>
          </div>

          <nav className="flex items-center gap-5 text-xl text-white/80">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="transition hover:opacity-100 hover:text-[#FD2163] focus:outline-none focus:ring-2 focus:ring-[#FD2163]/50 rounded"
              >
                {s.icon}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}