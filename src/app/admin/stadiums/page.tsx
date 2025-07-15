'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building, Search, Filter, MoreHorizontal, Download, RefreshCw, Loader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Interfaces para Team References (reutilizáveis)
interface ReferenceImage {
  id: string;
  url: string;
  filename: string;
  uploadedAt: Date;
  description?: string;
  isPrimary?: boolean;
  metadata?: object;
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

// Adaptação para uma lista de Stadiums genérica, pode ser expandido depois
interface Stadium {
  id: string;
  name: string;
  createdAt: string;
  imageUrl: string;
}

// Definir tipo StadiumNFT para tabela
interface StadiumNFT {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

export default function StadiumsPage() {
  // Estados para lista principal (pode ser usado para stadiums gerados no futuro)
  const [stadiums, setStadiums] = useState<StadiumNFT[]>([]);
  const [stadiumsLoading, setStadiumsLoading] = useState(true);
  const [stadiumsError, setStadiumsError] = useState<string | null>(null);
  
  // Estados para Team References
  const [teamReferences, setTeamReferences] = useState<TeamReference[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadImageDialog, setShowUploadImageDialog] = useState(false);
  const [selectedForUpload, setSelectedForUpload] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estados para Edit Dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<TeamReference | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');

  const API_ENDPOINT = '/api/admin/stadiums/references';

  useEffect(() => {
    const fetchTeamReferences = async () => {
      setReferencesLoading(true);
      try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
          throw new Error('Failed to fetch stadium references');
        }
        const data = await response.json();
        setTeamReferences(data.data || []);
      } catch (err: any) {
        console.error('Error fetching stadium references:', err);
      } finally {
        setReferencesLoading(false);
      }
    };

    // Buscar stadiums gerados
    const fetchStadiums = async () => {
      setStadiumsLoading(true);
      setStadiumsError(null);
      try {
        const response = await fetch('/api/admin/stadiums');
        if (!response.ok) throw new Error('Failed to fetch stadiums');
        const data = await response.json();
        setStadiums(data);
      } catch (err: any) {
        setStadiumsError(err.message);
      } finally {
        setStadiumsLoading(false);
      }
    };

    fetchTeamReferences();
    fetchStadiums();
  }, []);

  const refreshReferences = async () => {
    setReferencesLoading(true);
    try {
      const response = await fetch(API_ENDPOINT);
      const data = await response.json();
      setTeamReferences(data.data || []);
    } finally {
      setReferencesLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newPrompt.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: newName.trim(),
          teamBasePrompt: newPrompt.trim(),
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create stadium reference');
      }

      await refreshReferences();
      setNewName('');
      setNewPrompt('');
      setShowCreateDialog(false);
      alert('Stadium reference created successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedForUpload) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamName', selectedForUpload);
      formData.append('description', `Reference image for ${selectedForUpload}`);

      const response = await fetch(`${API_ENDPOINT}?action=add-image`, {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      await refreshReferences();
      setShowUploadImageDialog(false);
      setSelectedForUpload('');
      alert('Image uploaded successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenEditDialog = (item: TeamReference) => {
    setEditingItem(item);
    setEditedPrompt(item.teamBasePrompt);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingItem || !editedPrompt.trim()) {
      alert('Prompt cannot be empty');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: editingItem._id,
          teamBasePrompt: editedPrompt.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update stadium reference');
      }

      await refreshReferences();
      setShowEditDialog(false);
      setEditingItem(null);
      setEditedPrompt('');
      alert('Stadium reference updated successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabela de Stadiums Gerados */}
      <Card className="cyber-card border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Generated Stadiums
          </CardTitle>
          <CardDescription className="text-gray-400">All stadium NFTs generated by users</CardDescription>
        </CardHeader>
        <CardContent>
          {stadiumsLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /><span className="ml-2 text-gray-400">Loading stadiums...</span></div>
          ) : stadiumsError ? (
            <div className="text-red-500 text-center p-8">{stadiumsError}</div>
          ) : stadiums.length === 0 ? (
            <div className="text-gray-400 text-center p-8">No stadiums found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/20 text-left text-sm text-cyan-300">
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Created At</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stadiums.map(stadium => (
                    <tr key={stadium.id} className="border-b border-gray-800 hover:bg-cyan-500/5">
                      <td className="p-3 text-gray-200">{stadium.name}</td>
                      <td className="p-3 text-gray-400">{new Date(stadium.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Card de Stadium References (NÃO ALTERAR) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Stadium Management</h1>
          <p className="text-gray-400 mt-2">Manage stadium references, base prompts, and reference images.</p>
        </div>
        <Button className="cyber-button" onClick={refreshReferences}>
            <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
          </Button>
      </div>
      
      <Card className="cyber-card border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-200 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Stadium References
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage references for Vision Generation
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="cyber-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stadium
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle className="text-gray-200">Create New Stadium Reference</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add a new stadium with a base prompt for generation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newName" className="text-gray-200">Stadium Name</Label>
                    <Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Maracanã" className="cyber-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPrompt" className="text-gray-200">Base Prompt</Label>
                    <Textarea id="newPrompt" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder="Base prompt for this stadium..." className="cyber-input min-h-[100px]" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreate} className="cyber-button">Create</Button>
            </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="references" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="references" className="data-[state=active]:bg-cyan-500/20">Stadiums</TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-cyan-500/20">Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="references" className="space-y-4 pt-4">
              {referencesLoading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /><span className="ml-2 text-gray-400">Loading...</span></div>
              ) : (
                <div className="grid gap-4">
                  {teamReferences.map((item) => (
                    <Card key={item._id} className="cyber-card border-gray-700">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-200">{item.teamName}</h3>
                              <Badge variant="outline" className="text-xs">{item.referenceImages.length} images</Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{item.teamBasePrompt}</p>
                            <div className="flex flex-wrap gap-2">
                              {item.referenceImages.slice(0, 5).map((img) => (
                                <div key={img.id} className="relative w-12 h-12 rounded-md overflow-hidden"><Image src={img.url} alt={img.filename} fill className="object-cover" /></div>
                              ))}
                              {item.referenceImages.length > 5 && (
                                <div className="w-12 h-12 rounded-md bg-gray-700 flex items-center justify-center"><span className="text-xs text-gray-400">+{item.referenceImages.length - 5}</span></div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedForUpload(item.teamName); setShowUploadImageDialog(true); }}>
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(item)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="images" className="space-y-4 pt-4">
               <Dialog open={showUploadImageDialog} onOpenChange={setShowUploadImageDialog}>
                  <DialogTrigger asChild>
                    <Button className="cyber-button w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
                    <DialogHeader>
                      <DialogTitle className="text-gray-200">Upload Reference Image</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="teamSelect" className="text-gray-200">Select Stadium</Label>
                        <Select value={selectedForUpload} onValueChange={setSelectedForUpload}>
                          <SelectTrigger className="cyber-input"><SelectValue placeholder="Choose a stadium" /></SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {teamReferences.map((team) => (<SelectItem key={team._id} value={team.teamName}>{team.teamName}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imageFile" className="text-gray-200">Image File</Label>
                        <Input id="imageFile" type="file" accept="image/*" onChange={handleUploadImage} className="cyber-input" disabled={uploadingImage} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowUploadImageDialog(false)}>Cancel</Button>
                      <Button disabled={!selectedForUpload || uploadingImage} className="cyber-button">
                        {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {teamReferences.flatMap(team => team.referenceImages.map(img => (
                  <Card key={img.id} className="cyber-card border-gray-700">
                    <CardContent className="p-2">
                      <div className="relative aspect-square rounded-md overflow-hidden mb-2"><Image src={img.url} alt={img.filename} fill className="object-cover" /></div>
                      <p className="text-xs font-medium text-gray-200 truncate">{team.teamName}</p>
                    </CardContent>
                  </Card>
                )))}
          </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Edit: {editingItem?.teamName}</DialogTitle>
            <DialogDescription className="text-gray-400">Update the base prompt.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editPrompt" className="text-gray-200">Base Prompt</Label>
              <Textarea id="editPrompt" value={editedPrompt} onChange={(e) => setEditedPrompt(e.target.value)} className="cyber-input min-h-[150px]" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} className="cyber-button">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
