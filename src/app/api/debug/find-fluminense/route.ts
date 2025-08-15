import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar por "2003 team Jersey" em todas as tabelas
    const searchQuery = { description: { $regex: "2003 team Jersey", $options: "i" } };
    const searchQuery2 = { prompt: { $regex: "2003 team Jersey", $options: "i" } };
    const searchQuery3 = { name: { $regex: "Fluminense", $options: "i" } };
    
    // Buscar em launchpad_collections
    const launchpadCollections = await db.collection('launchpad_collections').find({
      $or: [searchQuery, searchQuery2, searchQuery3]
    }).toArray();
    
    // Buscar em collections (legacy)
    const collections = await db.collection('collections').find({
      $or: [searchQuery, searchQuery2, searchQuery3]
    }).toArray();
    
    // Buscar em approved_images
    const approvedImages = await db.collection('approved_images').find({
      $or: [searchQuery, searchQuery2, searchQuery3]
    }).toArray();
    
    // Buscar em generated_images
    const generatedImages = await db.collection('generated_images').find({
      $or: [searchQuery, searchQuery2, searchQuery3]
    }).toArray();

    return NextResponse.json({
      success: true,
      searchTerm: "2003 team Jersey / Fluminense",
      results: {
        launchpadCollections: launchpadCollections.map(c => ({
          _id: c._id,
          name: c.name,
          description: c.description,
          contractAddress: c.contractAddress,
          status: c.status,
          table: 'launchpad_collections'
        })),
        collections: collections.map(c => ({
          _id: c._id,
          name: c.name,
          description: c.description,
          contractAddress: c.contractAddress,
          status: c.status,
          table: 'collections'
        })),
        approvedImages: approvedImages.map(c => ({
          _id: c._id,
          prompt: c.prompt,
          status: c.status,
          imageUrl: c.imageUrl,
          table: 'approved_images'
        })),
        generatedImages: generatedImages.map(c => ({
          _id: c._id,
          prompt: c.prompt,
          status: c.status,
          imageUrl: c.imageUrl,
          table: 'generated_images'
        }))
      },
      totalFound: launchpadCollections.length + collections.length + approvedImages.length + generatedImages.length
    });

  } catch (error: any) {
    console.error('❌ Error finding Fluminense:', error);
    return NextResponse.json({
      error: error.message || 'Search failed'
    }, { status: 500 });
  }
}
