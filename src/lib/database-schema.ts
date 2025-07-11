// Database schema definitions for Vision Generation Revamp
import { ObjectId } from 'mongodb'

export interface TeamReference {
  _id?: ObjectId
  teamName: string
  category: 'jersey' | 'stadium' | 'badge'
  referenceImages: ReferenceImage[]
  teamBasePrompt: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface ReferenceImage {
  id: string
  url: string
  filename: string
  uploadedAt: Date
  description?: string
  isPrimary?: boolean
  metadata?: {
    width?: number
    height?: number
    size?: number
    format?: string
  }
}

export interface VisionAnalysisCache {
  _id?: ObjectId
  teamName: string
  category: 'jersey' | 'stadium' | 'badge'
  referenceImageIds: string[]
  analysisResult: string
  analysisPrompt: string
  visionModel: string
  createdAt: Date
  expiresAt: Date
  isValid: boolean
}

// Database collections names
export const COLLECTIONS = {
  TEAM_REFERENCES: 'team_references',
  VISION_ANALYSIS_CACHE: 'vision_analysis_cache',
  // Existing collections
  JERSEYS: 'jerseys',
  STADIUMS: 'stadiums',
  BADGES: 'badges'
} as const

// Database name
export const DB_NAME = 'chz-app-db'

// Default prompts for each category
export const DEFAULT_PROMPTS = {
  jersey: {
    base: "Create a realistic football jersey with high quality details, official team design, professional sports uniform",
    suffix: "studio lighting, clean background, HD, professional photography, vibrant colors"
  },
  stadium: {
    base: "Create a realistic football stadium with architectural details, professional sports venue, high quality rendering",
    suffix: "dramatic lighting, wide angle view, HD, professional photography, atmospheric"
  },
  badge: {
    base: "Create a professional sports badge with clean design, official team emblem, high quality logo",
    suffix: "clean background, vector style, HD, professional design, vibrant colors"
  }
} as const

// Validation schemas
export const VALIDATION = {
  teamName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/
  },
  teamBasePrompt: {
    minLength: 10,
    maxLength: 500
  },
  referenceImage: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxImages: 5
  }
} as const

// Helper functions
export function createTeamReference(data: Partial<TeamReference>): TeamReference {
  return {
    teamName: data.teamName || '',
    category: data.category || 'jersey',
    referenceImages: data.referenceImages || [],
    teamBasePrompt: data.teamBasePrompt || DEFAULT_PROMPTS[data.category || 'jersey'].base,
    isActive: data.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy
  }
}

export function createReferenceImage(data: Partial<ReferenceImage>): ReferenceImage {
  return {
    id: data.id || generateImageId(),
    url: data.url || '',
    filename: data.filename || '',
    uploadedAt: new Date(),
    description: data.description,
    isPrimary: data.isPrimary ?? false,
    metadata: data.metadata
  }
}

export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Index definitions for MongoDB
export const INDEXES = {
  team_references: [
    { key: { teamName: 1, category: 1 }, unique: true },
    { key: { category: 1 } },
    { key: { isActive: 1 } },
    { key: { createdAt: -1 } }
  ],
  vision_analysis_cache: [
    { key: { teamName: 1, category: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    { key: { isValid: 1 } }
  ]
} as const 