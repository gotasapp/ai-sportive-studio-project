# AI Football Jersey Generator

Generate unique football jerseys using AI and Stable Diffusion. This application allows you to create custom football jerseys by selecting a team, customizing the style, view, material, and adding player details.

## Features

- Team selection from a database of football teams
- Customization options for jersey style, view, and material
- Player name and number customization
- Sponsor logo support
- Real-time jersey preview
- Reference jersey search using TheSportsDB API
- AI-powered image generation using Stable Diffusion

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Replicate API (Stable Diffusion)
- TheSportsDB API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Replicate API token
- TheSportsDB API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-jersey-generator.git
cd ai-jersey-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your API keys:
```
NEXT_PUBLIC_REPLICATE_API_TOKEN=your_replicate_api_token_here
NEXT_PUBLIC_SPORTSDB_API_KEY=your_sportsdb_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Select a team from the dropdown menu
2. Customize the jersey:
   - Choose a style (Classic, Modern, or Retro)
   - Select a view (Front, Back, or Full)
   - Pick a material (Cotton, Polyester, or Mesh)
   - Add a sponsor name (optional)
   - Enter player name and number (optional)
3. Click "Generate Jersey" to create your custom jersey
4. View the generated jersey and reference jerseys below

## Project Structure

```
src/
  ├── app/                 # Next.js app directory
  │   ├── page.tsx        # Main page component
  │   ├── layout.tsx      # Root layout
  │   └── globals.css     # Global styles
  ├── components/         # React components
  │   └── JerseyEditor.tsx # Main jersey editor component
  ├── lib/               # Utility functions and services
  │   ├── teams-database.ts    # Team data
  │   ├── jersey-search-service.ts # TheSportsDB API integration
  │   ├── prompt-engine.ts     # Prompt generation
  │   └── services/           # External service integrations
  │       └── stable-diffusion-service.ts # Replicate API integration
  └── types/             # TypeScript type definitions
      └── index.ts       # Shared types
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
