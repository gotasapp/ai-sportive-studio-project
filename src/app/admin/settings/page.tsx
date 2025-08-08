'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Settings, Key, Server, ToggleLeft, Coins, Save, RefreshCw, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos para a configuração
interface Settings {
  siteName: string;
  maintenanceMode: boolean;
  apiKeys: {
    openai: string;
    thirdweb: string;
    cloudinary: string;
  };
  featureFlags: {
    enableStadiums: boolean;
    enableBadges: boolean;
    enableLogoUpload: boolean;
    enableGasless: boolean;
  };
  defaults: {
    mintPrice: string;
    editionSize: number;
    royaltyPercentage: number;
  };
}

const LoadingSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-64 bg-gray-700 rounded"></div>
        <div className="h-4 w-80 bg-gray-700 rounded mt-2"></div>
      </div>
      <div className="h-10 w-40 bg-gray-700 rounded"></div>
    </div>
    <div className="h-12 w-full bg-gray-700 rounded"></div>
    <div className="h-96 bg-gray-700 rounded-lg"></div>
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to fetch settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (err: any) {
        console.error('Settings fetch error:', err);
        setError(err.message);
        
        // Fallback para dados iniciais em caso de erro
        const fallbackSettings: Settings = {
          siteName: 'CHZ Fantoken Studio',
          maintenanceMode: false,
          apiKeys: {
            openai: 'sk-xxx...',
            thirdweb: 'pk-xxx...',
            cloudinary: 'cloudinary://xxx...',
          },
          featureFlags: {
            enableStadiums: true,
            enableBadges: true,
            enableLogoUpload: false,
            enableGasless: true,
          },
          defaults: {
            mintPrice: '10',
            editionSize: 100,
          },
        };
        
        setSettings(fallbackSettings);
        toast.error(`Error loading settings: ${err.message}. Using fallback data.`);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (category: keyof Settings, key: string, value: string | number | boolean) => {
      setSettings(prev => {
          if (!prev) return null;
          return {
              ...prev,
              [category]: {
                  ...(prev[category] as any),
                  [key]: value
              }
          };
      });
  };

  const handleSwitchChange = (category: keyof Settings, key: string, checked: boolean) => {
      handleInputChange(category, key, checked);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings.');
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!settings) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-200">System Settings</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">Global platform configuration and integrations.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="cyber-button w-full md:w-auto">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 cyber-card border-cyan-500/30">
          <TabsTrigger value="general"><Settings className="w-4 h-4 mr-2" />General</TabsTrigger>
          {/* <TabsTrigger value="api"><Key className="w-4 h-4 mr-2" />API Keys</TabsTrigger> */}
          <TabsTrigger value="features"><ToggleLeft className="w-4 h-4 mr-2" />Features</TabsTrigger>
          <TabsTrigger value="defaults"><Coins className="w-4 h-4 mr-2" />Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="cyber-input" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="maintenanceMode" checked={settings.maintenanceMode} onCheckedChange={(c) => setSettings({...settings, maintenanceMode: c})} />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="api">
            <Card className="cyber-card border-cyan-500/30">
                <CardHeader><CardTitle>API Keys</CardTitle><CardDescription>Leave blank to keep existing key.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    {Object.keys(settings.apiKeys).map((key) => (
                        <div key={key} className="space-y-2">
                            <Label htmlFor={key} className="capitalize">{key}</Label>
                            <Input id={key} placeholder={settings.apiKeys[key as keyof typeof settings.apiKeys]} onChange={(e) => handleInputChange('apiKeys', key, e.target.value)} className="cyber-input font-mono" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent> */}

        <TabsContent value="features">
            <Card className="cyber-card border-cyan-500/30">
                <CardHeader><CardTitle>Feature Flags</CardTitle><CardDescription>Enable or disable major features globally.</CardDescription></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {Object.keys(settings.featureFlags).map((key) => (
                        <div key={key} className="flex items-center space-x-2">
                            <Switch id={key} checked={settings.featureFlags[key as keyof typeof settings.featureFlags]} onCheckedChange={(c) => handleSwitchChange('featureFlags', key, c)} />
                            <Label htmlFor={key} className="capitalize">{key.replace('enable', '')}</Label>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>



        <TabsContent value="defaults">
            <Card className="cyber-card border-cyan-500/30">
                <CardHeader><CardTitle>Default Values</CardTitle><CardDescription>Default settings for new items.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mintPrice">Default Mint Price (CHZ)</Label>
                        <Input id="mintPrice" type="text" value={settings.defaults.mintPrice} onChange={(e) => handleInputChange('defaults', 'mintPrice', e.target.value)} className="cyber-input" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="editionSize">Default Edition Size</Label>
                        <Input id="editionSize" type="number" value={settings.defaults.editionSize} onChange={(e) => handleInputChange('defaults', 'editionSize', Number(e.target.value))} className="cyber-input" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="royaltyPercentage">Default Royalty Percentage (%)</Label>
                        <Input 
                          id="royaltyPercentage" 
                          type="number" 
                          min="0" 
                          max="25" 
                          step="0.1"
                          value={settings.defaults.royaltyPercentage} 
                          onChange={(e) => handleInputChange('defaults', 'royaltyPercentage', Number(e.target.value))} 
                          className="cyber-input" 
                          placeholder="10.0"
                        />
                        <div className="text-sm text-gray-400">Aplicado apenas em Batch Mint (coleções). Launchpad usa configuração própria.</div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}