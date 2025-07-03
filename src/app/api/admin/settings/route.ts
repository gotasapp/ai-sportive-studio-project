import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Configurações
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'settings';

// Dados iniciais caso a coleção esteja vazia
const initialSettings = {
  siteName: 'CHZ Fantoken Studio',
  maintenanceMode: false,
  apiKeys: {
    openai: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    thirdweb: 'pk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    cloudinary: 'cloudinary://xxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxx@xxxxxxxxx',
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

let db: Db;
let settingsCollection: Collection;

// Função de inicialização
async function init() {
  if (db && settingsCollection) return;
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    settingsCollection = db.collection(COLLECTION_NAME);
  } catch (error) {
    throw new Error('Failed to connect to the database.');
  }
}

// Inicializa a conexão
(async () => { await init() })();

// Handler GET
export async function GET() {
  try {
    if (!settingsCollection) await init();
    
    let settings = await settingsCollection.findOne({});

    if (!settings) {
      await settingsCollection.insertOne(initialSettings);
      settings = initialSettings;
    }

    // Mascarar as chaves de API antes de enviar para o cliente
    const maskedSettings = {
        ...settings,
        apiKeys: Object.keys(settings.apiKeys).reduce((acc, key) => {
            const apiKey = settings.apiKeys[key as keyof typeof settings.apiKeys];
            acc[key as keyof typeof settings.apiKeys] = apiKey ? `${apiKey.substring(0, 5)}...` : '';
            return acc;
        }, {} as typeof settings.apiKeys)
    };
    return NextResponse.json(maskedSettings);

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// Handler POST
export async function POST(request: Request) {
  try {
    if (!settingsCollection) await init();

    const newSettings = await request.json();
    const { _id, ...configData } = newSettings;

    // Buscar a config atual para não sobrescrever as chaves de API com valores mascarados
    const currentSettings = await settingsCollection.findOne({});
    
    if (currentSettings && configData.apiKeys) {
        Object.keys(configData.apiKeys).forEach(key => {
            const apiKey = configData.apiKeys[key as keyof typeof configData.apiKeys];
            if (!apiKey || apiKey.includes('...')) {
                configData.apiKeys[key as keyof typeof configData.apiKeys] = currentSettings.apiKeys[key as keyof typeof currentSettings.apiKeys];
            }
        });
    }

    await settingsCollection.updateOne(
      {},
      { $set: configData },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Settings saved successfully', settings: configData });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
} 