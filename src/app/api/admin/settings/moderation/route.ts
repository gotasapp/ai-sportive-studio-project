import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'settings';

// Configuração padrão
const DEFAULT_MODERATION_SETTING = {
  configType: 'moderation_config',
  moderationEnabled: false, // Por padrão desabilitado
  autoApprove: true,
  updatedAt: new Date()
};

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    let setting = await collection.findOne({ configType: 'moderation_config' });
    
    if (!setting) {
      // Criar configuração padrão se não existir
      await collection.insertOne(DEFAULT_MODERATION_SETTING);
      setting = DEFAULT_MODERATION_SETTING;
    }

    return NextResponse.json({
      moderationEnabled: setting.moderationEnabled,
      autoApprove: setting.autoApprove
    });

  } catch (error) {
    console.error('Error fetching moderation settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { moderationEnabled, autoApprove } = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const updatedSetting = {
      configType: 'moderation_config',
      moderationEnabled: moderationEnabled ?? false,
      autoApprove: autoApprove ?? true,
      updatedAt: new Date()
    };

    await collection.replaceOne(
      { configType: 'moderation_config' },
      updatedSetting,
      { upsert: true }
    );

    console.log(`✅ Moderation settings updated: moderationEnabled=${moderationEnabled}, autoApprove=${autoApprove}`);

    return NextResponse.json({
      success: true,
      message: 'Moderation settings updated',
      settings: {
        moderationEnabled: updatedSetting.moderationEnabled,
        autoApprove: updatedSetting.autoApprove
      }
    });

  } catch (error) {
    console.error('Error updating moderation settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 