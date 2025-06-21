'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Settings,
  Key,
  Database,
  Shield,
  Bell,
  Palette,
  Globe,
  Zap,
  Server,
  Lock,
  Mail,
  Smartphone,
  Cloud,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2
} from 'lucide-react'

// Mock data - em produção virá de APIs
const settingsData = {
  general: {
    siteName: 'CHZ Sports NFT Generator',
    siteDescription: 'AI-powered sports NFT generation platform',
    adminEmail: 'admin@chzsports.com',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    maintenanceMode: false,
    debugMode: false
  },
  api: {
    openaiKey: 'sk-proj-************************************',
    thirdwebKey: 'tw-************************************',
    engineUrl: 'https://engine.thirdweb.com',
    ipfsGateway: 'https://ipfs.io/ipfs/',
    webhookSecret: 'whsec_************************************',
    rateLimits: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    }
  },
  blockchain: {
    network: 'polygon-amoy',
    contractAddress: '0x7822698cE3728Ccd54e36E60c413a70b665A1407',
    gasLimit: 500000,
    maxFeePerGas: '30',
    maxPriorityFeePerGas: '2',
    confirmations: 1
  },
  dalle: {
    model: 'dall-e-3',
    quality: 'hd',
    size: '1024x1024',
    style: 'vivid',
    maxRetries: 3,
    timeout: 60,
    contentPolicy: 'strict'
  },
  notifications: {
    emailEnabled: true,
    slackEnabled: false,
    discordEnabled: true,
    webhooksEnabled: true,
    alertThresholds: {
      errorRate: 5,
      responseTime: 2000,
      queueSize: 100
    }
  },
  security: {
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireMFA: false,
    allowedOrigins: ['https://chzsports.com', 'https://www.chzsports.com'],
    corsEnabled: true
  }
}

export default function SettingsPage() {
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaving(false)
      setHasChanges(false)
      alert('Settings saved successfully!')
    }, 2000)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setHasChanges(false)
      alert('Settings reset to defaults')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">System Settings</h1>
          <p className="text-gray-400 mt-2">Configure platform settings and integrations</p>
        </div>
        <div className="flex items-center space-x-4">
          {hasChanges && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} className="border-red-500/30 text-red-400">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            className="cyber-button"
            disabled={!hasChanges || saving}
          >
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 cyber-card border-cyan-500/30">
          <TabsTrigger value="general" className="data-[state=active]:bg-cyan-500/20">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-cyan-500/20">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="data-[state=active]:bg-cyan-500/20">
            <Database className="w-4 h-4 mr-2" />
            Blockchain
          </TabsTrigger>
          <TabsTrigger value="dalle" className="data-[state=active]:bg-cyan-500/20">
            <Palette className="w-4 h-4 mr-2" />
            DALL-E 3
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500/20">
            <Bell className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-cyan-500/20">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>General Configuration</CardTitle>
              <CardDescription>Basic platform settings and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Name</label>
                    <Input 
                      defaultValue={settingsData.general.siteName} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Email</label>
                    <Input 
                      defaultValue={settingsData.general.adminEmail} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select 
                      defaultValue={settingsData.general.timezone}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                      onChange={() => setHasChanges(true)}
                    >
                      <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Description</label>
                    <textarea 
                      defaultValue={settingsData.general.siteDescription}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm min-h-[80px]"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select 
                      defaultValue={settingsData.general.language}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                      onChange={() => setHasChanges(true)}
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Maintenance Mode</label>
                      <Badge className={settingsData.general.maintenanceMode ? 
                        "bg-red-500/20 text-red-400 border-red-500/30" : 
                        "bg-green-500/20 text-green-400 border-green-500/30"
                      }>
                        {settingsData.general.maintenanceMode ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Debug Mode</label>
                      <Badge className={settingsData.general.debugMode ? 
                        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
                        "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {settingsData.general.debugMode ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-cyan-400" />
                <span>API Keys & Secrets</span>
              </CardTitle>
              <CardDescription>Manage external service integrations and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI */}
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-300">OpenAI API Key</h3>
                      <p className="text-xs text-gray-400">For DALL-E 3 image generation</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Input 
                    type={showSecrets.openai ? 'text' : 'password'}
                    defaultValue={settingsData.api.openaiKey}
                    className="cyber-input font-mono text-sm"
                    onChange={() => setHasChanges(true)}
                  />
                  <Button size="sm" variant="outline" onClick={() => toggleSecret('openai')}>
                    {showSecrets.openai ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(settingsData.api.openaiKey)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Thirdweb */}
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Database className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-300">Thirdweb API Key</h3>
                      <p className="text-xs text-gray-400">For blockchain operations</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Input 
                    type={showSecrets.thirdweb ? 'text' : 'password'}
                    defaultValue={settingsData.api.thirdwebKey}
                    className="cyber-input font-mono text-sm"
                    onChange={() => setHasChanges(true)}
                  />
                  <Button size="sm" variant="outline" onClick={() => toggleSecret('thirdweb')}>
                    {showSecrets.thirdweb ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(settingsData.api.thirdwebKey)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Engine URL */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Engine URL</label>
                  <Input 
                    defaultValue={settingsData.api.engineUrl} 
                    className="cyber-input"
                    onChange={() => setHasChanges(true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">IPFS Gateway</label>
                  <Input 
                    defaultValue={settingsData.api.ipfsGateway} 
                    className="cyber-input"
                    onChange={() => setHasChanges(true)}
                  />
                </div>
              </div>

              {/* Rate Limits */}
              <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <h3 className="font-semibold text-cyan-300 mb-4">Rate Limits</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Per Minute</label>
                    <Input 
                      type="number"
                      defaultValue={settingsData.api.rateLimits.perMinute} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Per Hour</label>
                    <Input 
                      type="number"
                      defaultValue={settingsData.api.rateLimits.perHour} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Per Day</label>
                    <Input 
                      type="number"
                      defaultValue={settingsData.api.rateLimits.perDay} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blockchain Settings */}
        <TabsContent value="blockchain" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-cyan-400" />
                <span>Blockchain Configuration</span>
              </CardTitle>
              <CardDescription>Configure blockchain network and contract settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Network</label>
                    <select 
                      defaultValue={settingsData.blockchain.network}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                      onChange={() => setHasChanges(true)}
                    >
                      <option value="polygon-amoy">Polygon Amoy (Testnet)</option>
                      <option value="polygon">Polygon Mainnet</option>
                      <option value="ethereum">Ethereum Mainnet</option>
                      <option value="sepolia">Sepolia Testnet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contract Address</label>
                    <Input 
                      defaultValue={settingsData.blockchain.contractAddress} 
                      className="cyber-input font-mono text-sm"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gas Limit</label>
                    <Input 
                      type="number"
                      defaultValue={settingsData.blockchain.gasLimit} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Fee Per Gas (Gwei)</label>
                    <Input 
                      defaultValue={settingsData.blockchain.maxFeePerGas} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Priority Fee (Gwei)</label>
                    <Input 
                      defaultValue={settingsData.blockchain.maxPriorityFeePerGas} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Required Confirmations</label>
                    <Input 
                      type="number"
                      defaultValue={settingsData.blockchain.confirmations} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DALL-E Settings */}
        <TabsContent value="dalle" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-cyan-400" />
                <span>DALL-E 3 Configuration</span>
              </CardTitle>
              <CardDescription>Configure AI image generation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <select 
                      defaultValue={settingsData.dalle.model}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                      onChange={() => setHasChanges(true)}
                    >
                      <option value="dall-e-3">DALL-E 3</option>
                      <option value="dall-e-2">DALL-E 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quality</label>
                    <select 
                      defaultValue={settingsData.dalle.quality}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                      onChange={() => setHasChanges(true)}
                    >
                      <option value="hd">HD Quality</option>
                      <option value="standard">Standard Quality</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Image Size</label>
                    <select 
                      defaultValue={settingsData.dalle.size}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                      onChange={() => setHasChanges(true)}
                    >
                      <option value="1024x1024">1024x1024</option>
                      <option value="1024x1792">1024x1792</option>
                      <option value="1792x1024">1792x1024</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Style</label>
                    <select 
                      defaultValue={settingsData.dalle.style}
                      className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                      onChange={() => setHasChanges(true)}
                    >
                      <option value="vivid">Vivid</option>
                      <option value="natural">Natural</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Retries</label>
                    <Input 
                      type="number"
                      defaultValue={settingsData.dalle.maxRetries} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timeout (seconds)</label>
                    <Input 
                      type="number"
                      defaultValue={settingsData.dalle.timeout} 
                      className="cyber-input"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-cyan-400" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>Configure alerts and notification channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Notification Channels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Email Notifications</span>
                      </div>
                      <Badge className={settingsData.notifications.emailEnabled ? 
                        "bg-green-500/20 text-green-400 border-green-500/30" : 
                        "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {settingsData.notifications.emailEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Discord Webhooks</span>
                      </div>
                      <Badge className={settingsData.notifications.discordEnabled ? 
                        "bg-green-500/20 text-green-400 border-green-500/30" : 
                        "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {settingsData.notifications.discordEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Custom Webhooks</span>
                      </div>
                      <Badge className={settingsData.notifications.webhooksEnabled ? 
                        "bg-green-500/20 text-green-400 border-green-500/30" : 
                        "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {settingsData.notifications.webhooksEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Alert Thresholds</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Error Rate (%)</label>
                      <Input 
                        type="number"
                        defaultValue={settingsData.notifications.alertThresholds.errorRate} 
                        className="cyber-input"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Response Time (ms)</label>
                      <Input 
                        type="number"
                        defaultValue={settingsData.notifications.alertThresholds.responseTime} 
                        className="cyber-input"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Queue Size</label>
                      <Input 
                        type="number"
                        defaultValue={settingsData.notifications.alertThresholds.queueSize} 
                        className="cyber-input"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>Configure authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Authentication</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Session Timeout (hours)</label>
                      <Input 
                        type="number"
                        defaultValue={settingsData.security.sessionTimeout} 
                        className="cyber-input"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                      <Input 
                        type="number"
                        defaultValue={settingsData.security.maxLoginAttempts} 
                        className="cyber-input"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Password Length</label>
                      <Input 
                        type="number"
                        defaultValue={settingsData.security.passwordMinLength} 
                        className="cyber-input"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require MFA</span>
                      <Badge className={settingsData.security.requireMFA ? 
                        "bg-green-500/20 text-green-400 border-green-500/30" : 
                        "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {settingsData.security.requireMFA ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">CORS & Origins</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CORS Enabled</span>
                      <Badge className={settingsData.security.corsEnabled ? 
                        "bg-green-500/20 text-green-400 border-green-500/30" : 
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {settingsData.security.corsEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Allowed Origins</label>
                      <textarea 
                        defaultValue={settingsData.security.allowedOrigins.join('\n')}
                        className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm min-h-[100px]"
                        placeholder="https://example.com&#10;https://www.example.com"
                        onChange={() => setHasChanges(true)}
                      />
                      <p className="text-xs text-gray-400 mt-1">One origin per line</p>
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