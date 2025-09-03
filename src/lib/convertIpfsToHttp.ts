export function convertIpfsToHttp(uri: string): string {
  if (!uri) return '/placeholder.png';
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;

  let hash = '';
  if (uri.startsWith('ipfs://')) {
    hash = uri.replace('ipfs://', '');
  } else if (uri.includes('/ipfs/')) {
    hash = uri.split('/ipfs/')[1];
  } else if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    hash = uri;
  } else {
    console.warn('⚠️ IPFS URI malformada:', uri);
    return '/placeholder.png';
  }

  return `https://cloudflare-ipfs.com/ipfs/${hash}`;
} 