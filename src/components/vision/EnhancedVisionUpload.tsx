import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  X, 
  Eye, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  FileImage,
  Loader2,
  Sparkles,
  Camera,
  Palette,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedVisionUploadProps {
  onFileUpload: (file: File) => void
  onClearFile: () => void
  isAnalyzing: boolean
  analysisResult: any
  referenceImage: string | null
  analysisProgress?: number
  className?: string
}

export function EnhancedVisionUpload({
  onFileUpload,
  onClearFile,
  isAnalyzing,
  analysisResult,
  referenceImage,
  analysisProgress = 0,
  className
}: EnhancedVisionUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageMetadata, setImageMetadata] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleFileSelection = (file: File) => {
    setUploadError(null)
    
    // Validation
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (JPG, PNG, WebP)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB')
      return
    }

    // Extract metadata
    const metadata = {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleDateString()
    }
    setImageMetadata(metadata)

    onFileUpload(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const getAnalysisStatusIcon = () => {
    if (isAnalyzing) return <Loader2 className="h-4 w-4 animate-spin text-[#FF0052]" />
    if (analysisResult) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (uploadError) return <AlertCircle className="h-4 w-4 text-red-500" />
    return <Sparkles className="h-4 w-4 text-[#FDFDFD]/60" />
  }

  const getAnalysisStatusText = () => {
    if (isAnalyzing) return "Analyzing reference..."
    if (analysisResult) return "Analysis complete"
    if (uploadError) return uploadError
    return "Ready for analysis"
  }

  return (
    <Card className={cn("bg-[#14101e] border-[#FDFDFD]/20", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-[#FDFDFD] flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Reference Upload
          <Badge variant="outline" className="bg-[#FF0052]/10 text-[#FF0052] border-[#FF0052]/30">
            Premium
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!referenceImage ? (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
              isDragActive
                ? "border-[#FF0052] bg-[#FF0052]/10 scale-[1.02]"
                : "border-[#FDFDFD]/20 hover:border-[#FF0052]/50 hover:bg-[#FF0052]/5"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileInputChange}
            />
            
            <div className="space-y-4">
              <div className={cn(
                "mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                isDragActive ? "bg-[#FF0052]/20 scale-110" : "bg-[#FDFDFD]/10"
              )}>
                <Upload className={cn(
                  "h-8 w-8 transition-colors",
                  isDragActive ? "text-[#FF0052]" : "text-[#FDFDFD]/70"
                )} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">
                  {isDragActive ? "Drop your image here" : "Upload Reference Image"}
                </h3>
                <p className="text-[#FDFDFD]/70 mb-4">
                  Drag & drop or click to browse
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="bg-[#FDFDFD]/5 text-[#FDFDFD]/70 border-[#FDFDFD]/20">
                    <FileImage className="h-3 w-3 mr-1" />
                    JPG, PNG, WebP
                  </Badge>
                  <Badge variant="outline" className="bg-[#FDFDFD]/5 text-[#FDFDFD]/70 border-[#FDFDFD]/20">
                    Max 10MB
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Image Preview with Analysis */
          <div className="space-y-4">
            {/* Image Display */}
            <div className="relative group">
              <div className="aspect-video relative overflow-hidden rounded-lg border border-[#FDFDFD]/20">
                <Image
                  src={referenceImage}
                  alt="Reference"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                
                {/* Status Overlay */}
                <div className="absolute top-3 left-3">
                  <Badge variant="outline" className="bg-black/70 backdrop-blur-sm border-[#FDFDFD]/20">
                    {getAnalysisStatusIcon()}
                    <span className="ml-2">{getAnalysisStatusText()}</span>
                  </Badge>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFile}
                  className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#FDFDFD]/70">Analyzing image...</span>
                    <span className="text-[#FF0052]">{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-[#FDFDFD]/60">
                    <Eye className="h-3 w-3" />
                    <span>AI analyzing visual elements, colors, and patterns</span>
                  </div>
                </div>
              )}
            </div>

            {/* Image Metadata */}
            {imageMetadata && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FDFDFD]/5 rounded p-2">
                  <span className="text-[#FDFDFD]/60">File:</span>
                  <p className="text-[#FDFDFD] truncate">{imageMetadata.name}</p>
                </div>
                <div className="bg-[#FDFDFD]/5 rounded p-2">
                  <span className="text-[#FDFDFD]/60">Size:</span>
                  <p className="text-[#FDFDFD]">{imageMetadata.size}</p>
                </div>
              </div>
            )}

            {/* Quick Analysis Preview */}
            {analysisResult && !isAnalyzing && (
              <div className="bg-[#FF0052]/10 rounded-lg p-4 border border-[#FF0052]/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-[#FF0052]" />
                  <span className="text-sm font-medium text-[#FF0052]">Analysis Ready</span>
                </div>
                <p className="text-xs text-[#FDFDFD]/80 line-clamp-3">
                  {typeof analysisResult === 'string' 
                    ? analysisResult.substring(0, 120) + '...'
                    : 'Visual analysis completed successfully'
                  }
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="mt-2 h-auto p-0 text-xs text-[#FF0052] hover:text-[#FF0052]/80"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Full Analysis
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {uploadError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">{uploadError}</span>
            </div>
          </div>
        )}

        {/* Tips */}
        {!referenceImage && (
          <div className="text-xs text-[#FDFDFD]/60 space-y-1">
            <p className="flex items-center gap-2">
              <Palette className="h-3 w-3" />
              Best results: Clear, well-lit images with good contrast
            </p>
            <p className="flex items-center gap-2">
              <Layers className="h-3 w-3" />
              Recommended: Front or back view of jerseys/uniforms
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 