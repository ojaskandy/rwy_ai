import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Search, Upload, X, Heart, Bookmark, Grid, Filter, Tag, 
  Download, Share2, User, Calendar, Camera, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BoardImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
  tags: string[];
  category: 'dress' | 'shoes' | 'nails' | 'inspiration' | 'personal';
  width?: number;
  height?: number;
  likeCount: number;
  saveCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    picture?: string;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

const categories = [
  { value: 'dress', label: 'Dresses', color: 'bg-purple-500/20 text-purple-700 border-purple-200', emoji: '👗' },
  { value: 'shoes', label: 'Shoes', color: 'bg-pink-500/20 text-pink-700 border-pink-200', emoji: '👠' },
  { value: 'nails', label: 'Nails', color: 'bg-blue-500/20 text-blue-700 border-blue-200', emoji: '💅' },
  { value: 'inspiration', label: 'Inspiration', color: 'bg-green-500/20 text-green-700 border-green-200', emoji: '✨' },
  { value: 'personal', label: 'Personal', color: 'bg-orange-500/20 text-orange-700 border-orange-200', emoji: '📸' },
];

export default function Board() {
  const { user, session } = useAuth();
  const isMobile = useIsMobile();
  const [images, setImages] = useState<BoardImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<BoardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<BoardImage['category']>('inspiration');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<BoardImage | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Masonry layout with better performance
  const adjustMasonryLayout = useCallback(() => {
    if (!gridRef.current) return;

    const grid = gridRef.current;
    const items = Array.from(grid.children) as HTMLElement[];
    const columnCount = isMobile ? 2 : window.innerWidth < 1024 ? 3 : 4;
    const gap = 16;
    const columnWidth = (grid.offsetWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = new Array(columnCount).fill(0);

    items.forEach((item, index) => {
      const minColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      const left = minColumnIndex * (columnWidth + gap);
      const top = columnHeights[minColumnIndex];

      item.style.position = 'absolute';
      item.style.left = `${left}px`;
      item.style.top = `${top}px`;
      item.style.width = `${columnWidth}px`;
      item.style.transition = 'all 0.3s ease';

      const itemHeight = item.offsetHeight;
      columnHeights[minColumnIndex] += itemHeight + gap;
    });

    const maxHeight = Math.max(...columnHeights);
    grid.style.height = `${maxHeight}px`;
  }, [isMobile]);

  // Load images with user information
  const loadImages = async () => {
    try {
      const response = await fetch('/api/board/images', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter images based on search, category, and saved status
  const filterImages = useCallback(() => {
    let filtered = images;

    // Filter by saved status
    if (showSavedOnly) {
      filtered = filtered.filter(img => img.isSaved);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img => 
        img.title?.toLowerCase().includes(query) ||
        img.description?.toLowerCase().includes(query) ||
        img.tags.some(tag => tag.toLowerCase().includes(query)) ||
        img.user.username.toLowerCase().includes(query) ||
        img.user.fullName?.toLowerCase().includes(query)
      );
    }

    setFilteredImages(filtered);
  }, [images, searchQuery, selectedCategory, showSavedOnly]);

  // Handle like/unlike
  const handleLike = async (imageId: string, currentlyLiked: boolean) => {
    try {
      const response = await fetch(`/api/board/images/${imageId}/like`, {
        method: currentlyLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { 
                ...img, 
                isLiked: !currentlyLiked,
                likeCount: currentlyLiked ? img.likeCount - 1 : img.likeCount + 1
              }
            : img
        ));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Handle save/unsave
  const handleSave = async (imageId: string, currentlySaved: boolean) => {
    try {
      const response = await fetch(`/api/board/images/${imageId}/save`, {
        method: currentlySaved ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { 
                ...img, 
                isSaved: !currentlySaved,
                saveCount: currentlySaved ? img.saveCount - 1 : img.saveCount + 1
              }
            : img
        ));
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  // Handle file upload to public-board bucket
  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', uploadFile);

      // Upload to new public-board bucket endpoint
      const uploadResponse = await fetch('/api/board/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const { url } = await uploadResponse.json();

      // Get image dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(uploadFile);
      });

      // Save board image metadata
      const imageData = {
        url,
        title: uploadTitle.trim() || undefined,
        description: uploadDescription.trim() || undefined,
        category: uploadCategory,
        tags: uploadTags.split(',').map(tag => tag.trim()).filter(Boolean),
        width: img.width,
        height: img.height,
      };

      const saveResponse = await fetch('/api/board/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(imageData),
      });

      if (saveResponse.ok) {
        await loadImages();
        setShowUploadDialog(false);
        resetUploadForm();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory('inspiration');
    setUploadTags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Effects
  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    filterImages();
  }, [filterImages]);

  useEffect(() => {
    if (filteredImages.length > 0) {
      const timer = setTimeout(adjustMasonryLayout, 100);
      return () => clearTimeout(timer);
    }
  }, [filteredImages, adjustMasonryLayout]);

  useEffect(() => {
    const handleResize = () => adjustMasonryLayout();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustMasonryLayout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#FFC5D3' }}>
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#FFC5D3' }}>
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-md border-b border-white/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Inspiration Board</h1>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-white/90 hover:bg-white text-gray-800 font-medium shadow-lg border-0 rounded-xl px-4 py-2"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </motion.div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
              <Input
                placeholder="Search images, tags, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-2 rounded-xl border-0 bg-white/90 backdrop-blur-sm shadow-md text-gray-800 placeholder:text-gray-500"
              />
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={showSavedOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={cn(
                  "whitespace-nowrap rounded-xl border-0 shadow-md px-4",
                  showSavedOnly 
                    ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                    : 'bg-white/90 hover:bg-white text-gray-700'
                )}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                My Saves
              </Button>
            </motion.div>
          </div>
          
          {/* Categories - Single Row */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "rounded-full border-0 shadow-md px-3 py-2 min-w-[40px] h-10",
                  selectedCategory === 'all' 
                    ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                    : 'bg-white/90 hover:bg-white text-gray-700'
                )}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </motion.div>
            {categories.map(category => (
              <motion.div
                key={category.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "rounded-full border-0 shadow-md px-3 py-2 min-w-[40px] h-10",
                    selectedCategory === category.value 
                      ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                      : 'bg-white/90 hover:bg-white text-gray-700'
                  )}
                >
                  <span className="text-lg">{category.emoji}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Grid className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {searchQuery || selectedCategory !== 'all' || showSavedOnly ? 'No images found' : 'Start your inspiration board'}
            </h3>
            <p className="text-gray-700/80 mb-6">
              {searchQuery || selectedCategory !== 'all' || showSavedOnly
                ? 'Try adjusting your search or filters' 
                : 'Add your first image to get started'}
            </p>
            {!searchQuery && selectedCategory === 'all' && !showSavedOnly && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-white/90 hover:bg-white text-gray-800 font-medium shadow-lg border-0 rounded-xl px-8 py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Image
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <div ref={gridRef} className="relative">
            <AnimatePresence>
              {filteredImages.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute"
                >
                  <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden group rounded-2xl bg-white">
                    <CardContent className="p-0 relative">
                      <div 
                        className="relative"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image.url}
                          alt={image.title || 'Board image'}
                          className="w-full h-auto rounded-2xl"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/95 hover:bg-white text-black rounded-full w-12 h-12 p-0 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(image.id, image.isLiked || false);
                                }}
                              >
                                <Heart className={cn(
                                  "h-5 w-5",
                                  image.isLiked && "fill-red-500 text-red-500"
                                )} />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/95 hover:bg-white text-black rounded-full w-12 h-12 p-0 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSave(image.id, image.isSaved || false);
                                }}
                              >
                                <Bookmark className={cn(
                                  "h-5 w-5",
                                  image.isSaved && "fill-pink-500 text-pink-500"
                                )} />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Image Info */}
                      <div className="p-4">
                        {image.title && (
                          <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2">
                            {image.title}
                          </h3>
                        )}
                        
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={image.user.picture} />
                            <AvatarFallback className="text-xs bg-gray-100">
                              {image.user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {image.user.fullName || image.user.username}
                            </p>
                          </div>
                        </div>

                        {/* Stats and Category */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {image.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bookmark className="h-3 w-3" />
                              {image.saveCount}
                            </span>
                          </div>
                          <Badge 
                            className={cn(
                              categories.find(c => c.value === image.category)?.color,
                              "text-xs border rounded-full"
                            )}
                          >
                            {categories.find(c => c.value === image.category)?.emoji}
                            {categories.find(c => c.value === image.category)?.label}
                          </Badge>
                        </div>

                        {/* Tags */}
                        {image.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {image.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs rounded-full bg-gray-50">
                                {tag}
                              </Badge>
                            ))}
                            {image.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs rounded-full bg-gray-50">
                                +{image.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Add New Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploadFile ? (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => setUploadFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed border-pink-300 hover:border-pink-400 rounded-xl bg-pink-50/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-pink-400" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                    <p className="text-xs text-gray-400">Max 10MB • PNG, JPG, WEBP</p>
                  </div>
                </Button>
              )}
            </div>

            <Input
              placeholder="Title (optional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="rounded-xl border-gray-200"
            />

            <Textarea
              placeholder="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={3}
              className="rounded-xl border-gray-200"
            />

            <div>
              <label className="text-sm font-medium mb-3 block text-gray-700">Category</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(category => (
                  <motion.div
                    key={category.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={uploadCategory === category.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadCategory(category.value as BoardImage['category'])}
                      className={cn(
                        "justify-start w-full rounded-xl",
                        uploadCategory === category.value && 'bg-pink-500 hover:bg-pink-600 text-white'
                      )}
                    >
                      <span className="mr-2">{category.emoji}</span>
                      {category.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            <Input
              placeholder="Tags (comma separated)"
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
              className="rounded-xl border-gray-200"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setShowUploadDialog(false);
                  resetUploadForm();
                }}
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button
                  className="w-full bg-pink-500 hover:bg-pink-600 rounded-xl"
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Detail Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
          {selectedImage && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title || 'Board image'}
                  className="w-full h-auto rounded-xl max-h-[70vh] object-contain"
                />
              </div>

              {/* Details */}
              <div className="space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedImage.title || 'Untitled'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedImage.user.picture} />
                    <AvatarFallback className="bg-gray-100">
                      {selectedImage.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedImage.user.fullName || selectedImage.user.username}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedImage.createdAt)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={selectedImage.isLiked ? 'default' : 'outline'}
                      onClick={() => handleLike(selectedImage.id, selectedImage.isLiked || false)}
                      className={cn(
                        "rounded-xl",
                        selectedImage.isLiked && 'bg-red-500 hover:bg-red-600 text-white'
                      )}
                    >
                      <Heart className={cn(
                        "h-4 w-4 mr-2",
                        selectedImage.isLiked && "fill-current"
                      )} />
                      {selectedImage.likeCount} Likes
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={selectedImage.isSaved ? 'default' : 'outline'}
                      onClick={() => handleSave(selectedImage.id, selectedImage.isSaved || false)}
                      className={cn(
                        "rounded-xl",
                        selectedImage.isSaved && 'bg-pink-500 hover:bg-pink-600 text-white'
                      )}
                    >
                      <Bookmark className={cn(
                        "h-4 w-4 mr-2",
                        selectedImage.isSaved && "fill-current"
                      )} />
                      {selectedImage.isSaved ? 'Saved' : 'Save'}
                    </Button>
                  </motion.div>
                </div>

                {/* Description */}
                {selectedImage.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{selectedImage.description}</p>
                  </div>
                )}

                {/* Category & Tags */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Category & Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn(
                      categories.find(c => c.value === selectedImage.category)?.color,
                      "rounded-full"
                    )}>
                      {categories.find(c => c.value === selectedImage.category)?.emoji}
                      {categories.find(c => c.value === selectedImage.category)?.label}
                    </Badge>
                    {selectedImage.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="rounded-full">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-500">{selectedImage.likeCount}</p>
                    <p className="text-sm text-gray-500">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-500">{selectedImage.saveCount}</p>
                    <p className="text-sm text-gray-500">Saves</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 