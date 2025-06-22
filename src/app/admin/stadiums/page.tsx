'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Eye, Wand2, Download, DollarSign, Clock, Camera, Zap } from 'lucide-react'
import { StadiumService, stadiumService, StadiumGenerationRequest, StadiumResponse } from '@/lib/services/stadium-service'
import Image from 'next/image'

export default function StadiumsPage() {
  // Estados principais
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<StadiumResponse | null>(null)
  const [generationResult, setGenerationResult] = useState<StadiumResponse | null>(null)
  const [error, setError] = useState<string>('')
  
  // Parâmetros de geração
  const [generationStyle, setGenerationStyle] = useState<'realistic' | 'cinematic' | 'dramatic'>('realistic')
  const [atmosphere, setAtmosphere] = useState<'packed' | 'half_full' | 'empty'>('packed')
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night' | 'sunset'>('day')
  const [weather, setWeather] = useState<'clear' | 'dramatic' | 'cloudy'>('clear')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const processed = await StadiumService.processImageUpload(file)
      setSelectedFile(file)
      setImagePreview(processed.preview)
      setError('')
      
      // Reset resultados anteriores
      setAnalysisResult(null)
      setGenerationResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError('')

    try {
      const processed = await StadiumService.processImageUpload(selectedFile)
      // Use generateCustom for analysis with custom reference
      const result = await stadiumService.generateCustom({
        prompt: 'Analyze this stadium image and describe its architecture, atmosphere, and characteristics',
        reference_image_base64: processed.base64,
        quality: 'standard'
      })

      setAnalysisResult(result)
      
      if (!result.success) {
        setError(result.error || 'Analysis failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile) return

    setIsGenerating(true)
    setError('')

    try {
      const processed = await StadiumService.processImageUpload(selectedFile)
      // Use generateCustom for custom stadium generation
      const result = await stadiumService.generateCustom({
        prompt: `Generate a ${generationStyle} stadium with ${atmosphere} atmosphere during ${timeOfDay} with ${weather} weather conditions`,
        reference_image_base64: processed.base64,
        generation_style: generationStyle,
        atmosphere,
        time_of_day: timeOfDay,
        quality
      })

      setGenerationResult(result)
      
      if (!result.success) {
        setError(result.error || 'Generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${base64}`
    link.download = `${filename}.png`
    link.click()
  }

  const estimatedCost = StadiumService.estimateCost('generation', quality)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stadium Generator</h1>
          <p className="text-muted-foreground">
            GPT-4 Vision + DALL-E 3 Pipeline Test
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            GPT-4 Vision
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Wand2 className="w-3 h-3" />
            DALL-E 3
          </Badge>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Reference Image
          </CardTitle>
          <CardDescription>
            Upload a stadium image for analysis and generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <Image 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                    width={256}
                    height={256}
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile?.name} ({(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-lg font-medium">Click to upload stadium image</p>
                  <p className="text-sm text-muted-foreground">
                    Supports PNG, JPG, WEBP (max 10MB)
                  </p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Tabs */}
      {selectedFile && (
        <Tabs defaultValue="analyze" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Analyze Only
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate Stadium
            </TabsTrigger>
          </TabsList>

          {/* Analyze Tab */}
          <TabsContent value="analyze">
            <Card>
              <CardHeader>
                <CardTitle>Stadium Analysis</CardTitle>
                <CardDescription>
                  Analyze the stadium image using GPT-4 Vision
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Estimated cost: $0.01</span>
                  </div>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Analyze Stadium
                      </>
                    )}
                  </Button>
                </div>

                {/* Analysis Results */}
                {analysisResult?.success && analysisResult.analysis && (
                  <div className="space-y-4 mt-6">
                    <Separator />
                    <h3 className="font-semibold">Analysis Results</h3>
                    
                    {StadiumService.formatAnalysisForDisplay(analysisResult.analysis).map((section, idx) => (
                      <Card key={idx} className="p-4">
                        <h4 className="font-medium mb-2">{section.title}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {section.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between">
                              <span className="text-muted-foreground">{item.label}:</span>
                              <span className="font-medium">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}

                    {analysisResult.analysis.dalle3_prompt && (
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Generated DALL-E 3 Prompt</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                          {analysisResult.analysis.dalle3_prompt}
                        </p>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Stadium Generation</CardTitle>
                <CardDescription>
                  Generate a new stadium image based on the reference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generation Parameters */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Style</label>
                    <Select value={generationStyle} onValueChange={(v: any) => setGenerationStyle(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Realistic</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Atmosphere</label>
                    <Select value={atmosphere} onValueChange={(v: any) => setAtmosphere(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="half_full">Half Full</SelectItem>
                        <SelectItem value="empty">Empty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Select value={timeOfDay} onValueChange={(v: any) => setTimeOfDay(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                        <SelectItem value="sunset">Sunset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weather</label>
                    <Select value={weather} onValueChange={(v: any) => setWeather(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear">Clear</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                        <SelectItem value="cloudy">Cloudy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quality</label>
                    <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="hd">HD (+$0.04)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Estimated cost: ${estimatedCost.toFixed(3)}</span>
                  </div>
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate Stadium
                      </>
                    )}
                  </Button>
                </div>

                {/* Generation Results */}
                {generationResult?.success && (
                  <div className="space-y-4 mt-6">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Generated Stadium</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Cost: ${generationResult.cost_usd?.toFixed(3)}
                        </Badge>
                        {generationResult.generated_image_base64 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadImage(generationResult.generated_image_base64!, 'generated-stadium')}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {generationResult.generated_image_base64 && (
                      <div className="flex justify-center">
                        <Image 
                          src={StadiumService.base64ToImageUrl(generationResult.generated_image_base64)}
                          alt="Generated Stadium"
                          className="max-w-full max-h-96 rounded-lg shadow-lg"
                          width={384}
                          height={256}
                        />
                      </div>
                    )}

                    {/* Analysis from Generation */}
                    {generationResult.analysis && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Analysis Used for Generation</h4>
                        {StadiumService.formatAnalysisForDisplay(generationResult.analysis).map((section, idx) => (
                          <Card key={idx} className="p-3">
                            <h5 className="font-medium text-sm mb-1">{section.title}</h5>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {section.items.slice(0, 4).map((item, itemIdx) => (
                                <div key={itemIdx} className="flex justify-between">
                                  <span className="text-muted-foreground">{item.label}:</span>
                                  <span className="font-medium">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 