import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// O caminho para nosso "banco de dados" JSON
const dbPath = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'settings', 'db.json');

// Dados iniciais caso o db.json não exista
const initialSettings = {
  siteName: 'CHZ Fantoken Studio',
  maintenanceMode: false,
  apiKeys: {
    openai: 'sk-...',
    thirdweb: 'pk-...',
    cloudinary: 'cloudinary://...',
  },
  featureFlags: {
    enableStadiums: true,
    enableBadges: true,
    enableLogoUpload: false,
    enableGasless: true,
  },
  defaults: {
    mintPrice: '10', // in CHZ
    editionSize: 100,
  }
};

// Função para ler os dados do DB
async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Se o arquivo não existe, cria com os dados iniciais
    await fs.writeFile(dbPath, JSON.stringify(initialSettings, null, 2));
    return initialSettings;
  }
}

// Função para escrever os dados no DB
async function writeDb(data: any) {
    // Por segurança, não vamos sobrescrever as chaves de API se elas vierem em branco do frontend
    const currentDb = await readDb();
    const newDb = { ...data };
    Object.keys(newDb.apiKeys).forEach(key => {
        if (!newDb.apiKeys[key] || newDb.apiKeys[key].includes('...')) {
            newDb.apiKeys[key] = currentDb.apiKeys[key];
        }
    });
    await fs.writeFile(dbPath, JSON.stringify(newDb, null, 2));
    return newDb;
}

// Handler GET para buscar a configuração
export async function GET() {
  try {
    const settings = await readDb();
    // Retornamos as chaves de API mascaradas por segurança
    const maskedSettings = {
        ...settings,
        apiKeys: Object.keys(settings.apiKeys).reduce((acc, key) => {
            acc[key] = settings.apiKeys[key] ? `${settings.apiKeys[key].substring(0, 5)}...` : '';
            return acc;
        }, {} as Record<string, string>)
    };
    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// Handler POST para salvar a configuração
export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    const savedSettings = await writeDb(newSettings);
    return NextResponse.json({ message: 'Settings saved successfully', settings: savedSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
} 