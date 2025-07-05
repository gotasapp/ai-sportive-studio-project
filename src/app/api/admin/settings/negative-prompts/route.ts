import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'settings';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    let settings = await collection.findOne({});
    
    if (!settings || !settings.contentFilters) {
      // Retornar configurações padrão se não existir
      const defaultConfig = {
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
      };
      
      return NextResponse.json({
        ...defaultConfig,
        allPrompts: [...defaultConfig.defaultPrompts, ...defaultConfig.customPrompts]
      });
    }

    return NextResponse.json({
      ...settings.contentFilters,
      allPrompts: [...(settings.contentFilters.defaultPrompts || []), ...(settings.contentFilters.customPrompts || [])]
    });

  } catch (error) {
    console.error('Error fetching content filters:', error);
    return NextResponse.json({ error: 'Failed to fetch content filters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, customPrompts, action, prompt } = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    let settings = await collection.findOne({});
    
    if (!settings) {
      const defaultSettings = {
        contentFilters: {
          enabled: true,
          defaultPrompts: [
            'sexual content', 'nudity', 'violence', 'weapons', 'drugs',
            'gore', 'hate speech', 'discriminatory content', 'illegal activities', 'harmful content'
          ],
          customPrompts: []
        }
      };
      await collection.insertOne(defaultSettings);
      settings = await collection.findOne({});
    }

    // Fallback de segurança caso settings ainda seja null
    if (!settings) {
      return NextResponse.json({ error: 'Failed to create or retrieve settings' }, { status: 500 });
    }

    if (!settings.contentFilters) {
      settings.contentFilters = {
        enabled: true,
        defaultPrompts: [
          'sexual content', 'nudity', 'violence', 'weapons', 'drugs',
          'gore', 'hate speech', 'discriminatory content', 'illegal activities', 'harmful content'
        ],
        customPrompts: []
      };
    }

    // Diferentes ações
    if (action === 'add' && prompt) {
      // Adicionar novo prompt personalizado
      const newCustomPrompts = [...(settings.contentFilters.customPrompts || [])];
      if (!newCustomPrompts.includes(prompt.toLowerCase().trim())) {
        newCustomPrompts.push(prompt.toLowerCase().trim());
      }
      settings.contentFilters.customPrompts = newCustomPrompts;
    } else if (action === 'remove' && prompt) {
      // Remover prompt personalizado
      settings.contentFilters.customPrompts = (settings.contentFilters.customPrompts || []).filter(
        p => p !== prompt.toLowerCase().trim()
      );
    } else if (action === 'toggle') {
      // Toggle enabled/disabled
      settings.contentFilters.enabled = !settings.contentFilters.enabled;
    } else {
      // Atualização geral
      if (enabled !== undefined) settings.contentFilters.enabled = enabled;
      if (customPrompts !== undefined) settings.contentFilters.customPrompts = customPrompts;
    }

    await collection.updateOne(
      {},
      { $set: settings },
      { upsert: true }
    );

    console.log(`✅ Content filters updated: enabled=${settings.contentFilters.enabled}, total prompts=${(settings.contentFilters.defaultPrompts || []).length + (settings.contentFilters.customPrompts || []).length}`);

    return NextResponse.json({
      success: true,
      message: 'Content filters updated successfully',
      settings: {
        enabled: settings.contentFilters.enabled,
        defaultPrompts: settings.contentFilters.defaultPrompts || [],
        customPrompts: settings.contentFilters.customPrompts || [],
        allPrompts: [...(settings.contentFilters.defaultPrompts || []), ...(settings.contentFilters.customPrompts || [])]
      }
    });

  } catch (error) {
    console.error('Error updating content filters:', error);
    return NextResponse.json({ error: 'Failed to update content filters' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const settings = await collection.findOne({});
    
    if (!settings || !settings.contentFilters) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Remover apenas de customPrompts (não dos padrão)
    settings.contentFilters.customPrompts = (settings.contentFilters.customPrompts || []).filter(
      p => p !== prompt.toLowerCase().trim()
    );

    await collection.updateOne(
      {},
      { $set: settings },
      { upsert: true }
    );

    console.log(`✅ Removed content filter: ${prompt}`);

    return NextResponse.json({
      success: true,
      message: 'Content filter removed successfully'
    });

  } catch (error) {
    console.error('Error removing content filter:', error);
    return NextResponse.json({ error: 'Failed to remove content filter' }, { status: 500 });
  }
} 