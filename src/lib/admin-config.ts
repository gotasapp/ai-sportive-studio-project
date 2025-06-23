/**
 * Admin Configuration
 * Integrates with Thirdweb authentication system
 * Supports wallet, email, and social login admin access
 */

import { getUserEmail } from 'thirdweb/wallets/in-app';
import { createThirdwebClient } from 'thirdweb';

// Cliente Thirdweb para acessar dados de usuário
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// Admin wallet addresses - unified configuration
// Supports both existing ADMIN_WALLET_ADDRESS and new NEXT_PUBLIC_ADMIN_WALLET_ADDRESS
export const ADMIN_ADDRESSES = [
  // Frontend admin access (new)
  process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS?.toLowerCase(),
  
  // Backend/Engine admin (existing - for compatibility)
  process.env.ADMIN_WALLET_ADDRESS?.toLowerCase(),
  
  // ✅ ADICIONE O NOVO ADMIN WALLET AQUI:
  // 'SEU_NOVO_WALLET_ADDRESS_AQUI'.toLowerCase(), // Novo admin - substitua por seu wallet
  
  // Multiple admin support (add more if needed)
   '0xAc6d591F61E28F6E914583eaC316fDCd2E1Ce30e', // ariel
  // '0xabcdef1234567890abcdef1234567890abcdef12', // Example admin 4
].filter(Boolean) as string[];

// Admin emails - for social/email login admin access
export const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase(),
  
  // ✅ ADICIONE O NOVO ADMIN EMAIL AQUI:
  // 'SEU_NOVO_EMAIL_ADMIN_AQUI@domain.com', // Novo admin - substitua por seu email
  
  // Add more admin emails here if needed:
  // 'admin@chzsports.com',      // Main admin
  // 'owner@chzsports.com',      // Owner
  'arieldj@gmail.com',   //moderator
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
 * Check if user is admin with async email verification
 * Use this for InApp wallets where email needs to be fetched
 */
export async function isAdminAsync(account: any, wallet: any): Promise<boolean> {
  if (!account) return false;
  
  // Check wallet address first (faster)
  if (account.address && isAdminAddress(account.address)) {
    return true;
  }
  
  // Check email from account object (if available)
  if (account.email && isAdminEmail(account.email)) {
    return true;
  }
  
  // For InApp wallets, try to fetch email using getUserEmail
  if (wallet && wallet.id === 'inApp') {
    try {
      const userEmail = await getUserEmail({ client });
      if (userEmail && isAdminEmail(userEmail)) {
        return true;
      }
    } catch (error) {
      console.warn('Failed to fetch user email for admin check:', error);
    }
  }
  
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