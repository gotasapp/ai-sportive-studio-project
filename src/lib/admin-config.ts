/**
 * Admin Configuration
 * Integrates with Thirdweb authentication system
 * Supports wallet, email, and social login admin access
 */

// Admin wallet addresses - unified configuration
// Supports both existing ADMIN_WALLET_ADDRESS and new NEXT_PUBLIC_ADMIN_WALLET_ADDRESS
export const ADMIN_ADDRESSES = [
  // Frontend admin access (new)
  process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS?.toLowerCase(),
  
  // Backend/Engine admin (existing - for compatibility)
  process.env.ADMIN_WALLET_ADDRESS?.toLowerCase(),
  
  // Multiple admin support (add your admin wallets here)
  // '0x1234567890abcdef1234567890abcdef12345678', // Example admin 2
  // '0xabcdef1234567890abcdef1234567890abcdef12', // Example admin 3
  // '0xYourOtherWalletHere',                       // Example admin 4
].filter(Boolean) as string[];

// Admin emails - for social/email login admin access
export const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase(),
  // Add more admin emails here:
  // 'admin@chzsports.com',      // Main admin
  // 'owner@chzsports.com',      // Owner
  // 'moderator@chzsports.com',  // Moderator
].filter(Boolean) as string[];

/**
 * Check if a wallet address is an admin
 */
export function isAdminAddress(address: string | undefined): boolean {
  if (!address) return false;
  return ADMIN_ADDRESSES.includes(address.toLowerCase());
}

/**
 * Check if an email is an admin (for social/email login)
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if user is admin (supports both wallet and email)
 * Integrates with Thirdweb account system
 */
export function isAdmin(account: any): boolean {
  if (!account) return false;
  
  // Check wallet address (traditional wallet login)
  if (account.address && isAdminAddress(account.address)) {
    return true;
  }
  
  // Check email (social/email login via InApp Wallet)
  // Note: Email might be available in account metadata depending on login method
  if (account.email && isAdminEmail(account.email)) {
    return true;
  }
  
  // Future: Check other authentication methods
  return false;
}

/**
 * Admin permissions - can be extended for role-based access
 */
export const ADMIN_PERMISSIONS = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  JERSEYS: 'jerseys',
  STADIUMS: 'stadiums',
  LOGOS: 'logos',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  LOGS: 'logs',
  MODERATION: 'moderation',
} as const;

/**
 * Default admin has all permissions
 */
export const DEFAULT_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSIONS);

/**
 * Get admin permissions for a wallet address
 * In the future, this can be extended to support different admin roles
 */
export function getAdminPermissions(address: string | undefined): string[] {
  if (!isAdminAddress(address)) return [];
  return DEFAULT_ADMIN_PERMISSIONS;
}

/**
 * Check if admin has specific permission
 */
export function hasAdminPermission(
  address: string | undefined, 
  permission: string
): boolean {
  const permissions = getAdminPermissions(address);
  return permissions.includes(permission);
} 