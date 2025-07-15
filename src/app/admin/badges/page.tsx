'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge as UiBadge } from '@/components/ui/badge' // Renomeado para evitar conflito
import { Input } from '@/components/ui/input'
import { 
  Badge, Search, Filter, MoreHorizontal, Download, RefreshCw, Loader2,
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

// Interfaces (reutilizáveis)
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

// Definir tipo Badge para tabela
interface BadgeNFT {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

export default function BadgesPage() {
  const [references, setReferences] = useState<TeamReference[]>([]);
  const [loading, setLoading] = useState(true);
  // Novo estado para badges gerados
  const [badges, setBadges] = useState<BadgeNFT[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgesError, setBadgesError] = useState<string | null>(null);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadImageDialog, setShowUploadImageDialog] = useState(false);
  const [selectedForUpload, setSelectedForUpload] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<TeamReference | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');

  const API_ENDPOINT = '/api/admin/badges/references';

  const fetchReferences = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch badge references');
      const data = await response.json();
      setReferences(data.data || []);
    } catch (err: any) {
      console.error('Error fetching badge references:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
    // Buscar badges gerados
    const fetchBadges = async () => {
      setBadgesLoading(true);
      setBadgesError(null);
      try {
        const response = await fetch('/api/admin/badges');
        if (!response.ok) throw new Error('Failed to fetch badges');
        const data = await response.json();
        setBadges(data);
      } catch (err: any) {
        setBadgesError(err.message);
      } finally {
        setBadgesLoading(false);
      }
    };
    fetchBadges();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newPrompt.trim()) return alert('Please fill in all fields');
    try {
      await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: newName.trim(), teamBasePrompt: newPrompt.trim() })
      });
      await fetchReferences();
      setShowCreateDialog(false);
      setNewName('');
      setNewPrompt('');
    } catch (error) { alert('Failed to create badge reference'); }
  };

  const handleUpdate = async () => {
    if (!editingItem || !editedPrompt.trim()) return;
    try {
      await fetch(API_ENDPOINT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: editingItem._id, teamBasePrompt: editedPrompt.trim() })
      });
      await fetchReferences();
      setShowEditDialog(false);
    } catch (error) { alert('Failed to update badge reference'); }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedForUpload) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamName', selectedForUpload);
      await fetch(`${API_ENDPOINT}?action=add-image`, { method: 'PATCH', body: formData });
      await fetchReferences();
      setShowUploadImageDialog(false);
    } catch (error) { alert('Failed to upload image'); } 
    finally { setUploadingImage(false); }
  };
  
  const handleOpenEditDialog = (item: TeamReference) => {
    setEditingItem(item);
    setEditedPrompt(item.teamBasePrompt);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Badge Management</h1>
          <p className="text-gray-400 mt-2">Manage badge references, base prompts, and reference images.</p>
        </div>
        <Button className="cyber-button" onClick={fetchReferences}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>
      
      {/* Tabela de Badges Gerados */}
      <Card className="cyber-card border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200 flex items-center gap-2">
            <Badge className="w-5 h-5" />
            Generated Badges
          </CardTitle>
          <CardDescription className="text-gray-400">All badge NFTs generated by users</CardDescription>
        </CardHeader>
        <CardContent>
          {badgesLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /><span className="ml-2 text-gray-400">Loading badges...</span></div>
          ) : badgesError ? (
            <div className="text-red-500 text-center p-8">{badgesError}</div>
          ) : badges.length === 0 ? (
            <div className="text-gray-400 text-center p-8">No badges found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="p-4 font-medium">NFT Name</th>
                    <th className="p-4 font-medium">Created At</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {badges.map((badge) => (
                    <tr key={badge.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-medium text-white">{badge.name}</td>
                      <td className="p-4 text-gray-400">{new Date(badge.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm">
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
      {/* Card de Badge References (NÃO ALTERAR) */}
      <Card className="cyber-card border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-200 flex items-center gap-2"><Settings className="w-5 h-5" />Badge References</CardTitle>
              <CardDescription className="text-gray-400">Manage references for Vision Generation</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild><Button className="cyber-button"><Plus className="w-4 h-4 mr-2" />Add Badge</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
                <DialogHeader><DialogTitle className="text-gray-200">Create New Badge Reference</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label htmlFor="newName" className="text-gray-200">Badge Name</Label><Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Dragon Badge" className="cyber-input" /></div>
                  <div className="grid gap-2"><Label htmlFor="newPrompt" className="text-gray-200">Base Prompt</Label><Textarea id="newPrompt" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder="Base prompt for this badge..." className="cyber-input min-h-[100px]" /></div>
                </div>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button><Button onClick={handleCreate} className="cyber-button">Create</Button></div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="references" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="references" className="data-[state=active]:bg-cyan-500/20">Badges</TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-cyan-500/20">Images</TabsTrigger>
            </TabsList>
            <TabsContent value="references" className="space-y-4 pt-4">
              {loading ? (<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>) : (
                <div className="grid gap-4">
                  {references.map((item) => (
                    <Card key={item._id} className="cyber-card border-gray-700">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-200">{item.teamName}</h3>
                            <p className="text-sm text-gray-400 my-2">{item.teamBasePrompt}</p>
                            <UiBadge variant="outline">{item.referenceImages.length} images</UiBadge>
                          </div>
                          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setSelectedForUpload(item.teamName); setShowUploadImageDialog(true); }}><Upload className="w-4 h-4" /></Button><Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(item)}><Edit className="w-4 h-4" /></Button></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="images" className="space-y-4 pt-4">
              <Dialog open={showUploadImageDialog} onOpenChange={setShowUploadImageDialog}>
                  <DialogTrigger asChild><Button className="cyber-button w-full"><Upload className="w-4 h-4 mr-2" />Upload New Image</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
                    <DialogHeader><DialogTitle className="text-gray-200">Upload Reference Image</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2"><Label htmlFor="itemSelect" className="text-gray-200">Select Badge</Label><Select value={selectedForUpload} onValueChange={setSelectedForUpload}><SelectTrigger className="cyber-input"><SelectValue placeholder="Choose a badge" /></SelectTrigger><SelectContent className="bg-gray-900 border-gray-700">{references.map((item) => (<SelectItem key={item._id} value={item.teamName}>{item.teamName}</SelectItem>))}</SelectContent></Select></div>
                      <div className="grid gap-2"><Label htmlFor="imageFile" className="text-gray-200">Image File</Label><Input id="imageFile" type="file" accept="image/*" onChange={handleUploadImage} className="cyber-input" disabled={uploadingImage} /></div>
                    </div>
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowUploadImageDialog(false)}>Cancel</Button><Button disabled={!selectedForUpload || uploadingImage} className="cyber-button">{uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}</Button></div>
                  </DialogContent>
                </Dialog>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {references.flatMap(item => item.referenceImages.map(img => (<Card key={img.id} className="cyber-card border-gray-700"><CardContent className="p-2"><div className="relative aspect-square rounded-md overflow-hidden mb-2"><Image src={img.url} alt={img.filename} fill className="object-cover" /></div><p className="text-xs font-medium text-gray-200 truncate">{item.teamName}</p></CardContent></Card>)))}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-cyan-500/30">
          <DialogHeader><DialogTitle className="text-gray-200">Edit: {editingItem?.teamName}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="editPrompt" className="text-gray-200">Base Prompt</Label><Textarea id="editPrompt" value={editedPrompt} onChange={(e) => setEditedPrompt(e.target.value)} className="cyber-input min-h-[150px]" /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button><Button onClick={handleUpdate} className="cyber-button">Save Changes</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 