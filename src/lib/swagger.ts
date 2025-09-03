import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jersey Generator AI - API Documentation',
      version: '1.0.0',
      description: `
## Jersey Generator AI - Complete API Documentation

### About
Jersey Generator AI is a comprehensive NFT platform for creating, minting, and trading digital jerseys and sports collectibles on the blockchain.

### Features
- 🎨 **AI-Powered Jersey Generation**: Create unique jersey designs using AI
- 🚀 **Launchpad System**: Deploy and manage NFT collections
- 💰 **Marketplace**: Buy, sell, and trade NFTs with integrated marketplace
- 🏟️ **Stadium & Badge Collections**: Multiple asset types support
- 🔗 **Blockchain Integration**: Powered by Thirdweb on Polygon Network
- 📱 **Multi-Chain Support**: Polygon Mainnet and Amoy Testnet

### Technologies
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Blockchain**: Thirdweb SDK v5, Polygon Network
- **Storage**: IPFS via Pinata
- **Authentication**: Web3 Wallet Connect

### Networks Supported
- **Polygon Amoy Testnet** (Chain ID: 80002) - Development
- **Polygon Mainnet** (Chain ID: 137) - Production
- **Chiliz Chain** (Chain ID: 88888) - Sports-focused chain

### Base URLs
- **Development**: http://localhost:3000
- **Production**: https://jersey-generator-ai2.vercel.app
      `,
      contact: {
        name: 'Jersey Generator AI Team',
        url: 'https://jersey-generator-ai2.vercel.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://jersey-generator-ai2.vercel.app',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        WalletAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-wallet-address',
          description: 'Ethereum wallet address for authentication',
        },
      },
      schemas: {
        // NFT Schemas
        NFT: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            tokenId: { type: 'string', description: 'Blockchain token ID' },
            name: { type: 'string', description: 'NFT name' },
            description: { type: 'string', description: 'NFT description' },
            imageUrl: { type: 'string', format: 'uri', description: 'IPFS image URL' },
            contractAddress: { type: 'string', description: 'Smart contract address' },
            owner: { type: 'string', description: 'Current owner wallet address' },
            creator: { type: 'string', description: 'Creator wallet address' },
            category: { 
              type: 'string', 
              enum: ['jersey', 'stadium', 'badge', 'launchpad'],
              description: 'NFT category'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Approved', 'Rejected', 'Minted'],
              description: 'NFT status'
            },
            attributes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trait_type: { type: 'string' },
                  value: { type: 'string' }
                }
              }
            },
            marketplace: {
              type: 'object',
              properties: {
                isListed: { type: 'boolean' },
                isAuction: { type: 'boolean' },
                price: { type: 'string' },
                currency: { type: 'string' },
                listingId: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Collection Schemas
        LaunchpadCollection: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            name: { type: 'string', description: 'Collection name' },
            description: { type: 'string', description: 'Collection description' },
            image: { type: 'string', format: 'uri', description: 'Collection image URL' },
            contractAddress: { type: 'string', description: 'Deployed contract address' },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'active', 'completed', 'cancelled'],
              description: 'Collection status'
            },
            totalSupply: { type: 'number', description: 'Maximum number of NFTs' },
            minted: { type: 'number', description: 'Number of NFTs minted' },
            priceInMatic: { type: 'number', description: 'Mint price in MATIC' },
            category: { type: 'string', description: 'Collection category' },
            creator: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                wallet: { type: 'string' }
              }
            },
            deployed: { type: 'boolean', description: 'Contract deployment status' },
            deployedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Marketplace Schemas
        MarketplaceListing: {
          type: 'object',
          properties: {
            listingId: { type: 'string', description: 'Marketplace listing ID' },
            tokenId: { type: 'string', description: 'Token ID being sold' },
            contractAddress: { type: 'string', description: 'NFT contract address' },
            seller: { type: 'string', description: 'Seller wallet address' },
            pricePerToken: { type: 'string', description: 'Price in wei' },
            currency: { type: 'string', description: 'Currency contract address' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            status: {
              type: 'string',
              enum: ['active', 'sold', 'cancelled', 'expired']
            }
          }
        },

        // Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', description: 'Error message' },
            code: { type: 'string', description: 'Error code' },
            details: { type: 'object', description: 'Additional error details' }
          }
        },

        // Pagination
        PaginationInfo: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Current page' },
            limit: { type: 'number', description: 'Items per page' },
            total: { type: 'number', description: 'Total items' },
            totalPages: { type: 'number', description: 'Total pages' }
          }
        }
      },
      
      responses: {
        Success: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - Invalid parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Marketplace',
        description: 'NFT marketplace operations - buy, sell, trade NFTs'
      },
      {
        name: 'Launchpad',
        description: 'Collection deployment and management system'
      },
      {
        name: 'NFTs',
        description: 'Individual NFT operations and metadata'
      },
      {
        name: 'Collections',
        description: 'NFT collection management'
      },
      {
        name: 'Users',
        description: 'User profiles and authentication'
      },
      {
        name: 'Upload',
        description: 'File upload and IPFS storage'
      },
      {
        name: 'Generation',
        description: 'AI-powered content generation'
      },
      {
        name: 'Engine',
        description: 'Thirdweb Engine integration'
      },
      {
        name: 'Debug',
        description: 'Development and debugging endpoints'
      }
    ]
  },
  apis: [
    './src/app/api/**/*.ts', // Path to the API files
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
