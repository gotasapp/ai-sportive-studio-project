export const FIXED_COLLECTION_IMAGES = {
  'Jersey Collection': 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png',
  'Stadium Collection': 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
  'Badge Collection': 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png',
  // Categorias
  jersey: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png',
  stadium: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
  badge: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png',
  // Fallback
  default: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png'
};

export function getCollectionImage(collectionNameOrCategory: string, originalImage?: string): string {
  // Para as 3 collections principais, sempre usar imagem fixa
  if (FIXED_COLLECTION_IMAGES[collectionNameOrCategory as keyof typeof FIXED_COLLECTION_IMAGES]) {
    return FIXED_COLLECTION_IMAGES[collectionNameOrCategory as keyof typeof FIXED_COLLECTION_IMAGES];
  }
  
  // Para outras collections, usar imagem original se disponível
  if (originalImage && originalImage !== '' && !originalImage.includes('undefined')) {
    return originalImage;
  }
  
  // Fallback
  return FIXED_COLLECTION_IMAGES.default;
}