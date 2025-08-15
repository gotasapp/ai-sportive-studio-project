'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Instagram, 
  Youtube,
  MessageCircle
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-1">
            <div className="mb-6">
              <Logo width={120} height={35} />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              THE SPORTS<br />
              BLOCKCHAIN
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Governance Column */}
          <div>
            <h3 className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
              GOVERNANCE
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  BECOME A VALIDATOR
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  GLOSSARY
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  REPORT A SECURITY ISSUE
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  THE CHILIZ GROUP
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  CAREERS
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies Column */}
          <div>
            <h3 className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
              POLICIES
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  TERMS OF USE
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  COOKIES POLICY
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  MANAGE COOKIES
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  PRIVACY POLICY
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  STAKING RISK DISCLOSURE
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  RECRUITMENT PRIVACY POLICY
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  INSIDER TRADING POLICY
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
              SUPPORT
            </h3>
            <p className="text-gray-300 text-sm">
              CHILIZHAINSUPPORT@CHILIZ.COM
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6">
                  <Logo width={24} height={24} />
                </div>
                <span className="text-white text-sm font-medium">chiliz</span>
              </div>
              <span className="text-gray-400 text-sm">
                © Copyright 2018 – 2025. All Rights Reserved.
              </span>
            </div>
            
            {/* Social links */}
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}