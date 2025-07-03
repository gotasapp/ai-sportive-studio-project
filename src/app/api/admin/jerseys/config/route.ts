import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// O caminho para nosso "banco de dados" JSON
const dbPath = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'jerseys', 'config', 'db.json');

// Dados iniciais caso o db.json não exista
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

// Função para ler os dados do DB
async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Se o arquivo não existe, cria com os dados iniciais
    await fs.writeFile(dbPath, JSON.stringify(initialConfig, null, 2));
    return initialConfig;
  }
}

// Função para escrever os dados no DB
async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Handler GET para buscar a configuração
export async function GET() {
  try {
    const config = await readDb();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching jersey config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// Handler POST para salvar a configuração
export async function POST(request: Request) {
  try {
    const newConfig = await request.json();
    await writeDb(newConfig);
    return NextResponse.json({ message: 'Configuration saved successfully', config: newConfig });
  } catch (error) {
    console.error('Error saving jersey config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
} 