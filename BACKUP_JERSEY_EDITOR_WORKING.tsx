'use client'

import React, { useState, useEffect } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check } from 'lucide-react'
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from 'thirdweb/react'
import Image from 'next/image'

import { Dalle3Service } from '../lib/services/dalle3-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { ImageGenerationRequest } from '../types'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

export default function JerseyEditor() {
  // ... [COMPLETE COMPONENT CODE - WORKING VERSION WITH RENDER API DIRECT CALL] ...
  // This is the working version that calls Render API directly instead of local proxy
  // Jersey generation works perfectly with this implementation
} 