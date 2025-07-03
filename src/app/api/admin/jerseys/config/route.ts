import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Configurações do banco de dados
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jersey_configs';

// Dados iniciais caso a coleção esteja vazia
const initialConfig = {
  basePrompt: "professional football jersey, high quality fabric, realistic sports uniform, official team design",
  suffixPrompt: "studio lighting, clean background, HD, professional photography, vibrant colors",
  negativePrompts: {
    global: ["cartoon", "anime", "blurry", "text", "watermark", "low quality"],
    style: ["amateur", "fake", "cheap"],
    quality: ["pixelated", "distorted", "unclear"]
  },
  parameters: {
    creativity: 0.7,
    quality: 0.9,
    styleStrength: 0.8,
    guidanceScale: 7.5
  },
  teamTemplates: {
    flamengo: {
      colors: ["#ff0000", "#000000"],
      elements: ["red and black stripes", "club crest"],
      context: "Traditional Brazilian football club with red and black colors"
    },
    palmeiras: {
      colors: ["#00aa00", "#ffffff"],
      elements: ["green and white", "palm tree symbol"],
      context: "Historic Brazilian club with green and white tradition"
    }
  }
};

let db: Db;
let configs: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && configs) return;
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    configs = db.collection(COLLECTION_NAME);
  } catch (error) {
    throw new Error('Failed to connect to the database.');
  }
}

// Inicializa a conexão
(async () => { await init() })();


// Handler GET para buscar a configuração
export async function GET() {
  try {
    if (!configs) await init();
    
    // Como só temos um documento de config, usamos findOne
    let config = await configs.findOne({});

    // Se não houver configuração, criamos uma com os dados iniciais
    if (!config) {
      await configs.insertOne(initialConfig);
      config = initialConfig;
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching jersey config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// Handler POST para salvar a configuração
export async function POST(request: Request) {
  try {
    if (!configs) await init();

    const newConfig = await request.json();
    // Remove o _id do objeto para não tentar sobrescrevê-lo
    const { _id, ...configData } = newConfig;

    // `updateOne` com `upsert: true` irá atualizar o documento existente ou criar um novo se não existir.
    await configs.updateOne(
      {}, // Filtro vazio para pegar o único documento de config
      { $set: configData },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Configuration saved successfully', config: newConfig });
  } catch (error) {
    console.error('Error saving jersey config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
} 