'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Shirt, Search, Filter, Eye, Trash2, Copy, MoreHorizontal, Download, RefreshCw, Loader2,
  Plus, Upload, Edit, Settings, ImageIcon, X
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'; // Adicionado para React.Fragment

// Definindo o tipo de Jersey com base na API
interface Jersey {
  id: string;
  name: string;
  creator?: {
    name: string;
    wallet: string;
  };
  createdAt: string;
  status: 'Minted' | 'Pending' | 'Error';
  imageUrl: string;
  mintCount: number;
  editionSize: number;
}

// Interfaces para Team References
interface ReferenceImage {
  id: string;
  url: string;
  filename: string;
  uploadedAt: Date;
  description?: string;
  isPrimary?: boolean;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
  };
}

interface TeamReference {
  _id?: string;
  teamName: string;
  category: 'jersey' | 'stadium' | 'badge';
  referenceImages: ReferenceImage[];
  teamBasePrompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const statusColors: { [key in Jersey['status']]: string } = {
  Minted: 'bg-green-500/20 text-green-400 border-green-500/30',
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Error: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function JerseysPage() {
  // Estados
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Estados para Team References
  const [teamReferences, setTeamReferences] = useState<TeamReference[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [showUploadImageDialog, setShowUploadImageDialog] = useState(false);
  const [selectedTeamForUpload, setSelectedTeamForUpload] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPrompt, setNewTeamPrompt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estados para Edit Team Dialog
  const [showEditTeamDialog, setShowEditTeamDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamReference | null>(null);
  const [editedTeamPrompt, setEditedTeamPrompt] = useState('');

  // Estado para controlar linhas expandidas
  const [openRow, setOpenRow] = useState<string | null>(null);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // PAGINATION STATE FOR TEAMS
  const [currentTeamPage, setCurrentTeamPage] = useState(1);
  const teamsPerPage = 8;
  const totalTeamPages = Math.ceil(teamReferences.length / teamsPerPage);
  const paginatedTeams = teamReferences.slice((currentTeamPage - 1) * teamsPerPage, currentTeamPage * teamsPerPage);

  // PAGINATION STATE FOR REFERENCE IMAGES
  const [currentImagePage, setCurrentImagePage] = useState(1);
  const imagesPerPage = 12;
  const allReferenceImages = teamReferences.flatMap(team => team.referenceImages.map(img => ({ ...img, teamName: team.teamName })));
  const totalImagePages = Math.ceil(allReferenceImages.length / imagesPerPage);
  const paginatedImages = allReferenceImages.slice((currentImagePage - 1) * imagesPerPage, currentImagePage * imagesPerPage);

  // Filtros aprimorados para dados reais
  const filteredJerseys = jerseys.filter(jersey => {
    // Busca por nome, creator, ou wallet
    const matchesSearch =
      jersey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jersey.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jersey.creator?.wallet || '').toLowerCase().includes(searchTerm.toLowerCase());
    // Filtro por status
    const matchesStatus = filterStatus === 'all' || jersey.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredJerseys.length / itemsPerPage);

  // Update currentPage if filters change and page became invalid
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredJerseys.length, totalPages]);

  useEffect(() => {
    const fetchJerseys = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/jerseys');
        if (!response.ok) {
          throw new Error('Failed to fetch jerseys');
        }
        const data: Jersey[] = await response.json();
        setJerseys(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeamReferences = async () => {
      setReferencesLoading(true);
      try {
        const response = await fetch('/api/admin/jerseys/references');
        if (!response.ok) {
          throw new Error('Failed to fetch team references');
        }
        const data = await response.json();
        setTeamReferences(data.data || []);
      } catch (err: any) {
        console.error('Error fetching team references:', err);
      } finally {
        setReferencesLoading(false);
      }
    };

    fetchJerseys();
    fetchTeamReferences();
  }, []);

  // Jerseys from current page
  const paginatedJerseys = filteredJerseys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Functions for Team References
  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamPrompt.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/jerseys/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: newTeamName.trim(),
          teamBasePrompt: newTeamPrompt.trim(),
          referenceImages: []
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team');
      }

      // Refresh team references
      const refResponse = await fetch('/api/admin/jerseys/references');
      const refData = await refResponse.json();
      setTeamReferences(refData.data || []);

      // Reset form
      setNewTeamName('');
      setNewTeamPrompt('');
      setShowCreateTeamDialog(false);
      
      alert('Team created successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTeamForUpload) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamName', selectedTeamForUpload);
      formData.append('description', `Reference image for ${selectedTeamForUpload}`);

      const response = await fetch('/api/admin/jerseys/references?action=add-image', {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      // Refresh team references
      const refResponse = await fetch('/api/admin/jerseys/references');
      const refData = await refResponse.json();
      setTeamReferences(refData.data || []);

      setShowUploadImageDialog(false);
      setSelectedTeamForUpload('');
      alert('Image uploaded successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenEditDialog = (team: TeamReference) => {
    setEditingTeam(team);
    setEditedTeamPrompt(team.teamBasePrompt);
    setShowEditTeamDialog(true);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !editedTeamPrompt.trim()) {
      alert('Prompt cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/admin/jerseys/references', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: editingTeam._id,
          teamBasePrompt: editedTeamPrompt.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update team');
      }

      // Refresh team references
      const refResponse = await fetch('/api/admin/jerseys/references');
      const refData = await refResponse.json();
      setTeamReferences(refData.data || []);

      // Reset form
      setShowEditTeamDialog(false);
      setEditingTeam(null);
      setEditedTeamPrompt('');
      
      alert('Team updated successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const renderSkeleton = () => (
    Array.from({ length: 4 }).map((_, i) => (
       <tr key={`skel-${i}`} className="border-b border-gray-800">
         <td className="p-4"><div className="h-10 w-10 bg-gray-700 rounded-md animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-40 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-24 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-20 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div></td>
       </tr>
    ))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-200">Jersey Management</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">Browse, review, and manage all generated jerseys.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="outline" className="border-cyan-500/30 w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="cyber-button w-full sm:w-auto" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Team References Section */}
      <Card className="cyber-card border-cyan-500/30">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
            <div>
              <CardTitle className="text-lg md:text-xl text-gray-200 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Team References Management
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm md:text-base">
                Manage team references, base prompts, and upload reference images for Vision Generation
              </CardDescription>
            </div>
            <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
              <DialogTrigger asChild>
                <Button className="cyber-button w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle className="text-gray-200">Create New Team</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add a new team with base prompt for jersey generation
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="teamName" className="text-gray-200">Team Name</Label>
                    <Input
                      id="teamName"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g., Manchester United"
                      className="cyber-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamPrompt" className="text-gray-200">Base Prompt</Label>
                    <Textarea
                      id="teamPrompt"
                      value={newTeamPrompt}
                      onChange={(e) => setNewTeamPrompt(e.target.value)}
                      placeholder="Base prompt for this team's jersey generation..."
                      className="cyber-input min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateTeamDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTeam} className="cyber-button">
                    Create Team
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teams" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="teams" className="data-[state=active]:bg-cyan-500/20">Teams</TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-cyan-500/20">Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teams" className="space-y-4">
              {referencesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="ml-2 text-gray-400">Loading team references...</span>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedTeams.map((team) => (
                      <Card key={team._id || team.teamName} className="cyber-card border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-normal text-gray-200">{team.teamName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {team.referenceImages.length} images
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 mb-3">{team.teamBasePrompt}</p>
                              <div className="flex flex-wrap gap-2">
                                {team.referenceImages.slice(0, 3).map((img) => (
                                  <div key={img.id} className="relative w-12 h-12 rounded-md overflow-hidden">
                                    <Image
                                      src={img.url}
                                      alt={img.filename}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                                {team.referenceImages.length > 3 && (
                                  <div className="w-12 h-12 rounded-md bg-gray-700 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">+{team.referenceImages.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTeamForUpload(team.teamName);
                                  setShowUploadImageDialog(true);
                                }}
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(team)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* PAGINAÇÃO DOS TIMES */}
                  {teamReferences.length > teamsPerPage && (
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-gray-400 text-sm">
                        Page {currentTeamPage} of {totalTeamPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentTeamPage === 1}
                          onClick={() => setCurrentTeamPage(currentTeamPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentTeamPage === totalTeamPages}
                          onClick={() => setCurrentTeamPage(currentTeamPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="images" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-200">Reference Images</h3>
                <Dialog open={showUploadImageDialog} onOpenChange={setShowUploadImageDialog}>
                  <DialogTrigger asChild>
                    <Button className="cyber-button">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
                    <DialogHeader>
                      <DialogTitle className="text-gray-200">Upload Reference Image</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Upload a reference image for a team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="teamSelect" className="text-gray-200">Select Team</Label>
                        <Select value={selectedTeamForUpload} onValueChange={setSelectedTeamForUpload}>
                          <SelectTrigger className="cyber-input">
                            <SelectValue placeholder="Choose a team" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {teamReferences.map((team) => (
                              <SelectItem key={team._id} value={team.teamName}>
                                {team.teamName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imageFile" className="text-gray-200">Image File</Label>
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={handleUploadImage}
                          className="cyber-input"
                          disabled={uploadingImage}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowUploadImageDialog(false)}>
                        Cancel
                      </Button>
                      <Button disabled={uploadingImage} className="cyber-button">
                        {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedImages.map(img => (
                  <Card key={img.id} className="cyber-card border-gray-700">
                    <CardContent className="p-4">
                      <div className="relative aspect-square rounded-md overflow-hidden mb-3">
                        <Image
                          src={img.url}
                          alt={img.filename}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-normal text-gray-200">{img.teamName}</p>
                        <p className="text-xs text-gray-400 truncate">{img.filename}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {img.isPrimary ? 'Primary' : 'Reference'}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* PAGINAÇÃO DAS IMAGENS */}
              {allReferenceImages.length > imagesPerPage && (
                <div className="flex justify-between items-center mt-4">
                  <span className="text-gray-400 text-sm">
                    Page {currentImagePage} of {totalImagePages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentImagePage === 1}
                      onClick={() => setCurrentImagePage(currentImagePage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentImagePage === totalImagePages}
                      onClick={() => setCurrentImagePage(currentImagePage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="cyber-card border-cyan-500/30">
        <CardContent className="py-2">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                {searchTerm.length === 0 && (
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                )}
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cyber-input pl-12" />
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="cyber-input w-full md:w-auto">
                <option value="all">All Statuses</option>
                <option value="Minted">Minted</option>
                <option value="Pending">Pending</option>
                <option value="Error">Error</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jerseys Table */}
      <Card className="cyber-card border-cyan-500/30">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="p-4 text-left font-semibold text-gray-200">Name</th>
                  <th className="p-4 text-left font-semibold text-gray-200">Creator</th>
                  <th className="p-4 text-left font-semibold text-gray-200">Status</th>
                  <th className="p-4 font-semibold text-gray-200 hidden sm:table-cell">Mint Progress</th>
                  <th className="p-4 font-semibold text-gray-200 hidden md:table-cell">Created At</th>
                  <th className="p-4 font-semibold text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeleton() : paginatedJerseys.map(jersey => (
                  <React.Fragment key={jersey.id}>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 align-top">
                        <div className="font-normal text-base md:text-lg text-white">{jersey.name}</div>
                        <div className="text-xs text-white/80">ID: {jersey.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white">{jersey.creator?.name || 'Unknown'}</div>
                        <div className="text-gray-400 text-xs">{jersey.creator?.wallet || 'Unknown'}</div>
                      </td>
                      <td className="p-4">
                        <Badge className={statusColors[jersey.status]}>{jersey.status}</Badge>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="text-white">{jersey.mintCount} / {jersey.editionSize}</div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                          <div className="bg-cyan-400 h-1.5 rounded-full" style={{width: `${(jersey.mintCount / jersey.editionSize) * 100}%`}}></div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-gray-400">{new Date(jersey.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="w-10 h-10" onClick={() => setOpenRow(openRow === jersey.id ? null : jersey.id)}>
                          {openRow === jersey.id ? <Eye className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                    {openRow === jersey.id && (
                      <tr className="bg-gray-900/80 border-b border-gray-800">
                        <td colSpan={7} className="p-6">
                          {/* Conteúdo expandido: detalhes, atributos, ações extras */}
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <h4 className="text-base md:text-lg font-semibold text-cyan-400 mb-2">Detalhes da Jersey</h4>
                              <div className="text-gray-300 text-sm mb-2">ID: {jersey.id}</div>
                              <div className="text-gray-300 text-sm mb-2">Criador: {jersey.creator?.name || 'Unknown'} ({jersey.creator?.wallet || 'Unknown'})</div>
                              <div className="text-gray-300 text-sm mb-2">Status: {jersey.status}</div>
                              <div className="text-gray-300 text-sm mb-2">Criada em: {new Date(jersey.createdAt).toLocaleString()}</div>
                              <div className="text-gray-300 text-sm mb-2">Edição: {jersey.mintCount} / {jersey.editionSize}</div>
                            </div>
                            {/* Espaço para ações extras, preview maior, etc */}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {/* PAGINATION */}
          {!loading && filteredJerseys.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeamDialog} onOpenChange={setShowEditTeamDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Edit Team: {editingTeam?.teamName}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the base prompt for this team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editTeamPrompt" className="text-gray-200">Base Prompt</Label>
              <Textarea
                id="editTeamPrompt"
                value={editedTeamPrompt}
                onChange={(e) => setEditedTeamPrompt(e.target.value)}
                placeholder="Base prompt for this team's jersey generation..."
                className="cyber-input min-h-[150px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTeam} className="cyber-button">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 

// Adicionando media queries para responsividade
;<style jsx>{`
  @media (max-width: 768px) {
    .flex-col {
      flex-direction: column;
    }
    .text-3xl {
      font-size: 1.5rem;
    }
    .p-4 {
      padding: 1rem;
    }
    .space-y-8 > :not([hidden]) ~ :not([hidden]) {
      --tw-space-y-reverse: 0;
      margin-top: calc(2rem * calc(1 - var(--tw-space-y-reverse)));
      margin-bottom: calc(2rem * var(--tw-space-y-reverse));
    }
  }
`}</style>