"use client";

import Link from "next/link";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
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
  FaMedium,
} from "react-icons/fa6";

type FooterProps = {
  /** Altura mínima do footer em px (para igualar a 1ª imagem). Ex: 360, 420 */
  minHeight?: number;
  className?: string;
};

export default function Footer({ minHeight = 504, className = "" }: FooterProps) {
  const isMobile = useIsMobile();
  
  const primaryLinks = [
    { href: "https://www.chiliz.com/governance/", label: "Governance" },
    { href: "https://www.chiliz.com/become-a-validator/", label: "Become a Validator" },
    { href: "https://www.chiliz.com/glossary/", label: "Glossary" },
    { href: "https://www.chiliz.com/security/", label: "Report a Security Issue" },
    { href: "https://www.chiliz.com/the-chiliz-group/", label: "The Chiliz Group" },
    { href: "https://www.chiliz.com/careers/", label: "Careers" },
  ];

  const policyLinks = [
    { href: "https://www.chiliz.com/terms-and-conditions/", label: "Terms of Use" },
    { href: "https://www.chiliz.com/cookies-policy/", label: "Cookies Policy" },
    { href: "https://jersey-generator-ai2.vercel.app/", label: "Manage Cookies" },
    { href: "https://www.chiliz.com/privacy-policy/", label: "Privacy Policy" },
    { href: "https://www.chiliz.com/staking-risks-disclosure/", label: "Staking Risk Disclosure" },
    { href: "https://www.chiliz.com/recruitment-privacy-policy/", label: "Recruitment Privacy Policy" },
    { href: "https://www.chiliz.com/insider-trading-policy/", label: "Insider Trading Policy" },
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
    { href: "https://medium.com/@chiliz", label: "Medium", icon: <FaMedium /> },
  ];

  return (
    <footer
      className={`w-full border-t border-gray-200 bg-white text-gray-900 ${className}`}
      style={{ minHeight: isMobile ? 'auto' : minHeight }}
    >
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
        {/* Top link rows */}
        <div className="pt-8 sm:pt-12 md:pt-16 lg:pt-20 space-y-6 sm:space-y-8">
          {/* CHILIZ Section */}
          <div>
            <h3 className="text-[#A58CF5] text-xs sm:text-[13px] uppercase tracking-wide font-semibold mb-3">Chiliz</h3>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-wrap items-center gap-x-5 gap-y-2'} text-xs sm:text-[13px] uppercase tracking-wide text-gray-700`}>
              {primaryLinks.map((l, i) => (
                <div key={l.href} className={`flex items-center ${isMobile ? 'w-full' : 'gap-5'}`}>
                  <Link
                    href={l.href}
                    className="transition hover:text-gray-900"
                  >
                    {l.label}
                  </Link>
                  {!isMobile && i < primaryLinks.length - 1 && (
                    <span className="hidden text-gray-400 md:inline">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* POLICIES Section */}
          <div>
            <h3 className="text-[#A58CF5] text-xs sm:text-[12px] uppercase tracking-wide font-semibold mb-3">Policies</h3>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-wrap items-center gap-x-6 gap-y-2'} text-xs sm:text-[12px] uppercase tracking-wide text-gray-600`}>
              {policyLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="transition hover:text-gray-900"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* SUPPORT Section */}
          <div>
            <h3 className="text-[#A58CF5] text-xs sm:text-[12px] uppercase tracking-wide font-semibold mb-3">Support</h3>
            <div className="text-xs sm:text-[12px] uppercase tracking-wide text-gray-600">
              <a
                href="mailto:chilizchainsupport@chiliz.com"
                className="underline decoration-gray-400 underline-offset-4 hover:decoration-gray-900"
              >
                chilizchainsupport@chiliz.com
              </a>
            </div>
          </div>
        </div>

        {/* Big claim */}
        <div className="pointer-events-none select-none pt-12 sm:pt-16 md:pt-20 lg:pt-24">
          <h2 className={`font-extrabold leading-[0.9] tracking-tight text-gray-900 ${
            isMobile 
              ? 'text-[28px] sm:text-[36px] text-center' 
              : 'text-[40px] md:text-[72px] text-left'
          }`}>
            THE SPORTS
            <br />
            BLOCKCHAIN
          </h2>
        </div>

        {/* Bottom bar */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-col md:flex-row'} items-center justify-between gap-4 sm:gap-6 py-8 sm:py-12`}>
          {/* Espaço vazio à esquerda */}
          <div className="hidden md:block flex-1"></div>
          
          {/* Copyright centralizado */}
          <div className={`flex items-center gap-2 text-xs sm:text-sm text-gray-600 ${isMobile ? 'order-2' : ''}`}>
            <Image 
              src="/footer_icon.png" 
              alt="Chiliz Logo" 
              width={isMobile ? 60 : 78} 
              height={isMobile ? 60 : 78}
              className="object-contain mt-0.5"
            />
            <span className={isMobile ? 'text-center' : ''}>© Copyright 2018 – {new Date().getFullYear()}. All Rights Reserved.</span>
          </div>

          {/* Redes sociais */}
          <nav className={`flex items-center gap-3 sm:gap-5 text-lg sm:text-xl ${isMobile ? 'order-1 justify-center' : 'flex-1 justify-end'}`} style={{ color: '#111827' }}>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="transition hover:opacity-100 hover:text-[#FD2163] focus:outline-none focus:ring-2 focus:ring-[#FD2163]/50 rounded p-1"
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