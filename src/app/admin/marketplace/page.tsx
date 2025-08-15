'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import AdminProtection from '@/components/AdminProtection';
import {
  Settings,
  ShoppingBag,
  Gavel,
  Percent,
  Shield,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface MarketplaceConfig {
  // Direct Listings
  directListingsEnabled: boolean;
  defaultListingDuration: number; // em dias
  minListingPrice: string; // em CHZ
  maxListingPrice: string; // em CHZ
  
  // Auctions
  auctionsEnabled: boolean;
  defaultAuctionDuration: number; // em horas
  minAuctionDuration: number; // em horas
  maxAuctionDuration: number; // em horas
  minBidIncrement: string; // porcentagem
  
  // Offers
  offersEnabled: boolean;
  defaultOfferDuration: number; // em dias
  minOfferAmount: string; // em CHZ
  
  // Fees
  platformFeePercentage: string;
  royaltyFeePercentage: string;
  
  // Security
  moderationEnabled: boolean;
  autoApproveListings: boolean;
  requireKYC: boolean;
  
  // Contract Addresses
  marketplaceContract: string;
  jerseysContract: string;
  stadiumsContract: string;
  badgesContract: string;
}

export default function AdminMarketplace() {
  const [config, setConfig] = useState<MarketplaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMarketplaceConfig();
  }, []);

  const loadMarketplaceConfig = async () => {
    setLoading(true);
    try {
      // TODO: Implementar API real
      // Mock data por enquanto
      const mockConfig: MarketplaceConfig = {
        directListingsEnabled: true,
        defaultListingDuration: 30,
        minListingPrice: '0.01',
        maxListingPrice: '1000',
        auctionsEnabled: true,
        defaultAuctionDuration: 24,
        minAuctionDuration: 1,
        maxAuctionDuration: 168, // 7 dias
        minBidIncrement: '5',
        offersEnabled: true,
        defaultOfferDuration: 7,
        minOfferAmount: '0.005',
        platformFeePercentage: '2.5',
        royaltyFeePercentage: '5',
        moderationEnabled: true,
        autoApproveListings: false,
        requireKYC: false,
        marketplaceContract: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ || '',
        jerseysContract: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CHZ || '',
        stadiumsContract: process.env.NEXT_PUBLIC_STADIUM_CONTRACT_ADDRESS_CHZ || '',
        badgesContract: process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS_CHZ || '',
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configurações do marketplace');
    } finally {
      setLoading(false);
    }
  };

  const saveMarketplaceConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      // TODO: Implementar API real para salvar configuração
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      toast.success('Configurações do marketplace atualizadas!');
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof MarketplaceConfig, value: any) => {
    if (config) {
      setConfig({ ...config, [key]: value });
    }
  };

  if (loading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-[#FF0052] border-t-transparent rounded-full"></div>
          </div>
        </div>
      </AdminProtection>
    );
  }

  if (!config) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#FDFDFD] mb-2">Erro ao Carregar</h1>
            <p className="text-[#FDFDFD]/70 mb-4">Não foi possível carregar as configurações</p>
            <Button onClick={loadMarketplaceConfig} className="bg-[#FF0052] hover:bg-[#FF0052]/90">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </AdminProtection>
    );
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-[#FF0052]" />
              <h1 className="text-3xl font-bold text-[#FDFDFD]">Configurações do Marketplace</h1>
            </div>
            <p className="text-[#FDFDFD]/70">Configure as funcionalidades e políticas do marketplace</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-[#333333]/20">
              <TabsTrigger value="general" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">Geral</TabsTrigger>
              <TabsTrigger value="trading" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">Negociação</TabsTrigger>
              <TabsTrigger value="fees" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">Taxas</TabsTrigger>
              <TabsTrigger value="contracts" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">Contratos</TabsTrigger>
            </TabsList>

            {/* Geral */}
            <TabsContent value="general" className="space-y-6">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-[#FDFDFD] flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configurações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#FDFDFD] font-medium">Moderação Habilitada</Label>
                      <p className="text-sm text-[#FDFDFD]/70">Requer aprovação manual para listagens</p>
                    </div>
                    <Switch
                      checked={config.moderationEnabled}
                      onCheckedChange={(checked) => updateConfig('moderationEnabled', checked)}
                    />
                  </div>

                  <Separator className="bg-[#FDFDFD]/10" />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#FDFDFD] font-medium">Aprovação Automática</Label>
                      <p className="text-sm text-[#FDFDFD]/70">Listagens são aprovadas automaticamente</p>
                    </div>
                    <Switch
                      checked={config.autoApproveListings}
                      onCheckedChange={(checked) => updateConfig('autoApproveListings', checked)}
                    />
                  </div>

                  <Separator className="bg-[#FDFDFD]/10" />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#FDFDFD] font-medium">KYC Obrigatório</Label>
                      <p className="text-sm text-[#FDFDFD]/70">Usuários devem verificar identidade</p>
                    </div>
                    <Switch
                      checked={config.requireKYC}
                      onCheckedChange={(checked) => updateConfig('requireKYC', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Negociação */}
            <TabsContent value="trading" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Direct Listings */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="text-[#FDFDFD] flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Vendas Diretas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[#FDFDFD]">Habilitado</Label>
                      <Switch
                        checked={config.directListingsEnabled}
                        onCheckedChange={(checked) => updateConfig('directListingsEnabled', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#FDFDFD]">Duração Padrão (dias)</Label>
                      <Input
                        type="number"
                        value={config.defaultListingDuration}
                        onChange={(e) => updateConfig('defaultListingDuration', parseInt(e.target.value))}
                        className="cyber-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#FDFDFD]">Preço Mínimo (CHZ)</Label>
                        <Input
                          value={config.minListingPrice}
                          onChange={(e) => updateConfig('minListingPrice', e.target.value)}
                          className="cyber-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#FDFDFD]">Preço Máximo (CHZ)</Label>
                        <Input
                          value={config.maxListingPrice}
                          onChange={(e) => updateConfig('maxListingPrice', e.target.value)}
                          className="cyber-input"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Auctions */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="text-[#FDFDFD] flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Leilões
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[#FDFDFD]">Habilitado</Label>
                      <Switch
                        checked={config.auctionsEnabled}
                        onCheckedChange={(checked) => updateConfig('auctionsEnabled', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#FDFDFD]">Duração Padrão (horas)</Label>
                      <Input
                        type="number"
                        value={config.defaultAuctionDuration}
                        onChange={(e) => updateConfig('defaultAuctionDuration', parseInt(e.target.value))}
                        className="cyber-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#FDFDFD]">Duração Mín. (h)</Label>
                        <Input
                          type="number"
                          value={config.minAuctionDuration}
                          onChange={(e) => updateConfig('minAuctionDuration', parseInt(e.target.value))}
                          className="cyber-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#FDFDFD]">Duração Máx. (h)</Label>
                        <Input
                          type="number"
                          value={config.maxAuctionDuration}
                          onChange={(e) => updateConfig('maxAuctionDuration', parseInt(e.target.value))}
                          className="cyber-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#FDFDFD]">Incremento Mínimo (%)</Label>
                      <Input
                        value={config.minBidIncrement}
                        onChange={(e) => updateConfig('minBidIncrement', e.target.value)}
                        className="cyber-input"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Offers */}
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-[#FDFDFD]">Ofertas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[#FDFDFD]">Habilitado</Label>
                      <Switch
                        checked={config.offersEnabled}
                        onCheckedChange={(checked) => updateConfig('offersEnabled', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#FDFDFD]">Duração Padrão (dias)</Label>
                      <Input
                        type="number"
                        value={config.defaultOfferDuration}
                        onChange={(e) => updateConfig('defaultOfferDuration', parseInt(e.target.value))}
                        className="cyber-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#FDFDFD]">Valor Mínimo (CHZ)</Label>
                      <Input
                        value={config.minOfferAmount}
                        onChange={(e) => updateConfig('minOfferAmount', e.target.value)}
                        className="cyber-input"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Taxas */}
            <TabsContent value="fees" className="space-y-6">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-[#FDFDFD] flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Configuração de Taxas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[#FDFDFD]">Taxa da Plataforma (%)</Label>
                      <Input
                        value={config.platformFeePercentage}
                        onChange={(e) => updateConfig('platformFeePercentage', e.target.value)}
                        className="cyber-input"
                      />
                      <p className="text-xs text-[#FDFDFD]/70">
                        Taxa cobrada em cada transação
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#FDFDFD]">Taxa de Royalty (%)</Label>
                      <Input
                        value={config.royaltyFeePercentage}
                        onChange={(e) => updateConfig('royaltyFeePercentage', e.target.value)}
                        className="cyber-input"
                      />
                      <p className="text-xs text-[#FDFDFD]/70">
                        Taxa paga aos criadores originais
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contratos */}
            <TabsContent value="contracts" className="space-y-6">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-[#FDFDFD]">Endereços dos Contratos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#FDFDFD]">Marketplace Contract</Label>
                    <div className="flex gap-2">
                      <Input
                        value={config.marketplaceContract}
                        onChange={(e) => updateConfig('marketplaceContract', e.target.value)}
                        className="cyber-input flex-1"
                        placeholder="0x..."
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#FDFDFD]">Jerseys Contract</Label>
                    <div className="flex gap-2">
                      <Input
                        value={config.jerseysContract}
                        onChange={(e) => updateConfig('jerseysContract', e.target.value)}
                        className="cyber-input flex-1"
                        placeholder="0x..."
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#FDFDFD]">Stadiums Contract</Label>
                    <div className="flex gap-2">
                      <Input
                        value={config.stadiumsContract}
                        onChange={(e) => updateConfig('stadiumsContract', e.target.value)}
                        className="cyber-input flex-1"
                        placeholder="0x..."
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#FDFDFD]">Badges Contract</Label>
                    <div className="flex gap-2">
                      <Input
                        value={config.badgesContract}
                        onChange={(e) => updateConfig('badgesContract', e.target.value)}
                        className="cyber-input flex-1"
                        placeholder="0x..."
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <Button
              onClick={saveMarketplaceConfig}
              disabled={saving}
              className="bg-[#FF0052] hover:bg-[#FF0052]/90 px-8"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminProtection>
  );
} 