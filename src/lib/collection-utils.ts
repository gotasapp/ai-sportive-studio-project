import { Collection, LaunchpadStatus, MarketplaceStatus } from '@/types';

/**
 * Utilitários para validação e manipulação de coleções
 */

// Validação de status para Launchpad
export function isValidLaunchpadStatus(status: string): status is LaunchpadStatus {
  const validStatuses: LaunchpadStatus[] = [
    'draft',
    'pending_launchpad',
    'upcoming',
    'active',
    'hidden',
    'ended',
    'rejected'
  ];
  return validStatuses.includes(status as LaunchpadStatus);
}

// Validação de status para Marketplace
export function isValidMarketplaceStatus(status: string): status is MarketplaceStatus {
  const validStatuses: MarketplaceStatus[] = [
    'draft',
    'active',
    'hidden'
  ];
  return validStatuses.includes(status as MarketplaceStatus);
}

// Verificar se uma coleção é do tipo Launchpad
export function isLaunchpadCollection(collection: Collection): collection is Collection & { type: 'launchpad' } {
  return collection.type === 'launchpad';
}

// Verificar se uma coleção é do tipo Marketplace
export function isMarketplaceCollection(collection: Collection): collection is Collection & { type: 'marketplace' } {
  return collection.type === 'marketplace';
}

// Verificar se uma coleção está visível para usuários no Launchpad
export function isLaunchpadVisible(collection: Collection): boolean {
  if (!isLaunchpadCollection(collection)) return false;
  
  return collection.status === 'upcoming' || collection.status === 'active';
}

// Verificar se uma coleção está visível para usuários no Marketplace
export function isMarketplaceVisible(collection: Collection): boolean {
  if (!isMarketplaceCollection(collection)) return false;
  
  return collection.status === 'active';
}

// Verificar se uma coleção pode ser movida para o marketplace
export function canMoveToMarketplace(collection: Collection): boolean {
  if (!isLaunchpadCollection(collection)) return false;
  
  return collection.status === 'ended' && !collection.marketplaceEnabled;
}

// Verificar se uma coleção pode ser ativada no Launchpad
export function canActivateLaunchpad(collection: Collection): boolean {
  if (!isLaunchpadCollection(collection)) return false;
  
  return collection.status === 'pending_launchpad' || collection.status === 'upcoming';
}

// Verificar se uma coleção pode ser ocultada
export function canHideCollection(collection: Collection): boolean {
  return collection.status === 'active' || collection.status === 'upcoming';
}

// Verificar se uma coleção pode ser finalizada
export function canEndCollection(collection: Collection): boolean {
  return collection.status === 'active';
}

// Obter cor do badge baseado no status
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-600';
    case 'upcoming':
      return 'bg-orange-600';
    case 'hidden':
      return 'bg-gray-600';
    case 'ended':
      return 'bg-red-600';
    case 'rejected':
      return 'bg-red-800';
    case 'pending_launchpad':
      return 'bg-blue-600';
    case 'draft':
      return 'bg-gray-500';
    default:
      return 'bg-gray-600';
  }
}

// Obter texto descritivo do status
export function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'upcoming':
      return 'Upcoming';
    case 'hidden':
      return 'Hidden';
    case 'ended':
      return 'Ended';
    case 'rejected':
      return 'Rejected';
    case 'pending_launchpad':
      return 'Pending Approval';
    case 'draft':
      return 'Draft';
    default:
      return status;
  }
}

// Calcular progresso de mint
export function calculateMintProgress(collection: Collection): number {
  if (collection.totalSupply === 0) return 0;
  return Math.round((collection.minted / collection.totalSupply) * 100);
}

// Verificar se uma coleção está em mint ativo
export function isMintingActive(collection: Collection): boolean {
  if (!isLaunchpadCollection(collection)) return false;
  
  return collection.status === 'active';
}

// Verificar se uma coleção está agendada para o futuro
export function isUpcoming(collection: Collection): boolean {
  if (!isLaunchpadCollection(collection)) return false;
  
  return collection.status === 'upcoming';
}

// Verificar se uma coleção foi finalizada
export function isEnded(collection: Collection): boolean {
  if (!isLaunchpadCollection(collection)) return false;
  
  return collection.status === 'ended';
}

// Verificar se uma coleção está oculta
export function isHidden(collection: Collection): boolean {
  return collection.status === 'hidden';
}

// Obter data formatada de lançamento
export function getFormattedLaunchDate(collection: Collection): string | null {
  if (!collection.launchDate) return null;
  
  return new Date(collection.launchDate).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Obter tempo restante até o lançamento
export function getTimeUntilLaunch(collection: Collection): string | null {
  if (!collection.launchDate) return null;
  
  const now = new Date().getTime();
  const launchTime = new Date(collection.launchDate).getTime();
  const diff = launchTime - now;
  
  if (diff <= 0) return 'Launched';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Validar dados de criação de coleção
export function validateCreateCollectionData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!data.image || data.image.trim().length === 0) {
    errors.push('Image is required');
  }
  
  if (!data.category || !['jerseys', 'stadiums', 'badges'].includes(data.category)) {
    errors.push('Valid category is required');
  }
  
  if (!data.type || !['marketplace', 'launchpad'].includes(data.type)) {
    errors.push('Valid type is required');
  }
  
  if (!data.totalSupply || data.totalSupply <= 0) {
    errors.push('Total supply must be greater than 0');
  }
  
  if (!data.price || data.price.trim().length === 0) {
    errors.push('Price is required');
  }
  
  if (!data.creator || !data.creator.wallet || !data.creator.name) {
    errors.push('Creator information is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 

// ✅ FUNÇÕES UTILITÁRIAS PARA FUSO HORÁRIO UTC
/**
 * Converte data local para UTC
 */
export function getCurrentUTC(): Date {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
}

/**
 * Converte data local para string UTC ISO
 */
export function getCurrentUTCISO(): string {
  return getCurrentUTC().toISOString();
}

/**
 * Converte data local para string local formatada (Brasil)
 */
export function getCurrentLocalFormatted(): string {
  const now = new Date();
  return now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/**
 * Adiciona dias a uma data UTC
 */
export function addDaysToUTC(days: number, baseDate?: Date): Date {
  const base = baseDate || getCurrentUTC();
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Compara se uma data UTC já passou
 */
export function isUTCDatePassed(dateString: string): boolean {
  const targetDate = new Date(dateString);
  const nowUTC = getCurrentUTC();
  return nowUTC >= targetDate;
}

/**
 * Formata data UTC para exibição local
 */
export function formatUTCToLocal(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
} 