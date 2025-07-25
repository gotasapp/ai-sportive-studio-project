'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, Clock, CheckCircle, XCircle, RefreshCw, User, Shirt, Building, Award, Info, Image as ImageIcon, 
  Plus, X, Settings, Filter, Zap, DollarSign, Pencil
} from 'lucide-react'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Tipos de dados da API
interface PendingItem {
  id: string;
  type: 'Jersey' | 'Stadium' | 'Badge' | 'Logo';
  name: string;
  creator?: {
    name: string;
    wallet: string;
  };
  submittedAt: string;
  status: 'Pending';
  imageUrl: string;
  details: Record<string, any>;
}

// Tipos para Content Filters
interface ContentFilters {
  enabled: boolean;
  defaultPrompts: string[];
  customPrompts: string[];
}

// Tipos para Quality Settings
interface QualitySettings {
  defaultQuality: 'standard' | 'hd';
  allowUserChoice: boolean;
  standardCost: number;
  hdCost: number;
  maxGenerationsPerUser: number;
}

const typeConfig = {
  Jersey: { icon: Shirt, color: 'text-blue-400' },
  Stadium: { icon: Building, color: 'text-green-400' },
  Badge: { icon: Award, color: 'text-yellow-400' },
  Logo: { icon: ImageIcon, color: 'text-purple-400' },
}

export default function ModerationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Content Filters State
  const [contentFilters, setContentFilters] = useState<ContentFilters>({
    enabled: false,
    defaultPrompts: [],
    customPrompts: []
  });
  const [newCustomPrompt, setNewCustomPrompt] = useState('');
  const [filtersLoading, setFiltersLoading] = useState(false);
  
  // Moderation Settings State
  const [moderationEnabled, setModerationEnabled] = useState(false);
  const [moderationLoading, setModerationLoading] = useState(false);
  
  // Quality Settings State
  const [qualitySettings, setQualitySettings] = useState<QualitySettings | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Mostrar 12 itens por página
  const [totalItems, setTotalItems] = useState(0);

  // Novo estado para edição inline de custom prompts
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [editingPromptValue, setEditingPromptValue] = useState('');

  const editCustomPrompt = (index: number, currentPrompt: string) => {
    setEditingPromptIndex(index);
    setEditingPromptValue(currentPrompt);
  };

  const cancelEditPrompt = () => {
    setEditingPromptIndex(null);
    setEditingPromptValue('');
  };

  const saveEditPrompt = async (oldPrompt: string, newPrompt: string) => {
    if (!newPrompt.trim() || newPrompt.trim() === oldPrompt.trim()) {
      cancelEditPrompt();
      return;
    }
    try {
      const response = await fetch('/api/admin/settings/negative-prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPrompt, newPrompt: newPrompt.trim() })
      });
      if (response.ok) {
        await fetchContentFilters();
        toast.success('Prompt updated successfully!');
      } else {
        toast.error('Failed to update prompt');
      }
    } catch (error) {
      toast.error('Failed to update prompt');
    }
    cancelEditPrompt();
  };

  const fetchItems = useCallback(async (force = false) => {
    // Cache simples - evita recarregar se já tem dados e não é forçado
    if (!force && items.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/moderation', {
        // Cache por 30 segundos
        next: { revalidate: 30 }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch items for moderation');
      }
      const data: PendingItem[] = await response.json();
      setItems(data);
      setTotalItems(data.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [items]);

  // Fetch Content Filters
  const fetchContentFilters = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const response = await fetch('/api/admin/settings/negative-prompts');
      if (response.ok) {
        const data = await response.json();
        setContentFilters(data);
      }
    } catch (error) {
      console.error('Error fetching content filters:', error);
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  // Fetch Moderation Settings
  const fetchModerationSettings = useCallback(async () => {
    setModerationLoading(true);
    try {
      const response = await fetch('/api/admin/settings/moderation');
      if (response.ok) {
        const data = await response.json();
        setModerationEnabled(data.moderationEnabled);
      }
    } catch (error) {
      console.error('Error fetching moderation settings:', error);
    } finally {
      setModerationLoading(false);
    }
  }, []);

  // Fetch Quality Settings
  const fetchQualitySettings = useCallback(async () => {
    setQualityLoading(true);
    try {
      const response = await fetch('/api/admin/settings/quality');
      if (response.ok) {
        const data = await response.json();
        setQualitySettings(data);
      }
    } catch (error) {
      console.error('Error fetching quality settings:', error);
    } finally {
      setQualityLoading(false);
    }
  }, []);

  // Lazy loading - só carrega quando necessário
  const [activeTab, setActiveTab] = useState('queue');
  const [hasLoadedFilters, setHasLoadedFilters] = useState(false);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [hasLoadedQuality, setHasLoadedQuality] = useState(false);

  useEffect(() => {
    // Sempre carrega os itens da queue primeiro
    fetchItems();
  }, [fetchItems]);

  // Lazy load das outras abas
  useEffect(() => {
    if (activeTab === 'filters' && !hasLoadedFilters) {
      fetchContentFilters();
      setHasLoadedFilters(true);
    }
    if (activeTab === 'settings' && !hasLoadedSettings) {
      fetchModerationSettings();
      setHasLoadedSettings(true);
    }
    if (activeTab === 'quality' && !hasLoadedQuality) {
      fetchQualitySettings();
      setHasLoadedQuality(true);
    }
  }, [activeTab, hasLoadedFilters, hasLoadedSettings, hasLoadedQuality, fetchContentFilters, fetchModerationSettings, fetchQualitySettings]);

  const handleDecision = async (itemId: string, decision: 'approved' | 'rejected', itemType: string) => {
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          action: decision === 'approved' ? 'approve' : 'reject',
          type: itemType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to moderate item');
      }

      // Remove o item da lista para dar feedback na UI
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      console.log(`✅ Item ${itemId} has been ${decision}.`);
    } catch (error) {
      console.error('Error moderating item:', error);
      // Aqui você pode adicionar um toast de erro
    }
  };

  // Content Filters Functions
  const addCustomPrompt = async () => {
    if (!newCustomPrompt.trim()) return;
    
    try {
      const response = await fetch('/api/admin/settings/negative-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          prompt: newCustomPrompt.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContentFilters(data.settings);
        setNewCustomPrompt('');
        toast.success('Custom filter added successfully!');
      }
    } catch (error) {
      console.error('Error adding custom prompt:', error);
      toast.error('Failed to add custom filter');
    }
  };

  const removeCustomPrompt = async (prompt: string) => {
    try {
      const response = await fetch('/api/admin/settings/negative-prompts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        await fetchContentFilters();
        toast.success('Custom filter removed successfully!');
      }
    } catch (error) {
      console.error('Error removing custom prompt:', error);
      toast.error('Failed to remove custom filter');
    }
  };

  const toggleContentFilters = async () => {
    try {
      const response = await fetch('/api/admin/settings/negative-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContentFilters(data.settings);
        toast.success(`Content filtering ${data.settings.enabled ? 'enabled' : 'disabled'}!`);
      }
    } catch (error) {
      console.error('Error toggling content filters:', error);
      toast.error('Failed to toggle content filters');
    }
  };

  // Moderation Settings Functions
  const toggleModerationMode = async () => {
    setModerationLoading(true);
    try {
      const newStatus = !moderationEnabled;
      
      const response = await fetch('/api/admin/settings/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          moderationEnabled: newStatus,
          autoApprove: !newStatus 
        })
      });

      if (response.ok) {
        setModerationEnabled(newStatus);
        toast.success(`Moderation mode ${newStatus ? 'enabled' : 'disabled'}!`);
        // Refresh items since moderation mode affects what appears in queue
        fetchItems(true);
      }
    } catch (error) {
      console.error('Error toggling moderation mode:', error);
      toast.error('Failed to toggle moderation mode');
    } finally {
      setModerationLoading(false);
    }
  };

  // Quality Settings Functions
  const updateQualitySettings = async (newSettings: Partial<QualitySettings>) => {
    setQualityLoading(true);
    try {
      const response = await fetch('/api/admin/settings/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          settings: { ...qualitySettings, ...newSettings }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQualitySettings(data.settings);
        toast.success('Quality settings updated successfully!');
      }
    } catch (error) {
      console.error('Error updating quality settings:', error);
      toast.error('Failed to update quality settings');
    } finally {
      setQualityLoading(false);
    }
  };

  const renderSkeleton = () => (
    Array.from({ length: 4 }).map((_, i) => (
      <Card key={`skel-${i}`} className="cyber-card animate-pulse">
        <CardHeader>
          <div className="h-24 w-full bg-gray-700 rounded-lg"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-5 w-3/4 bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
          <div className="h-4 w-1/3 bg-gray-700 rounded"></div>
        </CardContent>
        <div className="flex justify-around p-4">
          <div className="h-10 w-24 bg-gray-700 rounded"></div>
          <div className="h-10 w-24 bg-gray-700 rounded"></div>
        </div>
      </Card>
    ))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-200">Content Moderation</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            Manage pending content and configure content filters.
          </p>
        </div>
        <Button variant="outline" className="border-cyan-500/30 w-full md:w-auto" onClick={() => fetchItems(true)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 cyber-card border-cyan-500/30">
          <TabsTrigger value="queue">
            <Shield className="w-4 h-4 mr-2" />
            Moderation Queue ({items.length})
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Filter className="w-4 h-4 mr-2" />
            Content Filters
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Zap className="w-4 h-4 mr-2" />
            Quality Settings
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Moderation Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-gray-400">
                  {loading ? 'Loading items...' : `${items.length} items total`}
                </p>
                {!loading && items.length > itemsPerPage && (
                  <p className="text-sm text-gray-500">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, items.length)}-{Math.min(currentPage * itemsPerPage, items.length)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Grid de Moderação */}
            {error && <p className="p-4 text-red-500 text-center">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? renderSkeleton() : items
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map(item => {
          const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.Jersey;
          const Icon = config.icon;

          return (
            <Card key={item.id} className="cyber-card flex flex-col justify-between">
              <CardHeader className="p-0">
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  width={300} 
                  height={300} 
                  className="rounded-t-lg aspect-square object-cover" 
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k="
                />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="flex items-center gap-1.5" variant="outline">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    {item.type}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <Info className="w-4 h-4 text-gray-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs break-words">
                        <pre className="text-xs">{JSON.stringify(item.details, null, 2)}</pre>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardTitle className="text-lg text-white">{item.name}</CardTitle>
                <div className="text-sm text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{item.creator?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(item.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-around p-4 border-t border-gray-800">
                <Button className="w-2/5 bg-green-500/20 hover:bg-green-500/30 text-green-400" onClick={() => handleDecision(item.id, 'approved', item.type)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button className="w-2/5 bg-red-500/20 hover:bg-red-500/30 text-red-400" onClick={() => handleDecision(item.id, 'rejected', item.type)}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </Card>
          )
        })}
            </div>
            
            {/* Paginação */}
            {!loading && items.length > itemsPerPage && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-cyan-500/30"
                >
                  Previous
                </Button>
                <span className="text-gray-400">
                  Page {currentPage} of {Math.ceil(items.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(items.length / itemsPerPage)))}
                  disabled={currentPage >= Math.ceil(items.length / itemsPerPage)}
                  className="border-cyan-500/30"
                >
                  Next
                </Button>
              </div>
            )}
            
            {!loading && items.length === 0 && !error &&
              <div className="text-center py-20">
                <Shield className="mx-auto w-16 h-16 text-green-500" />
                <h2 className="mt-4 text-2xl font-semibold text-white">All Clear!</h2>
                <p className="mt-2 text-gray-400">The moderation queue is empty. Great job!</p>
              </div>
            }
          </div>
        </TabsContent>

        <TabsContent value="filters">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Content Filters</CardTitle>
              <CardDescription>Configure negative prompts to filter inappropriate content during AI generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center space-x-2">
                <Switch 
                  id="contentFiltersEnabled" 
                  checked={contentFilters.enabled} 
                  onCheckedChange={toggleContentFilters}
                  disabled={filtersLoading}
                />
                <Label htmlFor="contentFiltersEnabled">Enable Content Filtering</Label>
              </div>

              {/* Default Prompts */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Default Filters (System)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {contentFilters.defaultPrompts.map((prompt, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Shield className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="text-sm text-gray-300">{prompt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Prompts */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Custom Filters</Label>
                
                {/* Add New Custom Prompt */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom negative prompt..."
                    value={newCustomPrompt}
                    onChange={(e) => setNewCustomPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomPrompt()}
                    className="cyber-input flex-1"
                  />
                  <Button 
                    onClick={addCustomPrompt}
                    disabled={!newCustomPrompt.trim() || filtersLoading}
                    className="cyber-button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Custom Prompts List */}
                {contentFilters.customPrompts.length > 0 ? (
                  <div className="space-y-2">
                    {contentFilters.customPrompts.map((prompt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                        {editingPromptIndex === index ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input
                              value={editingPromptValue}
                              onChange={e => setEditingPromptValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEditPrompt(prompt, editingPromptValue);
                                if (e.key === 'Escape') cancelEditPrompt();
                              }}
                              className="cyber-input h-8 text-sm flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="cyber-button px-2 h-8"
                              onClick={() => saveEditPrompt(prompt, editingPromptValue)}
                              disabled={!editingPromptValue.trim() || editingPromptValue.trim() === prompt.trim()}
                              title="Save"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 px-2 h-8"
                              onClick={cancelEditPrompt}
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-gray-300 flex-1 truncate">{prompt}</span>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 h-8"
                                onClick={() => editCustomPrompt(index, prompt)}
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomPrompt(prompt)}
                                disabled={filtersLoading}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8"
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No custom filters added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Quality Settings</CardTitle>
              <CardDescription>Configure default generation quality and user permissions for AI content creation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Quality Setting */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Default Generation Quality</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={qualitySettings?.defaultQuality === 'standard' ? 'default' : 'outline'}
                    onClick={() => updateQualitySettings({ defaultQuality: 'standard' })}
                    disabled={qualityLoading}
                    className="p-4 h-auto flex flex-col items-start"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">Standard Quality</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Fast generation • Lower cost • Good for prototypes
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      ${qualitySettings?.standardCost.toFixed(3) || '0.000'} per generation
                    </div>
                  </Button>
                  
                  <Button
                    variant={qualitySettings?.defaultQuality === 'hd' ? 'default' : 'outline'}
                    onClick={() => updateQualitySettings({ defaultQuality: 'hd' })}
                    disabled={qualityLoading}
                    className="p-4 h-auto flex flex-col items-start"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">HD Quality</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      High resolution • Premium cost • Production ready
                    </div>
                    <div className="text-xs text-orange-400 mt-1">
                      ${qualitySettings?.hdCost.toFixed(3) || '0.000'} per generation
                    </div>
                  </Button>
                </div>
              </div>

              {/* User Choice Permission */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <div>
                      <Label className="text-base font-medium">Allow User Quality Choice</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        {qualitySettings?.allowUserChoice 
                          ? 'Users can choose between Standard and HD quality in generation interfaces' 
                          : 'Users are restricted to the default quality setting only'
                        }
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={qualitySettings?.allowUserChoice || false}
                    onCheckedChange={(checked) => updateQualitySettings({ allowUserChoice: checked })}
                    disabled={qualityLoading}
                    className="scale-110"
                  />
                </div>
              </div>

              {/* Cost Configuration */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Cost Configuration</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Standard Quality Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={qualitySettings?.standardCost || 0}
                      onChange={(e) => updateQualitySettings({ standardCost: parseFloat(e.target.value) || 0 })}
                      disabled={qualityLoading}
                      className="cyber-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">HD Quality Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={qualitySettings?.hdCost || 0}
                      onChange={(e) => updateQualitySettings({ hdCost: parseFloat(e.target.value) || 0 })}
                      disabled={qualityLoading}
                      className="cyber-input"
                    />
                  </div>
                </div>
              </div>

              {/* Generation Limits */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Usage Limits</Label>
                <div className="space-y-2">
                  <Label className="text-sm">Max Generations per User (per day)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={qualitySettings?.maxGenerationsPerUser || 50}
                    onChange={(e) => updateQualitySettings({ maxGenerationsPerUser: parseInt(e.target.value) || 50 })}
                    disabled={qualityLoading}
                    className="cyber-input"
                  />
                  <p className="text-xs text-gray-400">
                    Set daily generation limit to prevent abuse. Current: {qualitySettings?.maxGenerationsPerUser || 50} generations/day
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Quality Settings Impact:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>Default Quality:</strong> Applied when users don&apos;t have choice permission</li>
                      <li>• <strong>User Choice:</strong> Shows quality selector in Jersey, Stadium, and Badge editors</li>
                      <li>• <strong>Cost Settings:</strong> Affects generation cost calculations and billing</li>
                      <li>• <strong>Usage Limits:</strong> Prevents excessive API usage and controls costs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
              <CardDescription>Configure how new content is handled when submitted to the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Moderation Mode Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    {moderationEnabled ? (
                      <Shield className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Shield className="w-5 h-5 text-green-400" />
                    )}
                    <div>
                      <Label className="text-base font-medium">
                        {moderationEnabled ? 'Manual Moderation' : 'Auto-Approve Mode'}
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        {moderationEnabled 
                          ? 'New content requires manual approval before appearing in marketplace' 
                          : 'New content is automatically approved and appears in marketplace immediately'
                        }
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={moderationEnabled}
                    onCheckedChange={toggleModerationMode}
                    disabled={moderationLoading}
                    className="scale-110"
                  />
                </div>

                {/* Status Indicator */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${moderationEnabled ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                  <span className="text-gray-300">
                    Current Status: <span className={moderationEnabled ? 'text-yellow-400' : 'text-green-400'}>
                      {moderationEnabled ? 'Manual Review Required' : 'Auto-Approve Active'}
                    </span>
                  </span>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-400 mb-2">How it works:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• <strong>Auto-Approve:</strong> New jerseys, stadiums, and badges appear immediately in marketplace</li>
                        <li>• <strong>Manual Moderation:</strong> New content goes to moderation queue for review</li>
                        <li>• Content filters (negative prompts) are applied regardless of moderation mode</li>
                        <li>• You can change this setting at any time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 