"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Jerseys",
    image:"https://res.cloudinary.com/dpilz4p6g/image/upload/v1755201840/T-Shirt_with_Background__2_-removebg-preview_mhywqw.png",
    href: "/jerseys",
  },
  {
    title: "Stadiums",
    image: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1755201830/Stadion_without_Background-removebg-preview_mzor0r.png",
    href: "/stadiums",
  },
  {
    title: "Badges",
    image: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1755201820/Badge_with_background-removebg-preview_nbdfqm.png",
    href: "/badges",
  },
  {
    title: "Marketplace",
    image: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1755201870/Kart_with_Background-removebg-preview_ame0qx.png",
    href: "/marketplace",
  },
];

export function CommerceHero() {
  return (
    <div className="w-full relative px-6 md:px-12 lg:px-16 xl:px-20 min-h-screen">

        {/* Hero Section with Text Left and Video Right */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center min-h-[50vh] py-6">
          
          {/* Left Column - Text Content (4/7 of space with left margin) */}
          <motion.div
            className="text-left lg:col-span-4 ml-0 pl-0 sm:ml-4 md:ml-8 lg:ml-12 xl:ml-16"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
              <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent block mb-4">
                CREATE
              </span>
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent block mb-4">
                FAN SPORTS
                </span>
              <span className="bg-gradient-to-r from-[#A20131] via-[#A20131]/90 to-[#A20131]/70 bg-clip-text text-transparent block">
                NFTs
                </span>
              </motion.h1>
            
              <motion.p
              className="text-base md:text-lg lg:text-xl text-gray-400 max-w-xl mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
              Generate jerseys, stadiums, and badges with technology.
              Trade and collect unique sports NFTs on the CHZ blockchain.
              </motion.p>

            <motion.div
              className="flex gap-3 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              <a href="/marketplace" className="inline-block">
                <button className="px-6 py-2.5 bg-[#A20131] hover:bg-[#8B0128] text-white rounded-full font-medium transition-all transform hover:scale-105 text-sm">
                  MARKETPLACE
                </button>
              </a>
              <a href="/jerseys" className="inline-block">
                <button className="px-6 py-2.5 border border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white rounded-full font-medium transition-all text-sm">
                  CREATE
                </button>
              </a>
            </motion.div>

            {/* User avatars */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B0128] to-[#A20131] border-2 border-[#14101e]"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A20131] to-[#FF1744] border-2 border-[#14101e]"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF1744] to-white border-2 border-[#14101e]"></div>
                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#14101e] flex items-center justify-center text-xs text-[#A20131] font-semibold">
                  +50
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                <span className="text-white font-bold">100+</span> NFTs Created
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Video */}
          <motion.div
            className="relative lg:col-span-3 lg:-ml-16"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[350px] bg-transparent">
              <video
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
                playsInline
                src="https://res.cloudinary.com/dpilz4p6g/video/upload/v1755042089/exported-video-pro_2_ljszrz.mp4"
              />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mx-auto" style={{ maxWidth: 'calc(80rem * 1.1)' }}>
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              className="group relative rounded min-h-[12rem] sm:min-h-[14rem] md:min-h-[15rem] lg:min-h-[16rem] w-full max-w-full sm:max-w-[280px] md:max-w-[300px] lg:max-w-[285px] mx-auto overflow-hidden transition-all duration-500 border border-[#3B3644]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            >
              <a href={category.href} className="absolute inset-0 z-20">
                {/* Imagem centralizada e reduzida (50%) com fundo transparente */}
                <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="max-w-[60%] max-h-[60%] md:max-w-[50%] md:max-h-[50%] object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                {/* Título centralizado na base do card */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <h2 className="text-center text-lg sm:text-xl md:text-2xl lg:text-[clamp(0.9rem,2.1vw,1.4rem)] font-bold text-white drop-shadow-lg">
                    {category.title}
                  </h2>
                </div>
                {/* Botão de navegação no canto inferior direito (forma anterior) */}
                <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
              </a>
            </motion.div>
          ))}
        </div>
    </div>
  );
}