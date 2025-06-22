'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  LucideImage,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  Search,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Palette,
  Layers,
  Grid3X3,
  FileImage,
  Zap
} from 'lucide-react'
import Image from 'next/image'

// Mock data - in production will come from APIs
const logosData = {
  stats: {
    totalLogos: 127,
    activeLogos: 98,
    pendingReview: 12,
    storageUsed: '2.4 GB',
    maxStorage: '10 GB'
  },
  categories: [
    {
      id: 'teams',
      name: 'Team Logos',
      count: 45,
      description: 'Official team emblems and badges'
    },
    {
      id: 'sponsors',
      name: 'Sponsor Logos',
      count: 32,
      description: 'Brand sponsors and partnerships'
    },
    {
      id: 'leagues',
      name: 'League Logos',
      count: 18,
      description: 'Championship and tournament logos'
    },
    {
      id: 'custom',
      name: 'Custom Graphics',
      count: 32,
      description: 'Custom designs and elements'
    }
  ],
  logos: [
    {
      id: 1,
      name: 'Flamengo Official',
      category: 'teams',
      url: '/logos/flamengo.png',
      size: '512x512',
      format: 'PNG',
      fileSize: '45.2 KB',
      status: 'active',
      uploadedAt: '2024-01-15',
      usageCount: 2847,
      tags: ['flamengo', 'team', 'official', 'red', 'black']
    },
    {
      id: 2,
      name: 'Palmeiras Shield',
      category: 'teams',
      url: '/logos/palmeiras.png',
      size: '512x512',
      format: 'PNG',
      fileSize: '38.7 KB',
      status: 'active',
      uploadedAt: '2024-01-15',
      usageCount: 2156,
      tags: ['palmeiras', 'team', 'official', 'green', 'white']
    },
    {
      id: 3,
      name: 'Nike Swoosh',
      category: 'sponsors',
      url: '/logos/nike.png',
      size: '256x256',
      format: 'PNG',
      fileSize: '12.4 KB',
      status: 'active',
      uploadedAt: '2024-01-12',
      usageCount: 1834,
      tags: ['nike', 'sponsor', 'brand', 'swoosh']
    },
    {
      id: 4,
      name: 'Brasileirão 2024',
      category: 'leagues',
      url: '/logos/brasileirao.png',
      size: '400x400',
      format: 'PNG',
      fileSize: '67.8 KB',
      status: 'pending',
      uploadedAt: '2024-01-20',
      usageCount: 0,
      tags: ['brasileirao', 'league', '2024', 'championship']
    },
    {
      id: 5,
      name: 'Custom Badge Template',
      category: 'custom',
      url: '/logos/custom-badge.png',
      size: '300x300',
      format: 'PNG',
      fileSize: '23.1 KB',
      status: 'active',
      uploadedAt: '2024-01-18',
      usageCount: 456,
      tags: ['custom', 'template', 'badge', 'generic']
    }
  ]
}

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

const categoryColors = {
  teams: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sponsors: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  leagues: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  custom: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
}

export default function LogosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedLogos, setSelectedLogos] = useState<number[]>([])
  const [uploadMode, setUploadMode] = useState(false)

  const filteredLogos = logosData.logos.filter(logo => {
    const matchesSearch = logo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         logo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || logo.category === filterCategory
    const matchesStatus = filterStatus === 'all' || logo.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleLogoAction = (logoId: number, action: string) => {
    alert(`${action} logo ${logoId}`)
  }

  const handleBulkAction = (action: string) => {
    alert(`${action} ${selectedLogos.length} selected logos`)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      alert(`Uploading ${files.length} file(s)...`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Logo Management</h1>
          <p className="text-gray-400 mt-2">Manage team logos, sponsors and custom graphics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            className="border-cyan-500/30"
            onClick={() => setUploadMode(!uploadMode)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Logos
          </Button>
          <Button className="cyber-button">
            <Settings className="w-4 h-4 mr-2" />
            Logo Settings
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      {uploadMode && (
        <Card className="cyber-card border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-cyan-400" />
              <span>Upload New Logos</span>
            </CardTitle>
            <CardDescription>Upload PNG, JPG, or SVG files. Maximum 5MB per file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center">
              <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300 mb-2">Drag and drop files here, or click to browse</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload">
                <Button variant="outline" className="border-cyan-500/30" asChild>
                  <span>Choose Files</span>
                </Button>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm">
                  <option value="teams">Team Logos</option>
                  <option value="sponsors">Sponsor Logos</option>
                  <option value="leagues">League Logos</option>
                  <option value="custom">Custom Graphics</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <Input placeholder="team, official, red, black..." className="cyber-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Auto-resize</label>
                <select className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm">
                  <option value="keep">Keep original size</option>
                  <option value="512">Resize to 512x512</option>
                  <option value="256">Resize to 256x256</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button className="cyber-button">
                <Zap className="w-4 h-4 mr-2" />
                Process Upload
              </Button>
              <Button variant="outline" onClick={() => setUploadMode(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total Logos</CardTitle>
            <LucideImage className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{logosData.stats.totalLogos}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active Logos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{logosData.stats.activeLogos}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Pending Review</CardTitle>
            <XCircle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">{logosData.stats.pendingReview}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Storage Used</CardTitle>
            <Layers className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-300">{logosData.stats.storageUsed}</div>
            <div className="text-xs text-gray-400">of {logosData.stats.maxStorage}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Categories</CardTitle>
            <Grid3X3 className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">{logosData.categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gallery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 cyber-card border-cyan-500/30">
          <TabsTrigger value="gallery" className="data-[state=active]:bg-cyan-500/20">
            Logo Gallery
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-cyan-500/20">
            Categories
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20">
            Logo Settings
          </TabsTrigger>
        </TabsList>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          {/* Filters */}
          <Card className="cyber-card border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logos by name or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 cyber-input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="teams">Team Logos</option>
                    <option value="sponsors">Sponsor Logos</option>
                    <option value="leagues">League Logos</option>
                    <option value="custom">Custom Graphics</option>
                  </select>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {selectedLogos.length > 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <span className="text-sm text-cyan-300">{selectedLogos.length} logos selected</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('Activate')}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Activate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('Deactivate')}>
                    <XCircle className="w-3 h-3 mr-1" />
                    Deactivate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('Delete')}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedLogos([])}>
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLogos.map((logo) => (
              <Card key={logo.id} className="cyber-card border-cyan-500/30 overflow-hidden">
                <div className="aspect-square bg-gray-800 relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className={categoryColors[logo.category as keyof typeof categoryColors]}>
                      {logosData.categories.find(c => c.id === logo.category)?.name}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className={statusColors[logo.status as keyof typeof statusColors]}>
                      {logo.status}
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2 z-20">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-600"
                      checked={selectedLogos.includes(logo.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogos([...selectedLogos, logo.id])
                        } else {
                          setSelectedLogos(selectedLogos.filter(id => id !== logo.id))
                        }
                      }}
                    />
                  </div>
                  {/* Placeholder for logo image */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <LucideImage className="w-16 h-16 text-gray-600" />
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-cyan-300">{logo.name}</h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {logo.size} • {logo.format} • {logo.fileSize}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {logo.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {logo.tags.length > 3 && (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                          +{logo.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Used {logo.usageCount} times</span>
                      <span>{logo.uploadedAt}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleLogoAction(logo.id, 'View')}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleLogoAction(logo.id, 'Edit')}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleLogoAction(logo.id, 'Download')}>
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleLogoAction(logo.id, 'Delete')}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {logosData.categories.map((category) => (
              <Card key={category.id} className="cyber-card border-cyan-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${categoryColors[category.id as keyof typeof categoryColors].replace('bg-', 'bg-').replace('/20', '')}`} />
                      <span>{category.name}</span>
                    </CardTitle>
                    <Badge className={categoryColors[category.id as keyof typeof categoryColors]}>
                      {category.count} logos
                    </Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-cyan-500/30">
                      <Eye className="w-3 h-3 mr-1" />
                      View All
                    </Button>
                    <Button size="sm" variant="outline" className="border-cyan-500/30">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Logo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Logo Configuration</CardTitle>
              <CardDescription>Global settings for logo management and processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Upload Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Max file size:</label>
                      <span className="text-cyan-300 font-medium">5 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Allowed formats:</label>
                      <span className="text-cyan-300 font-medium">PNG, JPG, SVG</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Auto-optimization:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Processing Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Background removal:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Auto-resize:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Format conversion:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
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