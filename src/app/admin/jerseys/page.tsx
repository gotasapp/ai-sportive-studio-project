'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Save,
  RotateCcw,
  Eye,
  Plus,
  X,
  Shirt,
  Palette,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

// Mock data - em produção virá de APIs/banco
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
}

export default function JerseysConfig() {
  const [config, setConfig] = useState(initialConfig)
  const [newNegativePrompt, setNewNegativePrompt] = useState("")
  const [activeTeam, setActiveTeam] = useState("flamengo")
  const [previewPrompt, setPreviewPrompt] = useState("")

  // Generate preview prompt
  const generatePreviewPrompt = () => {
    const team = config.teamTemplates[activeTeam as keyof typeof config.teamTemplates]
    const fullPrompt = `${config.basePrompt}, ${team.context}, ${team.elements.join(', ')}, ${config.suffixPrompt}`
    const negatives = Object.values(config.negativePrompts).flat().join(', ')
    setPreviewPrompt(`PROMPT: ${fullPrompt}\n\nNEGATIVE: ${negatives}`)
  }

  // Add negative prompt
  const addNegativePrompt = (category: keyof typeof config.negativePrompts) => {
    if (newNegativePrompt.trim()) {
      setConfig(prev => ({
        ...prev,
        negativePrompts: {
          ...prev.negativePrompts,
          [category]: [...prev.negativePrompts[category], newNegativePrompt.trim()]
        }
      }))
      setNewNegativePrompt("")
    }
  }

  // Remove negative prompt
  const removeNegativePrompt = (category: keyof typeof config.negativePrompts, index: number) => {
    setConfig(prev => ({
      ...prev,
      negativePrompts: {
        ...prev.negativePrompts,
        [category]: prev.negativePrompts[category].filter((_, i) => i !== index)
      }
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Jersey Configuration</h1>
          <p className="text-gray-400 mt-2">AI prompt engineering and generation settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Shirt className="w-3 h-3 mr-1" />
            Jersey Engine
          </Badge>
          <Button variant="outline" className="border-cyan-500/30">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button className="cyber-button">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="prompts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 cyber-card border-cyan-500/30">
          <TabsTrigger value="prompts" className="data-[state=active]:bg-cyan-500/20">
            Prompt Engineering
          </TabsTrigger>
          <TabsTrigger value="negatives" className="data-[state=active]:bg-cyan-500/20">
            Negative Prompts
          </TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-cyan-500/20">
            Team Templates
          </TabsTrigger>
          <TabsTrigger value="parameters" className="data-[state=active]:bg-cyan-500/20">
            Parameters
          </TabsTrigger>
        </TabsList>

        {/* Prompt Engineering Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Base Prompt */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <span>Base Prompt</span>
                </CardTitle>
                <CardDescription>
                  Core prompt that applies to all jersey generations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={config.basePrompt}
                  onChange={(e) => setConfig(prev => ({ ...prev, basePrompt: e.target.value }))}
                  className="cyber-input min-h-24 resize-none"
                  placeholder="Enter base prompt for jersey generation..."
                />
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Length: {config.basePrompt.length} characters</span>
                </div>
              </CardContent>
            </Card>

            {/* Suffix Prompt */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  <span>Suffix Prompt</span>
                </CardTitle>
                <CardDescription>
                  Quality and style modifiers added to the end
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={config.suffixPrompt}
                  onChange={(e) => setConfig(prev => ({ ...prev, suffixPrompt: e.target.value }))}
                  className="cyber-input min-h-24 resize-none"
                  placeholder="Enter suffix prompt for quality and style..."
                />
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Length: {config.suffixPrompt.length} characters</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  <span>Prompt Preview</span>
                </div>
                <Button onClick={generatePreviewPrompt} size="sm" className="cyber-button">
                  Generate Preview
                </Button>
              </CardTitle>
              <CardDescription>
                See how the final prompt will look for team: {activeTeam}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={previewPrompt}
                readOnly
                className="cyber-input min-h-32 resize-none font-mono text-sm"
                placeholder="Click 'Generate Preview' to see the final prompt..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Negative Prompts Tab */}
        <TabsContent value="negatives" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Global Negatives */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-sm">Global Negatives</CardTitle>
                <CardDescription className="text-xs">
                  Applied to all generations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newNegativePrompt}
                    onChange={(e) => setNewNegativePrompt(e.target.value)}
                    placeholder="Add negative prompt..."
                    className="cyber-input flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addNegativePrompt('global')}
                  />
                  <Button
                    onClick={() => addNegativePrompt('global')}
                    size="sm"
                    className="cyber-button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {config.negativePrompts.global.map((prompt, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center justify-between w-full border-red-500/30 text-red-400"
                    >
                      <span className="text-xs">{prompt}</span>
                      <Button
                        onClick={() => removeNegativePrompt('global', index)}
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-2 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Style Negatives */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-sm">Style Negatives</CardTitle>
                <CardDescription className="text-xs">
                  Style-specific exclusions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newNegativePrompt}
                    onChange={(e) => setNewNegativePrompt(e.target.value)}
                    placeholder="Add style negative..."
                    className="cyber-input flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addNegativePrompt('style')}
                  />
                  <Button
                    onClick={() => addNegativePrompt('style')}
                    size="sm"
                    className="cyber-button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {config.negativePrompts.style.map((prompt, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center justify-between w-full border-yellow-500/30 text-yellow-400"
                    >
                      <span className="text-xs">{prompt}</span>
                      <Button
                        onClick={() => removeNegativePrompt('style', index)}
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-2 hover:text-yellow-300"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Negatives */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-sm">Quality Negatives</CardTitle>
                <CardDescription className="text-xs">
                  Quality control exclusions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newNegativePrompt}
                    onChange={(e) => setNewNegativePrompt(e.target.value)}
                    placeholder="Add quality negative..."
                    className="cyber-input flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addNegativePrompt('quality')}
                  />
                  <Button
                    onClick={() => addNegativePrompt('quality')}
                    size="sm"
                    className="cyber-button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {config.negativePrompts.quality.map((prompt, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center justify-between w-full border-orange-500/30 text-orange-400"
                    >
                      <span className="text-xs">{prompt}</span>
                      <Button
                        onClick={() => removeNegativePrompt('quality', index)}
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-2 hover:text-orange-300"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Templates Tab */}
        <TabsContent value="teams" className="space-y-6">
          <div className="flex space-x-4 mb-6">
            {Object.keys(config.teamTemplates).map((team) => (
              <Button
                key={team}
                onClick={() => setActiveTeam(team)}
                variant={activeTeam === team ? "default" : "outline"}
                className={activeTeam === team ? "cyber-button" : "border-cyan-500/30"}
              >
                {team.charAt(0).toUpperCase() + team.slice(1)}
              </Button>
            ))}
          </div>

          {activeTeam && (
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-cyan-400" />
                  <span>{activeTeam.charAt(0).toUpperCase() + activeTeam.slice(1)} Template</span>
                </CardTitle>
                <CardDescription>
                  Team-specific configuration and context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-200">Team Colors</Label>
                      <div className="flex space-x-2 mt-2">
                        {config.teamTemplates[activeTeam as keyof typeof config.teamTemplates].colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 rounded border border-gray-600"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-200">Required Elements</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {config.teamTemplates[activeTeam as keyof typeof config.teamTemplates].elements.map((element, index) => (
                          <Badge key={index} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-200">Historical Context</Label>
                    <Textarea
                      value={config.teamTemplates[activeTeam as keyof typeof config.teamTemplates].context}
                      className="cyber-input mt-2 min-h-24"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(config.parameters).map(([key, value]) => (
              <Card key={key} className="cyber-card border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</CardTitle>
                  <CardDescription className="text-xs">
                    Current value: {value}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={value}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          [key]: parseFloat(e.target.value)
                        }
                      }))}
                      className="slider w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.0</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 