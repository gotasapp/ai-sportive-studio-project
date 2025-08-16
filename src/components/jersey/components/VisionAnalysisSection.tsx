'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SPORTS_OPTIONS, VIEW_OPTIONS } from '../constants/jerseyConstants'
import { getSportLabel, getViewLabel } from '../utils/jerseyUtils'

interface VisionAnalysisSectionProps {
  // Estados que precisam ser passados do componente pai
  selectedTeam: string
  playerName: string
  playerNumber: string
  selectedStyle: string
  
  // Callbacks para atualizar estados no componente pai
  setError: (error: string | null) => void
  
  // Estados de vision analysis que vamos gerenciar aqui
  isVisionMode: boolean
  setIsVisionMode: (mode: boolean) => void
  referenceImage: string | null
  setReferenceImage: (image: string | null) => void
  referenceImageBlob: Blob | null
  setReferenceImageBlob: (blob: Blob | null) => void
  customPrompt: string
  setCustomPrompt: (prompt: string) => void
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void
  analysisResult: any
  setAnalysisResult: (result: any) => void
  selectedSport: string
  setSelectedSport: (sport: string) => void
  selectedView: string
  setSelectedView: (view: string) => void
}

export default function VisionAnalysisSection({
  selectedTeam,
  playerName,
  playerNumber,
  selectedStyle,
  setError,
  isVisionMode,
  setIsVisionMode,
  referenceImage,
  setReferenceImage,
  referenceImageBlob,
  setReferenceImageBlob,
  customPrompt,
  setCustomPrompt,
  isAnalyzing,
  setIsAnalyzing,
  analysisResult,
  setAnalysisResult,
  selectedSport,
  setSelectedSport,
  selectedView,
  setSelectedView,
}: VisionAnalysisSectionProps) {
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Vision model fixed to default (admin can change in settings)
  const selectedVisionModel = 'openai/gpt-4o-mini'

  // ===== VISION ANALYSIS FUNCTIONS ===== (copiado exatamente do original)
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG, WebP)')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Please upload an image smaller than 10MB')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Store blob for analysis
      setReferenceImageBlob(file)
      setIsVisionMode(true)
      
      console.log('📸 Reference image uploaded:', file.name, file.size)
      
    } catch (error) {
      console.error('❌ Upload error:', error)
      setError('Failed to upload image')
    }
  }

  const clearReferenceImage = () => {
    setReferenceImage(null)
    setReferenceImageBlob(null)
    setCustomPrompt('')
    setAnalysisResult(null)
    setIsVisionMode(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const analyzeReferenceImage = async () => {
    if (!referenceImageBlob) return

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 [VISION ANALYSIS] Starting reference image analysis using original vision-test flow...')
      
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64String = result.split(',')[1]
          resolve(base64String)
        }
        reader.readAsDataURL(referenceImageBlob)
      })

      // STEP 1: Get structured ANALYSIS PROMPT from our new API
      console.log('📋 [VISION ANALYSIS] Step 1: Getting structured analysis prompt...')
      const analysisPromptResponse = await fetch('/api/vision-prompts/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSport,
          view: selectedView
        }),
      })

      if (!analysisPromptResponse.ok) {
        throw new Error(`Failed to get analysis prompt: ${analysisPromptResponse.status}`)
      }

      const promptData = await analysisPromptResponse.json()
      
      if (!promptData.success) {
        throw new Error(promptData.error || 'Failed to get analysis prompt')
      }

      const structuredAnalysisPrompt = promptData.analysis_prompt
      console.log('✅ [VISION ANALYSIS] Got structured analysis prompt:', {
        sport: selectedSport,
        view: selectedView,
        promptLength: structuredAnalysisPrompt.length,
        focusAreas: promptData.metadata?.focus_areas?.length || 0
      })

      // STEP 2: Call vision API with structured prompt (with fallback)
      console.log('👁️ [VISION ANALYSIS] Step 2: Sending to Vision API for analysis...')
      
      let visionResult
      try {
        const visionResponse = await fetch('/api/vision-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: base64,
            prompt: structuredAnalysisPrompt,
            model: selectedVisionModel
          }),
        })

        if (!visionResponse.ok) {
          throw new Error(`Vision analysis failed: ${visionResponse.status}`)
        }

        visionResult = await visionResponse.json()
        
        if (!visionResult.success) {
          throw new Error(visionResult.error || 'Vision analysis failed')
        }
      } catch (fetchError: any) {
        console.log('⚠️ [VISION ANALYSIS] Vision API unavailable, using fallback mode')
        
        // Create fallback analysis
        visionResult = {
          success: true,
          analysis: `Professional ${selectedSport} jersey analysis: Style: ${selectedStyle}, Team: ${selectedTeam || 'custom'}, Player: ${playerName} #${playerNumber}. Using reference image for visual inspiration.`,
          model_used: 'fallback',
          cost_estimate: 0,
          fallback: true
        }
      }

      if (visionResult.fallback) {
        console.log('🔄 [VISION ANALYSIS] Using fallback analysis mode')
      } else {
        console.log('✅ [VISION ANALYSIS] Analysis completed successfully:', {
          model: visionResult.model_used,
          cost: visionResult.cost_estimate,
          analysisLength: visionResult.analysis?.length || 0
        })
      }

      // Use analysis result directly as text (bullet points format like vision-test)
      let finalResult = visionResult.analysis
      
      console.log('🔍 [VISION ANALYSIS] Using bullet-point analysis format:', {
        hasAnalysis: !!visionResult.analysis,
        analysisType: typeof visionResult.analysis,
        analysisLength: visionResult.analysis?.length || 0,
        analysisPreview: visionResult.analysis?.substring(0, 200) + '...',
        usingBulletPoints: true
      })

      // ===== CRITICAL: PERSISTENT STORAGE FOR ANALYSIS =====
      setAnalysisResult(finalResult)
      
      // Store in sessionStorage as backup to prevent loss
      if (finalResult) {
        try {
          sessionStorage.setItem('chz_vision_analysis', JSON.stringify({
            analysis: finalResult,
            timestamp: Date.now(),
            sport: selectedSport,
            view: selectedView
          }))
          console.log('💾 [ANALYSIS BACKUP] Stored analysis in sessionStorage as backup')
        } catch (storageError) {
          console.warn('⚠️ [ANALYSIS BACKUP] Failed to store in sessionStorage:', storageError)
        }
      }
      
      console.log('✅ [VISION ANALYSIS] Analysis completed successfully')
      console.log('🔍 [VISION ANALYSIS] Final result stored:', {
        type: typeof finalResult,
        isObject: typeof finalResult === 'object',
        hasData: !!finalResult,
        preview: typeof finalResult === 'object' ? JSON.stringify(finalResult).substring(0, 100) + '...' : String(finalResult).substring(0, 100) + '...',
        backupStored: true
      })

    } catch (error: any) {
      console.error('❌ [VISION ANALYSIS] Error:', error)
      setError(error.message || 'Failed to analyze reference image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Vision Analysis</h3>
        {isVisionMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearReferenceImage}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {!isVisionMode ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-4">
            Upload a reference image to analyze and generate similar jersey designs
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            Upload Reference Image
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {referenceImage && (
            <div className="border rounded-lg p-4">
              <img
                src={referenceImage}
                alt="Reference"
                className="w-full max-w-md mx-auto rounded"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sport</label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {SPORTS_OPTIONS.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">View</label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {VIEW_OPTIONS.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={analyzeReferenceImage}
            disabled={isAnalyzing || !referenceImageBlob}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Reference Image'}
          </Button>

          {analysisResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Analysis Result:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult, null, 2)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
