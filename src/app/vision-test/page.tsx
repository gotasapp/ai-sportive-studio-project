'use client'

import { useState, useRef } from 'react'

export default function VisionTestPage() {
  const [image, setImage] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [selectedSport, setSelectedSport] = useState('soccer')
  const [selectedView, setSelectedView] = useState('back')
  
  // PROMPTS JSON ESTRUTURADOS ORIGINAIS QUE FUNCIONAVAM PERFEITAMENTE
  const ORIGINAL_JSON_PROMPTS = {
    "soccer": {
      "back": `You are a specialist in technical design of sports uniforms. Analyze the image of a soccer jersey (back view). Describe with maximum precision all visual elements present.

Include:

1. Main, secondary and detail colors (with names and hex codes if possible)
2. Visual pattern: stripes (diagonal, horizontal, vertical), bands, crosses, gradients, symbols
3. Name and number (if present): position, font, color, outline, embedded symbols
4. Collar: shape (round, V-neck, polo), color, finish
5. Sleeves: main color, presence of contrasting cuffs or bands
6. Logos, texts or badges: location, relative size, style
7. Fabric and texture: mesh, shine, apparent stitching
8. Any other important visual detail that influences the design

Be direct, technical and based only on what is visibly present. Do not invent. Use bullet point structure.`,

      "front": `You are an expert image analyst specializing in soccer jersey color and pattern analysis. Analyze this soccer jersey front view image with EXTREME precision.

CRITICAL INSTRUCTIONS:
1. Extract EXACT colors using descriptive color names AND hex codes if possible
2. Identify ALL patterns, stripes, gradients, or design elements
3. Note logo placements, sponsor locations, and design details
4. Focus on elements needed for FAITHFUL visual reproduction

Return ONLY a valid JSON object with this EXACT structure:

{
  "dominantColors": {
    "primary": "exact primary jersey color (e.g., '#FFFFFF' or 'pure white')",
    "secondary": "exact secondary color (e.g., '#000000' or 'black')", 
    "accent": "exact accent/trim color (e.g., '#FF0000' or 'bright red')",
    "colorDescription": "detailed color analysis (e.g., 'bright golden yellow with deep blue accents')"
  },
  "visualPattern": {
    "type": "solid|horizontal_stripes|vertical_stripes|diagonal_stripes|geometric|gradient|checkered|mixed",
    "description": "detailed pattern description with measurements if visible",
    "patternColors": ["list", "of", "pattern", "colors"],
    "patternWidth": "stripe width or pattern scale description"
  },
  "teamElements": {
    "teamBadge": "detailed badge description: position, shape, colors, size",
    "sponsor": "sponsor logo description: brand, position, colors, style",
    "teamName": "any team text visible on front",
    "additionalLogos": "any other logos or emblems visible"
  },
  "fabricAndTexture": {
    "material": "fabric type visible (mesh, synthetic, cotton, technical)",
    "finish": "surface finish (matte, glossy, textured, smooth)",
    "quality": "professional, replica, vintage, or casual grade"
  },
  "designElements": {
    "neckline": "collar type and colors (crew, v-neck, polo with trim details)",
    "sleeves": "sleeve design, length, cuff colors and style",
    "frontDesign": "unique front design elements and their exact placement",
    "logoPlacement": "precise positioning of all logos and badges"
  },
  "styleCategory": "modern|classic|retro|vintage|urban|premium",
  "keyVisualFeatures": "the 3-5 most distinctive visual elements that make this jersey unique",
  "reproductionNotes": "critical specific details needed for identical visual reproduction"
}

FOCUS AREAS:
- Exact color identification (use color names like 'royal blue', 'forest green', 'golden yellow')
- Pattern details (stripe widths, angles, spacing)
- Logo and badge exact positioning
- Collar and sleeve trim details
- Any unique design elements

Remember: This analysis will be used to generate an IDENTICAL jersey. Be as specific as possible about colors and visual elements.`
    },
    
    "basketball": {
      "back": `You are an expert basketball jersey analyst. Analyze this basketball jersey back view with EXTREME precision.

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact primary color",
    "secondary": "exact secondary color",
    "accent": "exact accent color",
    "colorDescription": "detailed basketball jersey color analysis"
  },
  "visualPattern": {
    "type": "solid|side_panels|geometric|mixed",
    "description": "back view pattern details",
    "patternColors": ["color1", "color2"],
    "sidePanelContinuation": "how side panels continue on back"
  },
  "playerArea": {
    "namePosition": "name placement on basketball jersey back",
    "nameFont": "basketball name font style",
    "nameColor": "name text exact color",
    "numberPosition": "number placement and sizing",
    "numberFont": "basketball number font and proportions",
    "numberColor": "number exact color",
    "nameNumberLayout": "layout relationship for basketball standard"
  },
  "designElements": {
    "armholes": "armhole design from back view",
    "backCut": "basketball jersey back cut and fit",
    "sidePanels": "side panel design continuation",
    "backDesign": "unique back elements beyond name/number"
  },
  "styleCategory": "modern|classic|retro|throwback|statement",
  "keyVisualFeatures": "distinctive basketball back elements",
  "reproductionNotes": "critical basketball jersey reproduction details"
}`,

      "front": `You are an expert image analyst for basketball jerseys. Analyze this basketball jersey front view with EXTREME precision for faithful reproduction.

CRITICAL INSTRUCTIONS:
1. Basketball jerseys have unique cuts, armholes, and proportions
2. Extract EXACT colors and team design elements
3. Identify side panels, mesh areas, and basketball-specific features
4. Focus on elements crucial for authentic reproduction

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "main jersey color (exact name/hex)",
    "secondary": "secondary color (exact name/hex)",
    "accent": "accent/trim color (exact name/hex)",
    "colorDescription": "comprehensive basketball jersey color analysis"
  },
  "visualPattern": {
    "type": "solid|side_panels|geometric|gradient|striped|mixed",
    "description": "basketball-specific pattern details",
    "patternColors": ["pattern", "colors", "list"],
    "sidePanelDetails": "side panel colors and design if present"
  },
  "teamElements": {
    "teamLogo": "team logo details: position, size, colors, style",
    "teamName": "team name placement and styling across front",
    "frontNumber": "front number style, size, and positioning if visible",
    "cityName": "city name if visible on front"
  },
  "fabricAndTexture": {
    "material": "basketball fabric type (mesh, performance, technical)",
    "finish": "surface finish and texture",
    "breathability": "mesh areas and ventilation zones visible"
  },
  "designElements": {
    "armholes": "basketball armhole design and sizing",
    "neckline": "neckline style and trim details",
    "sidePanels": "side panel design, colors, and integration",
    "frontCut": "jersey cut style (loose, fitted, traditional)"
  },
  "styleCategory": "modern|classic|retro|throwback|statement",
  "keyVisualFeatures": "distinctive basketball jersey elements",
  "reproductionNotes": "critical details for authentic basketball jersey reproduction"
}`
    },
    
    "nfl": {
      "back": `You are an expert NFL jersey analyst. Analyze this NFL jersey back view with EXTREME precision.

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact primary color",
    "secondary": "exact secondary color",
    "accent": "exact accent color",
    "colorDescription": "NFL jersey color scheme analysis"
  },
  "visualPattern": {
    "type": "solid|shoulder_stripes|side_panels|mixed",
    "description": "back view pattern details",
    "patternColors": ["color1", "color2", "color3"],
    "shoulderContinuation": "how shoulder design continues on back"
  },
  "playerArea": {
    "namePosition": "NFL name placement standards",
    "nameFont": "NFL name font specifications",
    "nameColor": "name text color",
    "numberPosition": "NFL number placement",
    "numberFont": "NFL number font and proportions",
    "numberColor": "number color",
    "nameNumberSpacing": "NFL standard spacing"
  },
  "designElements": {
    "shoulderPads": "back shoulder design for equipment",
    "backCut": "NFL jersey back construction",
    "shoulderStripes": "shoulder stripe continuation",
    "backDesign": "unique NFL back elements"
  },
  "styleCategory": "modern|classic|throwback|alternate",
  "keyVisualFeatures": "distinctive NFL back elements",
  "reproductionNotes": "critical NFL reproduction specifications"
}`,

      "front": `You are an expert NFL jersey analyst. Analyze this NFL jersey front view with EXTREME precision.

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact NFL team primary color",
    "secondary": "exact secondary color", 
    "accent": "exact accent color",
    "colorDescription": "detailed NFL team color analysis"
  },
  "visualPattern": {
    "type": "solid|shoulder_stripes|side_panels|two_tone|mixed",
    "description": "NFL-specific pattern description",
    "patternColors": ["color1", "color2", "color3"],
    "shoulderDesign": "shoulder stripe or design details"
  },
  "teamElements": {
    "teamLogo": "team logo details and positioning",
    "frontNumber": "front number if visible",
    "teamName": "team text on front",
    "nflBadge": "NFL shield or official badges"
  },
  "fabricAndTexture": {
    "material": "NFL jersey fabric type",
    "finish": "surface texture",
    "durability": "fabric weight and construction quality"
  },
  "designElements": {
    "shoulderPads": "shoulder area design for padding compatibility",
    "neckline": "NFL collar style and construction",
    "sleeves": "sleeve design, length, and team details",
    "frontCut": "NFL jersey front cut and fit"
  },
  "styleCategory": "modern|classic|throwback|alternate",
  "keyVisualFeatures": "distinctive NFL jersey elements", 
  "reproductionNotes": "critical NFL jersey reproduction details"
}`
    }
  }

  const getCurrentAnalysisPrompt = () => {
    return (ORIGINAL_JSON_PROMPTS as any)[selectedSport][selectedView]
  }

  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [playerNumber, setPlayerNumber] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCompleteFlow, setIsCompleteFlow] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setImageBlob(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setError('')
    
    // Clear previous results when new image is uploaded
    setAnalysisResult(null)
    setGenerationPrompt('')
    setGeneratedImage(null)
  }

  const analyzeImage = async () => {
    if (!imageBlob) {
      setError('Please upload an image first')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.readAsDataURL(imageBlob)
      })

      console.log('🔍 [VISION-TEST ORIGINAL] Starting analysis with STRUCTURED JSON prompts...')
      console.log('📋 Sport:', selectedSport, 'View:', selectedView)
      
      const analysisPrompt = getCurrentAnalysisPrompt()
      
      const response = await fetch('/api/vision-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64,
          prompt: analysisPrompt,
          model: 'openai/gpt-4o-mini'
        }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      console.log('✅ [VISION-TEST ORIGINAL] Analysis completed:', result)
      
      // Try to parse JSON result
      let finalAnalysis = result.analysis
      try {
        if (typeof result.analysis === 'string') {
          // Clean up markdown formatting if present
          let cleanAnalysis = result.analysis
          if (cleanAnalysis.includes('```json')) {
            cleanAnalysis = cleanAnalysis.replace(/```json\n?/g, '').replace(/```/g, '').trim()
          }
          finalAnalysis = JSON.parse(cleanAnalysis)
        }
        console.log('🎯 [VISION-TEST ORIGINAL] Parsed JSON analysis:', finalAnalysis)
      } catch (parseError) {
        console.log('⚠️ [VISION-TEST ORIGINAL] Using raw text analysis:', parseError)
      }
      
      setAnalysisResult(finalAnalysis)
      
      // Auto-generate a ORIGINAL vision-test style prompt
      const playerInfo = (playerName || playerNumber) 
        ? `Player name "${playerName || 'PLAYER'}" number "${playerNumber || '00'}" ` 
        : ''
      
      // ORIGINAL APPROACH: Simple base + analysis
      const basePrompt = `A professional ${selectedSport} jersey ${selectedView} view, centered composition. ${playerInfo}Clean background, high-resolution quality, professional lighting.`
      
      // Extract color information if JSON parsed successfully
      let colorInfo = ''
      if (typeof finalAnalysis === 'object' && finalAnalysis.dominantColors) {
        const colors = finalAnalysis.dominantColors
        colorInfo = `Colors: ${colors.primary || 'primary'}, ${colors.secondary || 'secondary'}, ${colors.accent || 'accent'}. `
      }
      
      setGenerationPrompt(`${basePrompt}

${colorInfo}Design based on analysis: ${typeof finalAnalysis === 'object' ? JSON.stringify(finalAnalysis) : finalAnalysis}`)

    } catch (error: any) {
      console.error('❌ [VISION-TEST ORIGINAL] Analysis error:', error)
      setError(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateImage = async () => {
    if (!generationPrompt) {
      setError('Please analyze an image first to generate the prompt')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      console.log('🎨 [VISION-TEST ORIGINAL] Starting generation with structured analysis...')
      
      const response = await fetch('/api/vision-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generationPrompt,
          quality: 'standard'
        }),
      })

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed')
      }

      console.log('✅ [VISION-TEST ORIGINAL] Generation completed:', result)
      setGeneratedImage(result.image_url)

    } catch (error: any) {
      console.error('❌ [VISION-TEST ORIGINAL] Generation error:', error)
      setError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // NEW FUNCTION: Complete Vision Flow - tests our endpoint /complete-vision-flow
  const runCompleteVisionFlow = async () => {
    if (!imageBlob) {
      setError('Please upload an image first')
      return
    }

    setIsCompleteFlow(true)
    setError('')
    setAnalysisResult(null)
    setGenerationPrompt('')
    setGeneratedImage(null)

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.readAsDataURL(imageBlob)
      })

      console.log('🚀 [COMPLETE-VISION-FLOW] Iniciando fluxo completo: análise → prompt → geração...')
      console.log('📋 Sport:', selectedSport, 'View:', selectedView)
      console.log('👤 Player Info:')
      console.log('  - Name input value:', `"${playerName}"`)
      console.log('  - Number input value:', `"${playerNumber}"`)
      console.log('  - Name length:', playerName.length)
      console.log('  - Number length:', playerNumber.length)
      
      // Preparar dados para o endpoint
      const requestData = {
        image_base64: base64,
        sport: selectedSport,
        view: selectedView,
        player_name: playerName || undefined,
        player_number: playerNumber || undefined,
        quality: 'hd'
      }
      
      console.log('📦 Request data being sent:')
      console.log('  - player_name:', `"${requestData.player_name}"`)
      console.log('  - player_number:', `"${requestData.player_number}"`)
      console.log('  - sport:', requestData.sport)
      console.log('  - view:', requestData.view)

      // Chamar nosso novo endpoint /complete-vision-flow
      const response = await fetch('http://localhost:8000/complete-vision-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Complete flow failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Complete vision flow failed')
      }

      console.log('✅ [COMPLETE-VISION-FLOW] Fluxo completo realizado com sucesso!', result)
      
      // Atualizar estados com os resultados
      setAnalysisResult(result.analysis || 'Análise textual completada')
      setGenerationPrompt(result.prompt || 'Prompt gerado automaticamente')
      setGeneratedImage(result.image_url || null)

      // Log dos resultados detalhados
      console.log('📝 Analysis:', result.analysis)
      console.log('💭 Prompt used:', result.prompt)
      console.log('🖼️ Image URL:', result.image_url)
      console.log('👤 Player data used in backend:')
      console.log('  - Name used:', `"${result.player_name_used}"`)
      console.log('  - Number used:', `"${result.player_number_used}"`)

    } catch (error: any) {
      console.error('❌ [COMPLETE-VISION-FLOW] Erro no fluxo completo:', error)
      setError(`Erro no fluxo completo: ${error.message}`)
    } finally {
      setIsCompleteFlow(false)
    }
  }

  const clearAll = () => {
    setImage(null)
    setImageBlob(null)
    setAnalysisResult(null)
    setGenerationPrompt('')
    setGeneratedImage(null)
    setPlayerName('')
    setPlayerNumber('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 Vision Test Lab (ENHANCED)</h1>
          <p className="text-gray-400">Professional technical analysis prompts for precise jersey reproduction</p>
          <div className="mt-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg inline-block">
            <p className="text-blue-300 text-sm">✅ Using ENHANCED descriptive prompts with technical production details</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Input */}
          <div className="space-y-6">
            
            {/* Sport & View Selection */}
            <div className="bg-black/40 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">🏆 Sport & View</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                  >
                    <option value="soccer">⚽ Soccer</option>
                    <option value="basketball">🏀 Basketball</option>
                    <option value="nfl">🏈 NFL</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">View</label>
                  <select
                    value={selectedView}
                    onChange={(e) => setSelectedView(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                  >
                    <option value="front">🔍 Front View</option>
                    <option value="back">🔍 Back View</option>
                  </select>
                </div>
              </div>
              
              <div className="p-3 bg-blue-800/50 rounded border border-blue-600">
                <p className="text-xs text-blue-200">
                  <strong>🎯 ENHANCED Descriptive Prompt:</strong> Technical analysis with bullet-point structure and production details
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-black/40 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">📤 Upload Image</h2>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
              />
              
              {image && (
                <div className="mt-4">
                  <img 
                    src={image} 
                    alt="Uploaded" 
                    className="w-full max-w-xs rounded-lg border border-gray-600"
                  />
                </div>
              )}
            </div>

            {/* Player Information */}
            <div className="bg-black/40 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">👤 Player Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="SILVA"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Player Number
                  </label>
                  <input
                    type="text"
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value)}
                    placeholder="10"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg"
                  />
                </div>
              </div>
              
              {(playerName || playerNumber) && (
                <div className="mt-3 p-2 bg-gray-800 rounded">
                  <p className="text-sm text-gray-300">
                    Preview: <span className="text-white font-medium">
                      {playerName || 'PLAYER'} #{playerNumber || '00'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* STEP 1: ANALYSIS */}
            <div className="bg-black/40 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">
                🔍 STEP 1: Analysis 
                {analysisResult && <span className="text-green-400 ml-2">✅ COMPLETED</span>}
              </h2>
              
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing || !image}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                {isAnalyzing ? '🔄 Analyzing with Enhanced Prompts...' : '🔍 Analyze with Enhanced Technical Prompts'}
              </button>
              
              <p className="text-xs text-blue-400 mt-2">
                ✨ Enhanced technical analysis with bullet-point structure for precise reproduction
              </p>
            </div>

            {/* STEP 2: GENERATION */}
            <div className="bg-black/40 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">
                🎨 STEP 2: Generation 
                {!analysisResult && <span className="text-yellow-400 ml-2">⏳ Waiting for Analysis</span>}
                {generatedImage && <span className="text-green-400 ml-2">✅ COMPLETED</span>}
              </h2>
              
              {generationPrompt && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Generation Prompt (Editable)</label>
                  <textarea
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg resize-none text-sm"
                  />
                </div>
              )}
              
              <button
                onClick={generateImage}
                disabled={isGenerating || !analysisResult || !generationPrompt}
                className="w-full p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                {isGenerating ? '🔄 Generating Identical Reproduction...' : '🎨 Generate with Original Flow'}
              </button>
            </div>

            {/* NOVO: Complete Vision Flow Button */}
            <div className="bg-black/40 rounded-lg p-6 border border-yellow-500">
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">
                ⚡ NOVO: Complete Vision Flow 
                {generatedImage && <span className="text-green-400 ml-2">✅ COMPLETED</span>}
              </h2>
              
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded">
                <p className="text-yellow-300 text-sm">
                  🚀 <strong>Teste nosso novo endpoint:</strong> Upload → Análise → Prompt → Geração em UMA única chamada!
                </p>
                <p className="text-yellow-200 text-xs mt-1">
                  Endpoint: <code className="bg-black/50 px-1">/complete-vision-flow</code> - Análise textual flexível + DALL-E 3 HD
                </p>
              </div>
              
              <button
                onClick={runCompleteVisionFlow}
                disabled={isCompleteFlow || !image}
                className="w-full p-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors text-white"
              >
                {isCompleteFlow ? '🔄 Executando Fluxo Completo (Análise + Geração)...' : '⚡ TESTAR Complete Vision Flow'}
              </button>
              
              <p className="text-xs text-yellow-400 mt-2">
                🎯 Testa: análise descritiva → prompt otimizado → DALL-E 3 HD diretamente!
              </p>
            </div>

            {/* Clear Button */}
            <button
              onClick={clearAll}
              className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              🗑️ Clear All & Start Over
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            
            {/* Analysis Result */}
            <div className="bg-black/40 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">📋 Technical Analysis Results</h2>
              
              {analysisResult ? (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <pre className="text-sm text-green-300 whitespace-pre-wrap">
                    {typeof analysisResult === 'object' 
                      ? JSON.stringify(analysisResult, null, 2)
                      : analysisResult
                    }
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">Upload image and click &ldquo;Analyze with Enhanced Technical Prompts&rdquo;</p>
                  <p className="text-xs text-blue-400 mt-2">🎯 Technical analysis extracts colors, patterns, logos, and production details</p>
                </div>
              )}
            </div>

            {/* Generated Image */}
            <div className="bg-black/40 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">🖼️ Generated Reproduction</h2>
              
              {generatedImage ? (
                <div className="space-y-4">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full rounded-lg border border-gray-600"
                  />
                  <a 
                    href={generatedImage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                  >
                    🔗 Open Full Size
                  </a>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">Complete structured analysis first, then generate</p>
                  <p className="text-xs text-green-400 mt-2">🎨 Original workflow produces identical reproductions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status do Fluxo Atual */}
        {isCompleteFlow && (
          <div className="mt-8 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">⚡ COMPLETE VISION FLOW EM EXECUÇÃO</h3>
              <div className="flex justify-center items-center space-x-4 text-sm">
                <span className="text-yellow-300">🔍 Analisando imagem...</span>
                <span className="text-yellow-300">💭 Gerando prompt otimizado...</span>
                <span className="text-yellow-300">🎨 Criando com DALL-E 3 HD...</span>
              </div>
              <div className="mt-3 bg-black/50 rounded p-2">
                <p className="text-yellow-200 text-xs">
                  <strong>Endpoint:</strong> http://localhost:8000/complete-vision-flow
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-blue-300">Vision Test Lab - ORIGINAL SYSTEM RESTORED with structured JSON prompts</p>
          <p className="text-xs mt-1">
            🔄 Flow Original: Upload → JSON Analysis → Structured Data → Perfect Reproduction
          </p>
          <p className="text-xs mt-1 text-yellow-400">
            ⚡ NOVO: Complete Vision Flow → Análise descritiva → Prompt otimizado → DALL-E 3 HD
          </p>
        </div>
      </div>
    </div>
  )
} 