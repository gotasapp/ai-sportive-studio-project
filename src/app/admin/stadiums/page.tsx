'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building2,
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
  Image,
  Layers,
  Grid3X3,
  FileImage,
  Zap,
  MapPin,
  Users,
  Calendar,
  Star
} from 'lucide-react'

// Mock data - em produção virá de APIs
const stadiumsData = {
  stats: {
    totalStadiums: 45,
    activeStadiums: 38,
    pendingReview: 4,
    storageUsed: '1.8 GB',
    maxStorage: '5 GB'
  },
  categories: [
    {
      id: 'brazilian',
      name: 'Brazilian Stadiums',
      count: 25,
      description: 'Major Brazilian football stadiums'
    },
    {
      id: 'international',
      name: 'International',
      count: 12,
      description: 'Famous international stadiums'
    },
    {
      id: 'historic',
      name: 'Historic Venues',
      count: 8,
      description: 'Legendary football venues'
    }
  ],
  stadiums: [
    {
      id: 1,
      name: 'Maracanã',
      fullName: 'Estádio Jornalista Mário Filho',
      city: 'Rio de Janeiro',
      country: 'Brazil',
      capacity: 78838,
      category: 'brazilian',
      imageUrl: '/stadiums/maracana.jpg',
      backgroundUrl: '/stadiums/backgrounds/maracana-bg.jpg',
      status: 'active',
      uploadedAt: '2024-01-15',
      usageCount: 1847,
      tags: ['iconic', 'world-cup', 'flamengo', 'fluminense'],
      teams: ['Flamengo', 'Fluminense', 'Brazil National Team'],
      yearBuilt: 1950,
      renovated: 2013
    },
    {
      id: 2,
      name: 'Allianz Parque',
      fullName: 'Allianz Parque',
      city: 'São Paulo',
      country: 'Brazil',
      capacity: 43713,
      category: 'brazilian',
      imageUrl: '/stadiums/allianz-parque.jpg',
      backgroundUrl: '/stadiums/backgrounds/allianz-bg.jpg',
      status: 'active',
      uploadedAt: '2024-01-15',
      usageCount: 1456,
      tags: ['modern', 'palmeiras', 'arena'],
      teams: ['Palmeiras'],
      yearBuilt: 2014,
      renovated: null
    },
    {
      id: 3,
      name: 'Neo Química Arena',
      fullName: 'Neo Química Arena',
      city: 'São Paulo',
      country: 'Brazil',
      capacity: 49205,
      category: 'brazilian',
      imageUrl: '/stadiums/neo-quimica.jpg',
      backgroundUrl: '/stadiums/backgrounds/neo-quimica-bg.jpg',
      status: 'active',
      uploadedAt: '2024-01-15',
      usageCount: 1234,
      tags: ['modern', 'corinthians', 'arena'],
      teams: ['Corinthians'],
      yearBuilt: 2014,
      renovated: null
    },
    {
      id: 4,
      name: 'Camp Nou',
      fullName: 'Camp Nou',
      city: 'Barcelona',
      country: 'Spain',
      capacity: 99354,
      category: 'international',
      imageUrl: '/stadiums/camp-nou.jpg',
      backgroundUrl: '/stadiums/backgrounds/camp-nou-bg.jpg',
      status: 'pending',
      uploadedAt: '2024-01-20',
      usageCount: 0,
      tags: ['legendary', 'barcelona', 'largest'],
      teams: ['FC Barcelona'],
      yearBuilt: 1957,
      renovated: 2023
    },
    {
      id: 5,
      name: 'Wembley',
      fullName: 'Wembley Stadium',
      city: 'London',
      country: 'England',
      capacity: 90000,
      category: 'historic',
      imageUrl: '/stadiums/wembley.jpg',
      backgroundUrl: '/stadiums/backgrounds/wembley-bg.jpg',
      status: 'active',
      uploadedAt: '2024-01-18',
      usageCount: 789,
      tags: ['historic', 'england', 'finals'],
      teams: ['England National Team'],
      yearBuilt: 2007,
      renovated: null
    }
  ]
}

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

const categoryColors = {
  brazilian: 'bg-green-500/20 text-green-400 border-green-500/30',
  international: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  historic: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

export default function StadiumsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedStadiums, setSelectedStadiums] = useState<number[]>([])
  const [uploadMode, setUploadMode] = useState(false)

  const filteredStadiums = stadiumsData.stadiums.filter(stadium => {
    const matchesSearch = stadium.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stadium.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stadium.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || stadium.category === filterCategory
    const matchesStatus = filterStatus === 'all' || stadium.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleStadiumAction = (stadiumId: number, action: string) => {
    alert(`${action} stadium ${stadiumId}`)
  }

  const handleBulkAction = (action: string) => {
    alert(`${action} ${selectedStadiums.length} selected stadiums`)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      alert(`Uploading ${files.length} stadium image(s)...`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Stadium Management</h1>
          <p className="text-gray-400 mt-2">Manage stadium backgrounds and venue settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            className="border-cyan-500/30"
            onClick={() => setUploadMode(!uploadMode)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Stadium
          </Button>
          <Button className="cyber-button">
            <Settings className="w-4 h-4 mr-2" />
            Stadium Settings
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      {uploadMode && (
        <Card className="cyber-card border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-cyan-400" />
              <span>Upload New Stadium</span>
            </CardTitle>
            <CardDescription>Upload stadium images and background scenes. Recommended: 1920x1080 for backgrounds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stadium Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Stadium Image</label>
                <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-300 mb-2">Stadium photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="stadium-upload"
                  />
                  <label htmlFor="stadium-upload">
                    <Button variant="outline" className="border-cyan-500/30" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Background Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Background Scene</label>
                <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-6 text-center">
                  <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-300 mb-2">Background image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="background-upload"
                  />
                  <label htmlFor="background-upload">
                    <Button variant="outline" className="border-cyan-500/30" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stadium Name</label>
                <Input placeholder="e.g., Maracanã" className="cyber-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input placeholder="e.g., Rio de Janeiro" className="cyber-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Capacity</label>
                <Input type="number" placeholder="e.g., 78838" className="cyber-input" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm">
                  <option value="brazilian">Brazilian Stadiums</option>
                  <option value="international">International</option>
                  <option value="historic">Historic Venues</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <Input placeholder="iconic, world-cup, historic..." className="cyber-input" />
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
            <CardTitle className="text-sm font-medium text-gray-200">Total Stadiums</CardTitle>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{stadiumsData.stats.totalStadiums}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active Stadiums</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{stadiumsData.stats.activeStadiums}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Pending Review</CardTitle>
            <XCircle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">{stadiumsData.stats.pendingReview}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Storage Used</CardTitle>
            <Layers className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-300">{stadiumsData.stats.storageUsed}</div>
            <div className="text-xs text-gray-400">of {stadiumsData.stats.maxStorage}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Categories</CardTitle>
            <Grid3X3 className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">{stadiumsData.categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gallery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 cyber-card border-cyan-500/30">
          <TabsTrigger value="gallery" className="data-[state=active]:bg-cyan-500/20">
            Stadium Gallery
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-cyan-500/20">
            Categories
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20">
            Background Settings
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
                      placeholder="Search stadiums by name, city, or tags..."
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
                    <option value="brazilian">Brazilian Stadiums</option>
                    <option value="international">International</option>
                    <option value="historic">Historic Venues</option>
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

              {selectedStadiums.length > 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <span className="text-sm text-cyan-300">{selectedStadiums.length} stadiums selected</span>
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
                  <Button size="sm" variant="outline" onClick={() => setSelectedStadiums([])}>
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stadium Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStadiums.map((stadium) => (
              <Card key={stadium.id} className="cyber-card border-cyan-500/30 overflow-hidden">
                <div className="aspect-video bg-gray-800 relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className={categoryColors[stadium.category as keyof typeof categoryColors]}>
                      {stadiumsData.categories.find(c => c.id === stadium.category)?.name}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className={statusColors[stadium.status as keyof typeof statusColors]}>
                      {stadium.status}
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2 z-20">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-600"
                      checked={selectedStadiums.includes(stadium.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStadiums([...selectedStadiums, stadium.id])
                        } else {
                          setSelectedStadiums(selectedStadiums.filter(id => id !== stadium.id))
                        }
                      }}
                    />
                  </div>
                  {/* Placeholder for stadium image */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-gray-600" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="font-bold text-white text-lg">{stadium.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <MapPin className="w-3 h-3" />
                      <span>{stadium.city}, {stadium.country}</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{stadium.capacity.toLocaleString()} capacity</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{stadium.yearBuilt}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {stadium.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {stadium.tags.length > 3 && (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                          +{stadium.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-400">
                      <div>Teams: {stadium.teams.join(', ')}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span>Used {stadium.usageCount} times</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-yellow-400">Popular</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleStadiumAction(stadium.id, 'View')}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStadiumAction(stadium.id, 'Edit')}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStadiumAction(stadium.id, 'Download')}>
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStadiumAction(stadium.id, 'Delete')}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stadiumsData.categories.map((category) => (
              <Card key={category.id} className="cyber-card border-cyan-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${categoryColors[category.id as keyof typeof categoryColors].replace('bg-', 'bg-').replace('/20', '')}`} />
                      <span>{category.name}</span>
                    </CardTitle>
                    <Badge className={categoryColors[category.id as keyof typeof categoryColors]}>
                      {category.count} stadiums
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
                      Add Stadium
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
              <CardTitle>Background & Scene Configuration</CardTitle>
              <CardDescription>Configure how stadiums are used as backgrounds in NFT generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Background Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Enable stadium backgrounds:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Random stadium selection:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Team-specific stadiums:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Processing Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Auto-resize backgrounds:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Background blur effect:</label>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Optional</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Lighting adjustments:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Auto</Badge>
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