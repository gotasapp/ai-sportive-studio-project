'use client';

import { useState, useEffect } from 'react';
import { Upload, Zap, Building, Eye, Camera, Sunset, Cloud, Users, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { stadiumService, StadiumInfo, StadiumResponse } from '@/lib/services/stadium-service';

const STADIUM_STYLE_FILTERS = [
  { id: 'realistic', label: 'Realistic', icon: Eye },
  { id: 'cinematic', label: 'Cinematic', icon: Camera },
  { id: 'dramatic', label: 'Dramatic', icon: Zap }
];

const STADIUM_PERSPECTIVE_FILTERS = [
  { id: 'external', label: 'External', icon: Building },
  { id: 'internal', label: 'Internal', icon: Users },
  { id: 'mixed', label: 'Mixed', icon: Eye }
];

const STADIUM_ATMOSPHERE_FILTERS = [
  { id: 'packed', label: 'Packed', icon: Users },
  { id: 'half_full', label: 'Half Full', icon: Users },
  { id: 'empty', label: 'Empty', icon: Building }
];

const STADIUM_TIME_FILTERS = [
  { id: 'day', label: 'Day', icon: Zap },
  { id: 'night', label: 'Night', icon: Building },
  { id: 'sunset', label: 'Sunset', icon: Sunset }
];

const STADIUM_WEATHER_FILTERS = [
  { id: 'clear', label: 'Clear', icon: Zap },
  { id: 'dramatic', label: 'Dramatic', icon: Cloud },
  { id: 'cloudy', label: 'Cloudy', icon: Cloud }
];

export default function StadiumEditor() {
  // Stadium reference state
  const [availableStadiums, setAvailableStadiums] = useState<StadiumInfo[]>([]);
  const [selectedStadium, setSelectedStadium] = useState('custom_only');
  const [referenceType, setReferenceType] = useState('atmosphere');
  
  // Generation parameters
  const [generationStyle, setGenerationStyle] = useState<string>('realistic');
  const [perspective, setPerspective] = useState<string>('external');
  const [atmosphere, setAtmosphere] = useState<string>('packed');
  const [timeOfDay, setTimeOfDay] = useState<string>('day');
  const [weather, setWeather] = useState<string>('clear');
  const [quality, setQuality] = useState<string>('standard');
  
  // Custom inputs
  const [customPrompt, setCustomPrompt] = useState('');
  const [customReferenceFile, setCustomReferenceFile] = useState<File | null>(null);
  const [customReferenceBase64, setCustomReferenceBase64] = useState('');
  const [customReferencePreview, setCustomReferencePreview] = useState('');
  
  // Generation state
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StadiumResponse | null>(null);
  const [apiStatus, setApiStatus] = useState(false);

  useEffect(() => {
    loadAvailableStadiums();
    checkApiStatus();
  }, []);

  const loadAvailableStadiums = async () => {
    try {
      const stadiums = await stadiumService.getAvailableStadiums();
      setAvailableStadiums(stadiums);
      if (stadiums.length > 0) {
        setSelectedStadium(stadiums[0].id);
      }
    } catch (error) {
      console.error('Error loading stadiums:', error);
      setError('Failed to load available stadiums');
    }
  };

  const checkApiStatus = async () => {
    try {
      await stadiumService.checkHealth();
      setApiStatus(true);
    } catch (error) {
      setApiStatus(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCustomFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomReferenceFile(file);
      try {
        const base64 = await convertFileToBase64(file);
        setCustomReferenceBase64(base64);
        setCustomReferencePreview(`data:image/${file.type.split('/')[1]};base64,${base64}`);
      } catch (error) {
        console.error('Error converting file:', error);
        setError('Error processing image');
      }
    }
  };

  const generateStadium = async () => {
    if (!selectedStadium && !customPrompt) {
      setError('Select a stadium or enter a custom prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage('');
    setResult(null);

    try {
      let response: StadiumResponse;

      if (selectedStadium && selectedStadium !== 'custom_only') {
        // Generate with reference
        const request = {
          stadium_id: selectedStadium,
          reference_type: referenceType,
          generation_style: generationStyle,
          perspective,
          atmosphere,
          time_of_day: timeOfDay,
          weather,
          quality,
          custom_prompt: customPrompt || undefined,
          custom_reference_base64: customReferenceBase64 || undefined,
        };
        response = await stadiumService.generateFromReference(request);
      } else {
        // Generate custom only
        if (!customPrompt) {
          setError('Enter a custom prompt for custom generation');
          setIsGenerating(false);
          return;
        }
        
        const request = {
          prompt: customPrompt,
          reference_image_base64: customReferenceBase64 || undefined,
          generation_style: generationStyle,
          perspective,
          atmosphere,
          time_of_day: timeOfDay,
          quality,
        };
        response = await stadiumService.generateCustom(request);
      }
      
      if (response.success && response.generated_image_base64) {
        setGeneratedImage(`data:image/png;base64,${response.generated_image_base64}`);
        setResult(response);
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError('Failed to generate stadium');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setGeneratedImage('');
    setResult(null);
    setError('');
    setCustomPrompt('');
    setCustomReferenceFile(null);
    setCustomReferenceBase64('');
    setCustomReferencePreview('');
    if (availableStadiums.length > 0) {
      setSelectedStadium(availableStadiums[0].id);
    } else {
      setSelectedStadium('custom_only');
    }
  };

  return (
    <div className="min-h-screen" style={{
      background: '#000518',
      backgroundImage: `
        radial-gradient(ellipse at top left, #000720 0%, transparent 40%),
        radial-gradient(ellipse at top right, #000924 0%, transparent 40%),
        radial-gradient(ellipse at bottom left, #000720 0%, transparent 40%),
        radial-gradient(ellipse at bottom right, #000A29 0%, transparent 40%),
        radial-gradient(ellipse at center, #00081D 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(138, 43, 226, 0.03) 0%, transparent 50%)
      `
    }}>
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="gradient-border">
              <div className="gradient-border-content p-6">
                <h2 className="text-xl font-bold text-white mb-6">AI Stadium Generation</h2>
                
                {/* Stadium Selection */}
                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="text-sm text-gray-300 mb-2 block">Stadium Reference</Label>
                    <Select value={selectedStadium} onValueChange={setSelectedStadium}>
                      <SelectTrigger className="cyber-input">
                        <SelectValue placeholder="Select stadium..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom_only">Custom Only</SelectItem>
                        {availableStadiums.map((stadium) => (
                          <SelectItem key={stadium.id} value={stadium.id}>
                            {stadium.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStadium && selectedStadium !== 'custom_only' && (
                    <div>
                      <Label className="text-sm text-gray-300 mb-2 block">Reference Type</Label>
                      <Select value={referenceType} onValueChange={setReferenceType}>
                        <SelectTrigger className="cyber-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="atmosphere">Atmosphere</SelectItem>
                          <SelectItem value="day_light">Day Light</SelectItem>
                          <SelectItem value="night_light">Night Light</SelectItem>
                          <SelectItem value="any">Any Available</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Custom Prompt - Compact */}
                <div className="mb-6">
                  <Label className="text-sm text-gray-300 mb-2 block">Custom Description</Label>
                  <div className="relative">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Describe your stadium vision..."
                      className="cyber-input w-full h-20 resize-none text-sm"
                    />
                  </div>
                </div>

                {/* Reference Upload - Compact */}
                <div className="mb-6">
                  <Label className="text-sm text-gray-300 mb-2 block">Reference Image</Label>
                  <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-4 text-center">
                    <input 
                      type="file" 
                      className="hidden" 
                      id="stadium-file-upload"
                      accept="image/*"
                      onChange={handleCustomFileChange}
                    />
                    <label 
                      htmlFor="stadium-file-upload" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <ImageIcon className="w-6 h-6 text-cyan-400 mb-2" />
                      <span className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        Upload Image
                      </span>
                    </label>
                    
                    {customReferencePreview && (
                      <div className="mt-3">
                        <img 
                          src={customReferencePreview} 
                          alt="Reference" 
                          className="max-w-full max-h-16 mx-auto rounded"
                        />
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {customReferenceFile?.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateStadium}
                  disabled={isGenerating || (!selectedStadium && !customPrompt)}
                  className="cyber-button w-full py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                  {isGenerating ? 'Generating Stadium...' : 'Generate Stadium'}
                </button>

                {/* Style Filters - Compact */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-semibold text-white">Style</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {STADIUM_STYLE_FILTERS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setGenerationStyle(style.id as any)}
                        className={`style-button ${generationStyle === style.id ? 'active' : ''} px-3 py-2 rounded-lg flex items-center space-x-2 transition-all text-sm`}
                      >
                        <style.icon className="w-4 h-4" />
                        <span className="font-medium">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Perspective - Compact */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-semibold text-white">Perspective</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {STADIUM_PERSPECTIVE_FILTERS.map((persp) => (
                      <button
                        key={persp.id}
                        onClick={() => setPerspective(persp.id as any)}
                        className={`style-button ${perspective === persp.id ? 'active' : ''} px-3 py-2 rounded-lg flex items-center space-x-2 transition-all text-sm`}
                      >
                        <persp.icon className="w-4 h-4" />
                        <span className="font-medium">{persp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atmosphere - Compact */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-semibold text-white">Atmosphere</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {STADIUM_ATMOSPHERE_FILTERS.map((atm) => (
                      <button
                        key={atm.id}
                        onClick={() => setAtmosphere(atm.id as any)}
                        className={`style-button ${atmosphere === atm.id ? 'active' : ''} px-3 py-2 rounded-lg flex items-center space-x-2 transition-all text-sm`}
                      >
                        <atm.icon className="w-4 h-4" />
                        <span className="font-medium">{atm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time & Weather - Compact Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Time</h3>
                    <div className="space-y-2">
                      {STADIUM_TIME_FILTERS.map((time) => (
                        <button
                          key={time.id}
                          onClick={() => setTimeOfDay(time.id as any)}
                          className={`style-button ${timeOfDay === time.id ? 'active' : ''} w-full px-2 py-2 rounded-lg flex items-center space-x-2 transition-all text-xs`}
                        >
                          <time.icon className="w-3 h-3" />
                          <span className="font-medium">{time.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Weather</h3>
                    <div className="space-y-2">
                      {STADIUM_WEATHER_FILTERS.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setWeather(w.id as any)}
                          className={`style-button ${weather === w.id ? 'active' : ''} w-full px-2 py-2 rounded-lg flex items-center space-x-2 transition-all text-xs`}
                        >
                          <w.icon className="w-3 h-3" />
                          <span className="font-medium">{w.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quality */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Quality</h3>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="cyber-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (1024x1024)</SelectItem>
                      <SelectItem value="hd">HD (1024x1792)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* API Status */}
                <div className="pt-6 border-t border-gray-700">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs text-gray-300">
                        API: {apiStatus ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    
                    {result?.cost_usd && (
                      <div className="text-xs text-gray-400">
                        Cost: ${result.cost_usd.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="gradient-border">
              <div className="gradient-border-content p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Stadium Preview</h3>
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs ${apiStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {apiStatus ? '🟢 Ready' : '🔴 Offline'}
                    </div>
                    {generatedImage && (
                      <button
                        onClick={resetForm}
                        className="px-4 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-400/30 hover:bg-cyan-600/30 transition-colors text-sm flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset & Generate New</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative w-96 h-[28rem] rounded-2xl overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)',
                    border: '2px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    
                    {isGenerating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-cyan-400 text-xl font-semibold">Generating stadium...</p>
                        <div className="mt-4 w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <span className="text-red-400 text-3xl">⚠</span>
                          </div>
                          <p className="text-red-400 mb-6 text-center text-lg">{error}</p>
                          <button 
                            onClick={() => setError('')}
                            className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {generatedImage && !isGenerating && !error && (
                      <div className="absolute inset-0 p-6">
                        <img 
                          src={generatedImage} 
                          alt="Generated Stadium" 
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 rounded-b-lg">
                          <div className="text-white">
                            <p className="font-bold text-xl">{selectedStadium !== 'custom_only' ? availableStadiums.find(s => s.id === selectedStadium)?.name : 'Custom Stadium'}</p>
                            <p className="text-cyan-400 text-sm">{generationStyle} · {perspective} · {atmosphere}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-xs text-gray-300">{timeOfDay} · {weather}</span>
                              <span className="text-xs text-gray-300">Quality: {quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!generatedImage && !isGenerating && !error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-40 h-48 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-6 mx-auto">
                            <div className="text-center">
                              <Building className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                              <p className="text-sm text-gray-400">Stadium</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-lg">Your generated stadium will appear here</p>
                          <p className="text-cyan-400/70 text-sm mt-3">Premium NFT quality rendering</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 