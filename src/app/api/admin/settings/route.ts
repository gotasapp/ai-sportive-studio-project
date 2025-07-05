import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';

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
  },
  contentFilters: {
    enabled: true,
    defaultPrompts: [
      'sexual content',
      'nudity',
      'violence',
      'weapons',
      'drugs',
      'gore',
      'hate speech',
      'discriminatory content',
      'illegal activities',
      'harmful content'
    ],
    customPrompts: []
  }
};

// Caminho para o arquivo de backup
const SETTINGS_FILE = path.join(process.cwd(), 'src/app/api/admin/settings/db.json');

// Função para ler settings do arquivo
async function readSettingsFromFile() {
  try {
    const fileContent = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    // Se o arquivo não existir, retornar settings iniciais
    return initialSettings;
  }
}

// Função para salvar settings no arquivo
async function saveSettingsToFile(settings: any) {
  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings to file:', error);
  }
}

// Função para tentar MongoDB primeiro, depois arquivo
async function getSettings() {
  try {
    // Tentar MongoDB primeiro
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const settingsCollection = db.collection('settings');
    
    // Buscar especificamente as configurações da aplicação
    let settings = await settingsCollection.findOne({ 
      _id: 'app_settings' as any
    });

    if (!settings) {
      // Se não encontrou, inserir settings iniciais
      await settingsCollection.insertOne({ 
        _id: 'app_settings' as any,
        ...initialSettings, 
        updatedAt: new Date()
      });
      settings = { _id: 'app_settings' as any, ...initialSettings };
    }

    // Salvar backup no arquivo
    await saveSettingsToFile(settings);
    
    return settings;
  } catch (error) {
    console.warn('MongoDB not available, using file fallback:', error instanceof Error ? error.message : error);
    // Fallback para arquivo
    return await readSettingsFromFile();
  }
}

// Função para salvar settings (MongoDB + arquivo)
async function saveSettings(settings: any) {
  // Sempre salvar no arquivo
  await saveSettingsToFile(settings);
  
  try {
    // Tentar salvar no MongoDB
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const settingsCollection = db.collection('settings');

    await settingsCollection.updateOne(
      { _id: 'app_settings' as any },
      { 
        $set: { 
          ...settings, 
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
  } catch (error) {
    console.warn('MongoDB not available for saving, using file only:', error instanceof Error ? error.message : error);
  }
}

// Handler GET
export async function GET() {
  try {
    const settings = await getSettings();

    // Mascarar as chaves de API antes de enviar para o cliente
    const maskedSettings = {
        ...settings,
        apiKeys: Object.keys(settings.apiKeys || {}).reduce((acc, key) => {
            const apiKey = settings.apiKeys[key as keyof typeof settings.apiKeys];
            acc[key as keyof typeof settings.apiKeys] = apiKey ? `${apiKey.substring(0, 5)}...` : '';
            return acc;
        }, {} as typeof settings.apiKeys)
    };
    
    return NextResponse.json(maskedSettings);

  } catch (error) {
    console.error('Error fetching settings:', error);
    // Último fallback - retornar settings iniciais
    return NextResponse.json({
      ...initialSettings,
      apiKeys: {
        openai: 'sk-xxx...',
        thirdweb: 'pk-xxx...',
        cloudinary: 'cloudinary://xxx...',
      }
    });
  }
}

// Handler POST
export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    const { _id, ...configData } = newSettings;

    // Buscar a config atual para não sobrescrever as chaves de API com valores mascarados
    const currentSettings = await getSettings();
    
    if (currentSettings && configData.apiKeys) {
        Object.keys(configData.apiKeys).forEach(key => {
            const apiKey = configData.apiKeys[key as keyof typeof configData.apiKeys];
            if (!apiKey || apiKey.includes('...')) {
                configData.apiKeys[key as keyof typeof configData.apiKeys] = currentSettings.apiKeys[key as keyof typeof currentSettings.apiKeys];
            }
        });
    }

    await saveSettings(configData);

    return NextResponse.json({ message: 'Settings saved successfully', settings: configData });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 