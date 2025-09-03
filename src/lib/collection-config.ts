import { LaunchpadStatus, MarketplaceStatus } from '@/types';

/**
 * Configurações e constantes para o sistema de coleções
 */

// Status disponíveis para Launchpad
export const LAUNCHPAD_STATUSES: LaunchpadStatus[] = [
  'draft',
  'pending_launchpad',
  'upcoming',
  'active',
  'hidden',
  'ended',
  'rejected'
];

// Status disponíveis para Marketplace
export const MARKETPLACE_STATUSES: MarketplaceStatus[] = [
  'draft',
  'active',
  'hidden'
];

// Status que são visíveis para usuários no Launchpad
export const VISIBLE_LAUNCHPAD_STATUSES: LaunchpadStatus[] = [
  'upcoming',
  'active'
];

// Status que são visíveis para usuários no Marketplace
export const VISIBLE_MARKETPLACE_STATUSES: MarketplaceStatus[] = [
  'active'
];

// Configurações de paginação
export const COLLECTION_PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
};

// Configurações de ordenação
export const COLLECTION_SORT_OPTIONS = {
  CREATED_AT_DESC: { createdAt: -1 },
  CREATED_AT_ASC: { createdAt: 1 },
  NAME_ASC: { name: 1 },
  NAME_DESC: { name: -1 },
  LAUNCH_DATE_ASC: { launchDate: 1 },
  LAUNCH_DATE_DESC: { launchDate: -1 },
  MINTED_DESC: { minted: -1 },
  MINTED_ASC: { minted: 1 }
};

// Configurações de filtros
export const COLLECTION_FILTERS = {
  CATEGORIES: ['jerseys', 'stadiums', 'badges'] as const,
  TYPES: ['marketplace', 'launchpad'] as const
};

// Configurações de validação
export const COLLECTION_VALIDATION = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 1000,
  TOTAL_SUPPLY_MIN: 1,
  TOTAL_SUPPLY_MAX: 100000,
  PRICE_MIN: 0.0001,
  PRICE_MAX: 1000000
};

// Configurações de mint stages
export const MINT_STAGE_CONFIG = {
  DEFAULT_WALLET_LIMIT: 1,
  MAX_WALLET_LIMIT: 10,
  MIN_STAGE_DURATION_HOURS: 1,
  MAX_STAGE_DURATION_DAYS: 30
};

// Configurações de URLs e endpoints
export const COLLECTION_ENDPOINTS = {
  COLLECTIONS: '/api/collections',
  ADMIN_COLLECTIONS: '/api/admin/collections',
  LAUNCHPAD_COLLECTIONS: '/api/launchpad/collections',
  ACTIVATE_LAUNCHPAD: '/api/admin/activate-launchpad'
};

// Configurações de cache
export const COLLECTION_CACHE = {
  TTL_SECONDS: 300, // 5 minutos
  STALE_WHILE_REVALIDATE_SECONDS: 60 // 1 minuto
};

// Configurações de notificações
export const COLLECTION_NOTIFICATIONS = {
  APPROVAL_SUBJECT: 'Collection Approved for Launchpad',
  REJECTION_SUBJECT: 'Collection Rejected',
  ACTIVATION_SUBJECT: 'Collection Activated',
  LAUNCH_SUBJECT: 'Collection Launched'
};

// Configurações de templates de email
export const COLLECTION_EMAIL_TEMPLATES = {
  APPROVAL: 'collection-approved',
  REJECTION: 'collection-rejected',
  ACTIVATION: 'collection-activated',
  LAUNCH: 'collection-launched'
};

// Configurações de permissões
export const COLLECTION_PERMISSIONS = {
  CREATE: 'collections:create',
  READ: 'collections:read',
  UPDATE: 'collections:update',
  DELETE: 'collections:delete',
  APPROVE: 'collections:approve',
  REJECT: 'collections:reject',
  ACTIVATE: 'collections:activate',
  HIDE: 'collections:hide',
  MOVE_TO_MARKETPLACE: 'collections:move-to-marketplace'
};

// Configurações de logs
export const COLLECTION_LOG_ACTIONS = {
  CREATED: 'collection_created',
  UPDATED: 'collection_updated',
  APPROVED: 'collection_approved',
  REJECTED: 'collection_rejected',
  ACTIVATED: 'collection_activated',
  HIDDEN: 'collection_hidden',
  MOVED_TO_MARKETPLACE: 'collection_moved_to_marketplace',
  STATUS_CHANGED: 'collection_status_changed'
};

// Configurações de analytics
export const COLLECTION_ANALYTICS = {
  EVENTS: {
    VIEW: 'collection_viewed',
    MINT_ATTEMPT: 'collection_mint_attempted',
    MINT_SUCCESS: 'collection_mint_successful',
    SHARE: 'collection_shared',
    FAVORITE: 'collection_favorited'
  }
};

// Configurações de SEO
export const COLLECTION_SEO = {
  DEFAULT_TITLE: 'NFT Collections',
  DEFAULT_DESCRIPTION: 'Discover and mint exclusive NFT collections',
  TITLE_TEMPLATE: '{name} - NFT Collection',
  DESCRIPTION_TEMPLATE: '{description} - Mint your NFT now!'
};

// Configurações de imagens
export const COLLECTION_IMAGE_CONFIG = {
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_HEIGHT: 300,
  BANNER_WIDTH: 1200,
  BANNER_HEIGHT: 400,
  QUALITY: 85,
  FORMAT: 'webp' as const
};

// Configurações de blockchain
export const COLLECTION_BLOCKCHAIN_CONFIG = {
  SUPPORTED_CHAINS: [80002, 1], // Polygon Amoy, Ethereum
  DEFAULT_CHAIN: 80002,
  GAS_LIMIT: 500000,
  GAS_PRICE: '20000000000' // 20 gwei
};

// Configurações de royalties
export const COLLECTION_ROYALTIES = {
  DEFAULT_PERCENTAGE: 2.5, // 2.5%
  MAX_PERCENTAGE: 10, // 10%
  MIN_PERCENTAGE: 0 // 0%
};

// Configurações de whitelist
export const COLLECTION_WHITELIST_CONFIG = {
  MAX_ADDRESSES: 10000,
  BATCH_SIZE: 100,
  VALIDATION_REGEX: /^0x[a-fA-F0-9]{40}$/
};

// Configurações de airdrop
export const COLLECTION_AIRDROP_CONFIG = {
  MAX_RECIPIENTS: 1000,
  BATCH_SIZE: 50,
  GAS_LIMIT_PER_TX: 200000
}; 