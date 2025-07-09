import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Teams Data API: Fetching detailed team data from MongoDB...');
    
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeColors = searchParams.get('includeColors') === 'true';
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar dados detalhados dos times
    const collections = ['jerseys', 'badges', 'stadiums'];
    const teamData: { [key: string]: any } = {};
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        
        // Pipeline para extrair informações detalhadas dos times
        const pipeline = [
          { $unwind: '$tags' },
          {
            $group: {
              _id: '$tags',
              count: { $sum: 1 },
              items: {
                $push: {
                  name: '$name',
                  imageUrl: '$imageUrl',
                  createdAt: '$createdAt',
                  metadata: '$metadata',
                  prompt: '$prompt'
                }
              },
              latestCreated: { $max: '$createdAt' }
            }
          },
          { $sort: { count: -1 } }
        ];
        
        const result = await collection.aggregate(pipeline).toArray();
        
        result.forEach((item: any) => {
          const teamName = item._id;
          
          if (teamName && typeof teamName === 'string' && isTeamName(teamName)) {
            if (!teamData[teamName]) {
              teamData[teamName] = {
                name: teamName,
                normalizedName: normalizeTeamName(teamName),
                totalItems: 0,
                collections: {},
                latestActivity: null,
                colors: [],
                patterns: [],
                styles: [],
                sampleImages: []
              };
            }
            
            teamData[teamName].collections[collectionName] = item.count;
            teamData[teamName].totalItems += item.count;
            
            if (!teamData[teamName].latestActivity || 
                new Date(item.latestCreated) > new Date(teamData[teamName].latestActivity)) {
              teamData[teamName].latestActivity = item.latestCreated;
            }
            
            // Extrair informações de vision/metadata
            item.items.forEach((nftItem: any) => {
              // Coletar cores se disponível no metadata
              if (nftItem.metadata?.colors) {
                teamData[teamName].colors.push(...nftItem.metadata.colors);
              }
              
              // Coletar padrões
              if (nftItem.metadata?.patterns) {
                teamData[teamName].patterns.push(...nftItem.metadata.patterns);
              }
              
              // Coletar estilos
              if (nftItem.metadata?.style) {
                teamData[teamName].styles.push(nftItem.metadata.style);
              }
              
              // Coletar imagens de exemplo (limitado a 3 por time)
              if (nftItem.imageUrl && teamData[teamName].sampleImages.length < 3) {
                teamData[teamName].sampleImages.push({
                  url: nftItem.imageUrl,
                  type: collectionName,
                  name: nftItem.name
                });
              }
            });
          }
        });
        
        console.log(`✅ Teams Data API: Processed ${result.length} teams from ${collectionName}`);
        
      } catch (error) {
        console.warn(`⚠️ Teams Data API: Error processing ${collectionName}:`, error);
      }
    }
    
    // Processar e limpar dados
    const processedTeams = Object.values(teamData).map((team: any) => {
      // Remover duplicados e contar frequência
      team.colors = getFrequencyMap(team.colors);
      team.patterns = getFrequencyMap(team.patterns);
      team.styles = getFrequencyMap(team.styles);
      
      // Adicionar cores padrão conhecidas se não houver dados
      if (Object.keys(team.colors).length === 0) {
        team.colors = getDefaultTeamColors(team.name);
      }
      
      // Adicionar informações úteis para vision
      team.visionData = {
        hasReferenceImages: team.sampleImages.length > 0,
        primaryColors: Object.keys(team.colors).slice(0, 2),
        commonPatterns: Object.keys(team.patterns).slice(0, 3),
        popularStyles: Object.keys(team.styles).slice(0, 2),
        dataQuality: calculateDataQuality(team)
      };
      
      return team;
    });
    
    // Ordenar por atividade recente e quantidade de itens
    processedTeams.sort((a, b) => {
      const scoreA = a.totalItems + (new Date(a.latestActivity).getTime() / 1000000000);
      const scoreB = b.totalItems + (new Date(b.latestActivity).getTime() / 1000000000);
      return scoreB - scoreA;
    });
    
    console.log(`✅ Teams Data API: Returning ${processedTeams.length} teams with detailed data`);
    
    return NextResponse.json({
      success: true,
      count: processedTeams.length,
      teams: processedTeams,
      metadata: {
        generatedAt: new Date().toISOString(),
        includeStats,
        includeColors,
        collectionsSearched: collections
      }
    });
    
  } catch (error) {
    console.error('❌ Teams Data API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch team data',
      teams: []
    }, { status: 500 });
  }
}

/**
 * Função para determinar se uma tag é um nome de time
 */
function isTeamName(tag: string): boolean {
  const knownTeams = [
    'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'santos', 'vasco', 'vasco da gama',
    'grêmio', 'internacional', 'botafogo', 'atlético mineiro', 'cruzeiro', 'bahia',
    'sport', 'ceará', 'fortaleza', 'goiás', 'coritiba', 'athletico', 'red bull bragantino',
    'arsenal', 'chelsea', 'liverpool', 'manchester united', 'manchester city', 'tottenham',
    'real madrid', 'barcelona', 'atletico madrid', 'sevilla', 'valencia',
    'bayern munich', 'borussia dortmund', 'juventus', 'ac milan', 'inter milan',
    'psg', 'marseille', 'ajax', 'benfica', 'porto'
  ];
  
  const tagLower = tag.toLowerCase();
  
  if (knownTeams.includes(tagLower)) {
    return true;
  }
  
  if (tagLower.length >= 4 && 
      !tagLower.includes('home') && 
      !tagLower.includes('away') && 
      !tagLower.includes('third') &&
      !tagLower.includes('classic') &&
      !tagLower.includes('modern') &&
      !tagLower.includes('retro') &&
      !tagLower.includes('vintage') &&
      !tagLower.includes('jersey') &&
      !tagLower.includes('badge') &&
      !tagLower.includes('stadium') &&
      !tagLower.includes('vision') &&
      !tagLower.includes('generated') &&
      !tagLower.includes('custom')) {
    return true;
  }
  
  return false;
}

/**
 * Normalizar nome do time
 */
function normalizeTeamName(name: string): string {
  return name.toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Criar mapa de frequência
 */
function getFrequencyMap(array: string[]): { [key: string]: number } {
  const map: { [key: string]: number } = {};
  array.forEach(item => {
    if (item && typeof item === 'string') {
      map[item] = (map[item] || 0) + 1;
    }
  });
  return map;
}

/**
 * Cores padrão para times conhecidos
 */
function getDefaultTeamColors(teamName: string): { [key: string]: number } {
  const colors: { [key: string]: { [key: string]: number } } = {
    'flamengo': { 'red': 3, 'black': 2 },
    'palmeiras': { 'green': 3, 'white': 2 },
    'corinthians': { 'white': 3, 'black': 2 },
    'são paulo': { 'red': 2, 'white': 2, 'black': 1 },
    'santos': { 'white': 3, 'black': 1 },
    'vasco da gama': { 'white': 2, 'black': 2 },
    'vasco': { 'white': 2, 'black': 2 },
    'grêmio': { 'blue': 3, 'white': 1, 'black': 1 },
    'internacional': { 'red': 3, 'white': 1 },
    'botafogo': { 'black': 2, 'white': 2 },
    'atlético mineiro': { 'black': 2, 'white': 2 },
    'arsenal': { 'red': 3, 'white': 1 },
    'chelsea': { 'blue': 3, 'white': 1 },
    'liverpool': { 'red': 3, 'white': 1 },
    'manchester united': { 'red': 3, 'white': 1, 'black': 1 },
    'manchester city': { 'blue': 3, 'white': 1 },
    'real madrid': { 'white': 3, 'blue': 1 },
    'barcelona': { 'blue': 2, 'red': 2 },
    'bayern munich': { 'red': 3, 'white': 1 },
    'juventus': { 'black': 2, 'white': 2 },
    'ac milan': { 'red': 2, 'black': 2 },
    'psg': { 'blue': 2, 'red': 2, 'white': 1 }
  };
  
  const normalizedName = normalizeTeamName(teamName);
  return colors[normalizedName] || { 'blue': 1, 'white': 1 };
}

/**
 * Calcular qualidade dos dados para vision
 */
function calculateDataQuality(team: any): 'high' | 'medium' | 'low' {
  let score = 0;
  
  if (team.totalItems >= 5) score += 3;
  else if (team.totalItems >= 2) score += 2;
  else score += 1;
  
  if (team.sampleImages.length >= 2) score += 2;
  else if (team.sampleImages.length >= 1) score += 1;
  
  if (Object.keys(team.colors).length >= 2) score += 2;
  if (Object.keys(team.patterns).length >= 1) score += 1;
  if (Object.keys(team.styles).length >= 1) score += 1;
  
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
} 