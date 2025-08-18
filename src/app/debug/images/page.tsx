'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import ImageWithFallback from '@/components/utils/ImageWithFallback';

export default function ImageDebugPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Problematic NFTs mentioned
  const problematicNFTs = [
    { id: '6870f6b15bdc094f3de4c18b', name: 'Token ID #6870f6b15bdc094f3de4c18b' },
    { id: 'Vasco DINAMITE #24', name: 'Vasco DINAMITE #24' },
    { id: 'Vasco DINAMITE #23', name: 'Vasco DINAMITE #23' },
    { id: 'Vasco DINAMITE #29', name: 'Vasco DINAMITE #29' },
    { id: 'Vasco DINAMITE #36', name: 'Vasco DINAMITE #36' },
    { id: 'Vasco DINAMITE #35', name: 'Vasco DINAMITE #35' },
    { id: 'Vasco DINAMITE #33', name: 'Vasco DINAMITE #33' }
  ];
  
  const testImage = async (url: string) => {
    if (!url) return;
    
    setLoading(true);
    setDebugResults(null);
    
    try {
      const response = await fetch('/api/debug/image-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url })
      });
      
      const data = await response.json();
      setDebugResults(data);
    } catch (error) {
      setDebugResults({
        error: error instanceof Error ? error.message : 'Failed to test image'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-[#14101e] border-[#FDFDFD]/10">
          <CardHeader>
            <CardTitle className="text-2xl text-[#FDFDFD]">Image Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[#FDFDFD]/70">Image URL to test:</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="ipfs://Qm... or https://..."
                  className="bg-[#0b0518] border-[#FDFDFD]/20 text-[#FDFDFD]"
                />
                <Button
                  onClick={() => testImage(imageUrl)}
                  disabled={loading || !imageUrl}
                  className="bg-[#FF0052] hover:bg-[#FF0052]/90"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Test'}
                </Button>
              </div>
            </div>
            
            {/* NFTs problemáticas */}
            <div className="space-y-2">
              <p className="text-sm text-[#FDFDFD]/70">NFTs problemáticas mencionadas:</p>
              <div className="grid grid-cols-1 gap-2">
                {problematicNFTs.map((nft) => (
                  <div key={nft.id} className="text-xs text-[#FDFDFD]/50 font-mono">
                    {nft.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Preview da imagem */}
        {imageUrl && (
          <Card className="bg-[#14101e] border-[#FDFDFD]/10">
            <CardHeader>
              <CardTitle className="text-lg text-[#FDFDFD]">Image Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#FDFDFD]/70 mb-2">Original Image:</p>
                  <img
                    src={imageUrl}
                    alt="Original"
                    className="w-full h-48 object-cover rounded border border-[#FDFDFD]/10"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/400/400';
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-[#FDFDFD]/70 mb-2">With Fallback System:</p>
                  <ImageWithFallback
                    src={imageUrl}
                    alt="With fallback"
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover rounded border border-[#FDFDFD]/10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Resultados do debug */}
        {debugResults && (
          <Card className="bg-[#14101e] border-[#FDFDFD]/10">
            <CardHeader>
              <CardTitle className="text-lg text-[#FDFDFD]">Debug Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {debugResults.error ? (
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="w-5 h-5" />
                  <span>{debugResults.error}</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#FDFDFD]/70">Original URL:</span>
                      <span className="text-[#FDFDFD] font-mono text-xs break-all">{debugResults.originalUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#FDFDFD]/70">Is Cloudinary:</span>
                      <span className="text-[#FDFDFD]">{debugResults.isCloudinary ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#FDFDFD]/70">Is IPFS:</span>
                      <span className="text-[#FDFDFD]">{debugResults.isIPFS ? 'Yes' : 'No'}</span>
                    </div>
                    {debugResults.ipfsHash && (
                      <div className="flex justify-between">
                        <span className="text-[#FDFDFD]/70">IPFS Hash:</span>
                        <span className="text-[#FDFDFD] font-mono text-xs">{debugResults.ipfsHash}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Gateway tests */}
                  {debugResults.gatewayTests && debugResults.gatewayTests.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#FDFDFD]">Gateway Tests:</h4>
                      {debugResults.gatewayTests.map((test: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-[#0b0518] rounded">
                          <span className="text-[#FDFDFD]/70 font-mono flex-1 truncate">{test.gateway || test.url}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#FDFDFD]/50">Status: {test.status}</span>
                            {test.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Working URLs */}
                  {debugResults.workingUrls && debugResults.workingUrls.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#FDFDFD]">Working URLs:</h4>
                      {debugResults.workingUrls.map((url: string, index: number) => (
                        <div key={index} className="p-2 bg-green-900/20 border border-green-500/30 rounded">
                          <p className="text-xs font-mono text-green-400 break-all">{url}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Recommendation */}
                  {debugResults.recommendation && (
                    <div className="p-3 bg-[#FF0052]/20 border border-[#FF0052]/30 rounded">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-[#FF0052] mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-[#FDFDFD]">Recommendation:</p>
                          <p className="text-sm text-[#FDFDFD]/70">{debugResults.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
