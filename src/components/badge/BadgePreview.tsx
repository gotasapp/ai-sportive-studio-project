'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Loader2 } from 'lucide-react'

interface BadgePreviewProps {
  imageUrl: string
  isGenerating: boolean
  teamName: string
  badgeName: string
  badgeNumber: string
  style: string
}

export function BadgePreview({
  imageUrl,
  isGenerating,
  teamName,
  badgeName,
  badgeNumber,
  style
}: BadgePreviewProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          Preview do Badge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preview da Imagem */}
          <div className="relative aspect-square w-full max-w-md mx-auto">
            <div className="cyber-border rounded-lg p-4 bg-black/20">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-accent" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Gerando Badge...</p>
                    <p className="text-xs text-muted-foreground">
                      Criando {style} badge para {teamName}
                    </p>
                  </div>
                </div>
              ) : imageUrl ? (
                <div className="space-y-4">
                  <img
                    src={imageUrl}
                    alt={`Badge ${badgeName} #${badgeNumber} - ${teamName}`}
                    className="w-full h-full object-cover rounded-md cyber-glow"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <Award className="w-16 h-16 text-muted-foreground/50" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Seu badge aparecerá aqui
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Configure os parâmetros e clique em "Gerar Badge"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Badge */}
          {(teamName || badgeName || badgeNumber) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Especificações
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {teamName && (
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-medium">{teamName}</p>
                  </div>
                )}
                {badgeName && (
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{badgeName}</p>
                  </div>
                )}
                {badgeNumber && (
                  <div>
                    <span className="text-muted-foreground">Número:</span>
                    <p className="font-medium">#{badgeNumber}</p>
                  </div>
                )}
                {style && (
                  <div>
                    <span className="text-muted-foreground">Estilo:</span>
                    <Badge variant="secondary" className="text-xs">
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="pt-3 border-t border-border/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                variant={imageUrl ? "default" : isGenerating ? "secondary" : "outline"}
                className="text-xs"
              >
                {isGenerating ? "Gerando..." : imageUrl ? "Pronto" : "Aguardando"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 