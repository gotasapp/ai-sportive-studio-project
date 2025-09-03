'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Save, RotateCcw, Eye, Plus, X, Shirt, Palette, Settings, Zap, AlertTriangle, CheckCircle, Loader2 
} from 'lucide-react'
import { toast } from 'sonner'

// Types for configuration
interface TeamTemplate {
  colors: string[];
  elements: string[];
  context: string;
}
interface Config {
  basePrompt: string;
  suffixPrompt: string;
  negativePrompts: {
    global: string[];
    style: string[];
    quality: string[];
  };
  parameters: {
    creativity: number;
    quality: number;
    styleStrength: number;
    guidanceScale: number;
  };
  teamTemplates: Record<string, TeamTemplate>;
}

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-64 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-80 bg-gray-700 rounded animate-pulse mt-2"></div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 w-40 bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
    <div className="h-12 w-full bg-gray-700 rounded animate-pulse"></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-48 bg-gray-700 rounded-lg animate-pulse"></div>
      <div className="h-48 bg-gray-700 rounded-lg animate-pulse"></div>
    </div>
  </div>
);


export default function JerseysConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNegativePrompt, setNewNegativePrompt] = useState("");
  const [activeTeam, setActiveTeam] = useState("flamengo");
  const [previewPrompt, setPreviewPrompt] = useState("");

  // Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/jerseys/config');
        if (!response.ok) throw new Error('Failed to fetch configuration.');
        const data = await response.json();
        setConfig(data);
        setActiveTeam(Object.keys(data.teamTemplates)[0] || '');
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Handlers
  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/jerseys/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to save configuration.');
      toast.success('Configuration saved successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleSliderChange = (name: keyof Config['parameters'], value: number[]) => {
    setConfig(prev => prev ? {
      ...prev,
      parameters: { ...prev.parameters, [name]: value[0] }
    } : null);
  };

  const generatePreviewPrompt = () => {
    if (!config) return;
    const team = config.teamTemplates[activeTeam];
    if (!team) return;
    const fullPrompt = `${config.basePrompt}, ${team.context}, ${team.elements.join(', ')}, ${config.suffixPrompt}`;
    const negatives = Object.values(config.negativePrompts).flat().join(', ');
    setPreviewPrompt(`PROMPT: ${fullPrompt}\n\nNEGATIVE: ${negatives}`);
  };

  const addNegativePrompt = (category: keyof Config['negativePrompts']) => {
    if (newNegativePrompt.trim() && config) {
      const newConfig = { ...config };
      newConfig.negativePrompts[category].push(newNegativePrompt.trim());
      setConfig(newConfig);
      setNewNegativePrompt("");
    }
  };

  const removeNegativePrompt = (category: keyof Config['negativePrompts'], index: number) => {
    if (config) {
      const newConfig = { ...config };
      newConfig.negativePrompts[category].splice(index, 1);
      setConfig(newConfig);
    }
  };
  
  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!config) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Jersey Configuration</h1>
          <p className="text-gray-400 mt-2">AI prompt engineering and generation settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-cyan-500/30">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} className="cyber-button">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="prompts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 cyber-card border-cyan-500/30">
          <TabsTrigger value="prompts" className="data-[state=active]:bg-cyan-500/20">Prompt Engineering</TabsTrigger>
          <TabsTrigger value="negatives" className="data-[state=active]:bg-cyan-500/20">Negative Prompts</TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-cyan-500/20">Team Templates</TabsTrigger>
          <TabsTrigger value="parameters" className="data-[state=active]:bg-cyan-500/20">Parameters</TabsTrigger>
        </TabsList>

        {/* Prompt Engineering Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader><CardTitle>Base Prompt</CardTitle><CardDescription>Core prompt for all generations</CardDescription></CardHeader>
              <CardContent>
                <Textarea name="basePrompt" value={config.basePrompt} onChange={handleInputChange} className="cyber-input min-h-24"/>
              </CardContent>
            </Card>
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader><CardTitle>Suffix Prompt</CardTitle><CardDescription>Quality and style modifiers</CardDescription></CardHeader>
              <CardContent>
                <Textarea name="suffixPrompt" value={config.suffixPrompt} onChange={handleInputChange} className="cyber-input min-h-24"/>
              </CardContent>
            </Card>
          </div>
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex justify-between">Prompt Preview <Button onClick={generatePreviewPrompt} size="sm" className="cyber-button">Generate</Button></CardTitle>
              <CardDescription>Final prompt for team: {activeTeam}</CardDescription>
            </CardHeader>
            {previewPrompt && <CardContent><Textarea readOnly value={previewPrompt} className="cyber-input min-h-32"/></CardContent>}
          </Card>
        </TabsContent>

        {/* Negative Prompts Tab */}
        <TabsContent value="negatives" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(config.negativePrompts).map(([category, prompts]) => (
            <Card key={category} className="cyber-card border-cyan-500/30">
              <CardHeader><CardTitle className="capitalize">{category}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {prompts.map((prompt, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                    <span className="text-sm">{prompt}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeNegativePrompt(category as keyof Config['negativePrompts'], index)}><X className="w-4 h-4"/></Button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input value={newNegativePrompt} onChange={(e) => setNewNegativePrompt(e.target.value)} placeholder="Add new prompt..."/>
                  <Button onClick={() => addNegativePrompt(category as keyof Config['negativePrompts'])}><Plus className="w-4 h-4"/></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Team Templates Tab */}
        <TabsContent value="teams">
           {/* UI para gerenciar templates de times será adicionada aqui */}
           <Card className="cyber-card border-cyan-500/30"><CardContent className="p-8 text-center">Team template management UI coming soon.</CardContent></Card>
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cyber-card border-cyan-500/30">
                <CardHeader><CardTitle>Generation Parameters</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {Object.entries(config.parameters).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                <span className="text-cyan-400 font-mono">{value.toFixed(2)}</span>
                            </div>
                            <Slider 
                                value={[value]}
                                onValueChange={(val) => handleSliderChange(key as keyof Config['parameters'], val)}
                                max={key === 'guidanceScale' ? 20 : 1}
                                step={key === 'guidanceScale' ? 0.5 : 0.05}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="cyber-card border-cyan-500/30">
                <CardHeader><CardTitle>Parameter Info</CardTitle></CardHeader>
                <CardContent className="text-sm text-gray-400 space-y-3">
                    <p><strong>Creativity:</strong> Higher values allow more deviation from the prompt. (0.0 - 1.0)</p>
                    <p><strong>Quality:</strong> Controls the aesthetic quality of the image. Higher is better. (0.0 - 1.0)</p>
                    <p><strong>Style Strength:</strong> How strongly the artistic style is applied. (0.0 - 1.0)</p>
                    <p><strong>Guidance Scale:</strong> How strictly the model follows the prompt. (1.0 - 20.0)</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 