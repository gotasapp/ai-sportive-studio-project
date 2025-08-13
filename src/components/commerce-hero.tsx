"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Jerseys",
    image: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1754670681/jerseys_generated/FC_Barcelona_DECO_1754670679.png",
    href: "/jerseys",
  },
  {
    title: "Stadiums",
    image: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1753267994/stadiums_generated/Santiago%20Bernabeu_1753267993.png",
    href: "/stadiums",
  },
  {
    title: "Badges",
    image: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png",
    href: "/badges",
  },
  {
    title: "Marketplace",
    image: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png",
    href: "/marketplace",
  },
];

export function CommerceHero() {
  return (
    <div className="w-full relative px-6 md:px-12 lg:px-16 xl:px-20 min-h-screen">

        {/* Hero Section with Text Left and Video Right */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center min-h-[60vh] py-8">
          
          {/* Left Column - Text Content (4/7 of space with left margin) */}
          <motion.div
            className="text-left lg:col-span-4 ml-12 md:ml-20 lg:ml-24 xl:ml-28 pl-[50px] ml-[50px]"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-8 leading-tight "
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
              className="text-lg md:text-xl lg:text-2xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              Generate jerseys, stadiums, and badges with technology.
              Trade and collect unique sports NFTs on the CHZ blockchain.
            </motion.p>

            <motion.div
              className="flex gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              <a href="/marketplace" className="inline-block">
                <button className="px-8 py-3 bg-[#A20131] hover:bg-[#8B0128] text-white rounded-full font-medium transition-all transform hover:scale-105">
                  MARKETPLACE
                </button>
              </a>
              <a href="/jerseys" className="inline-block">
                <button className="px-8 py-3 border border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white rounded-full font-medium transition-all">
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
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0128] to-[#A20131] border-2 border-[#14101e]"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A20131] to-[#FF1744] border-2 border-[#14101e]"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1744] to-white border-2 border-[#14101e]"></div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#14101e] flex items-center justify-center text-xs text-[#A20131] font-semibold">
                  +50
                </div>
              </div>
              <div className="text-gray-400">
                <span className="text-white font-bold">100+</span> NFTs Created
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Video */}
          <motion.div
            className="relative lg:col-span-3"
            style={{ marginLeft: '-60px' }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <div className="relative w-full h-[450px] bg-transparent">
              <video
                className="w-full h-full object-contain pl-{0}"
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
              className="group relative rounded-3xl min-h-[250px] sm:min-h-[300px] w-full overflow-hidden transition-all duration-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            >
              <a href={category.href} className="absolute inset-0 z-20">
                {/* Imagem de fundo cobrindo todo o card */}
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  {/* Overlay escuro para melhorar legibilidade do texto */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300"></div>
                </div>
                
                {/* Título sobreposto */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <h2 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-white drop-shadow-lg group-hover:scale-105 transition-all duration-300">
                    {category.title}
                  </h2>
                </div>
                
                {/* Ícone de seta no canto */}
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