import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Camera, Sparkles, Heart, Star, ChevronLeft, 
  ChevronRight, Filter, Grid, Palette, Wand2, ThumbsUp,
  Download, Share, RefreshCw, X
} from 'lucide-react';
import { useLocation } from 'wouter';

// Mock dress data - in production this would come from FashN API
const DRESS_CATEGORIES = [
  { id: 'evening', name: 'Evening Gowns', count: 45 },
  { id: 'cocktail', name: 'Cocktail Dresses', count: 38 },
  { id: 'pageant', name: 'Pageant Gowns', count: 29 },
  { id: 'formal', name: 'Formal Wear', count: 52 },
  { id: 'casual', name: 'Casual Chic', count: 67 }
];

const MOCK_DRESSES = [
  {
    id: 1,
    name: 'Royal Blue Evening Gown',
    category: 'evening',
    color: 'Royal Blue',
    price: '$299',
    rating: 4.8,
    tags: ['elegant', 'flowing', 'formal'],
    thumbnail: '/api/placeholder/300/400'
  },
  {
    id: 2,
    name: 'Emerald Cocktail Dress',
    category: 'cocktail',
    color: 'Emerald',
    price: '$199',
    rating: 4.6,
    tags: ['modern', 'sleek', 'party'],
    thumbnail: '/api/placeholder/300/400'
  },
  {
    id: 3,
    name: 'Rose Gold Pageant Gown',
    category: 'pageant',
    color: 'Rose Gold',
    price: '$449',
    rating: 4.9,
    tags: ['glamorous', 'beaded', 'competition'],
    thumbnail: '/api/placeholder/300/400'
  },
  {
    id: 4,
    name: 'Classic Black Formal',
    category: 'formal',
    color: 'Black',
    price: '$249',
    rating: 4.7,
    tags: ['timeless', 'versatile', 'chic'],
    thumbnail: '/api/placeholder/300/400'
  },
  {
    id: 5,
    name: 'Sunset Orange Maxi',
    category: 'casual',
    color: 'Orange',
    price: '$149',
    rating: 4.5,
    tags: ['vibrant', 'comfortable', 'summer'],
    thumbnail: '/api/placeholder/300/400'
  },
  {
    id: 6,
    name: 'Midnight Navy Gown',
    category: 'evening',
    color: 'Navy',
    price: '$329',
    rating: 4.8,
    tags: ['sophisticated', 'mermaid', 'dramatic'],
    thumbnail: '/api/placeholder/300/400'
  }
];

const STYLE_TIPS = [
  "For pageant competitions, choose gowns that highlight your silhouette",
  "Bold colors like royal blue and emerald make powerful statements on stage",
  "Consider the venue lighting when selecting dress colors",
  "Fitted bodices with flowing skirts create elegant movement",
  "Metallic accents catch stage lights beautifully"
];

export default function DressTryOn() {
  const [, navigate] = useLocation();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedDress, setSelectedDress] = useState<typeof MOCK_DRESSES[0] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStyleCoach, setShowStyleCoach] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredDresses = selectedCategory === 'all' 
    ? MOCK_DRESSES 
    : MOCK_DRESSES.filter(dress => dress.category === selectedCategory);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImage(e.target?.result as string);
        setShowUploadModal(false);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCameraCapture = useCallback(() => {
    // In production, this would open camera for live capture
    // For now, we'll simulate with a placeholder
    setIsProcessing(true);
    setTimeout(() => {
      setUserImage('/api/placeholder/400/600');
      setShowUploadModal(false);
      setIsProcessing(false);
    }, 2000);
  }, []);

  const handleDressSelect = (dress: typeof MOCK_DRESSES[0]) => {
    setSelectedDress(dress);
    setIsProcessing(true);
    // Simulate FashN API processing time
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handleTryOnOutfit = () => {
    if (!userImage) {
      setShowUploadModal(true);
      return;
    }
    if (!selectedDress) {
      // Auto-select first dress
      setSelectedDress(MOCK_DRESSES[0]);
    }
  };

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % STYLE_TIPS.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + STYLE_TIPS.length) % STYLE_TIPS.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 text-white">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-purple-800 to-pink-800 h-16 px-4 shadow-lg flex items-center">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-white hover:text-pink-200 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>
        <div className="flex-1 flex justify-center">
          <span className="text-pink-200 font-bold text-xl">Virtual Dress Try-On</span>
        </div>
        <button
          onClick={() => setShowStyleCoach(!showStyleCoach)}
          className="flex items-center text-pink-200 hover:text-white transition-colors"
        >
          <Sparkles className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline">Style Coach</span>
        </button>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Try-On Preview Section */}
          <div className="space-y-4">
            <Card className="bg-black/30 border-pink-600/30">
              <CardHeader>
                <CardTitle className="text-pink-300 flex items-center">
                  <Wand2 className="w-5 h-5 mr-2" />
                  Virtual Try-On Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[3/4] bg-gradient-to-b from-purple-900/50 to-pink-900/50 rounded-lg overflow-hidden">
                  {userImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={userImage} 
                        alt="User" 
                        className="w-full h-full object-cover"
                      />
                      {selectedDress && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.8 }}
                          className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/20 to-purple-500/30"
                          style={{
                            backgroundImage: `url(${selectedDress.thumbnail})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            mixBlendMode: 'overlay'
                          }}
                        />
                      )}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p>Processing virtual try-on...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Camera className="w-16 h-16 text-pink-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Upload Your Photo</h3>
                      <p className="text-gray-300 mb-4">Take or upload a full-body photo to see how dresses look on you</p>
                      <Button 
                        onClick={() => setShowUploadModal(true)}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>

                {userImage && selectedDress && (
                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                      <Download className="w-4 h-4 mr-2" />
                      Save Look
                    </Button>
                    <Button variant="outline" className="border-pink-600 text-pink-300 hover:bg-pink-600/20">
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleTryOnOutfit}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-16"
              >
                <Palette className="w-5 h-5 mr-2" />
                Try On Outfit
              </Button>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-pink-600 text-pink-300 hover:bg-pink-600/20 h-16"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Dress Selection Section */}
          <div className="space-y-4">
            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                onClick={() => setSelectedCategory('all')}
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                className={selectedCategory === 'all' 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600' 
                  : 'border-pink-600 text-pink-300 hover:bg-pink-600/20'
                }
                size="sm"
              >
                All Dresses
              </Button>
              {DRESS_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className={selectedCategory === category.id 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600' 
                    : 'border-pink-600 text-pink-300 hover:bg-pink-600/20'
                  }
                  size="sm"
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>

            {/* Dress Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredDresses.map((dress) => (
                <motion.div
                  key={dress.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedDress?.id === dress.id 
                        ? 'bg-gradient-to-b from-pink-600/30 to-purple-600/30 border-pink-400' 
                        : 'bg-black/30 border-pink-600/30 hover:border-pink-400'
                    }`}
                    onClick={() => handleDressSelect(dress)}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                      <img 
                        src={dress.thumbnail} 
                        alt={dress.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedDress?.id === dress.id && (
                        <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-2">
                            <ThumbsUp className="w-4 h-4 text-pink-600" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1 text-xs">
                        <Star className="w-3 h-3 inline mr-1 text-yellow-400" />
                        {dress.rating}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm mb-1 truncate">{dress.name}</h3>
                      <p className="text-pink-300 font-bold text-sm">{dress.price}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dress.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-pink-600 text-pink-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-purple-900 to-pink-900 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Upload Your Photo</h3>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  disabled={isProcessing}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {isProcessing ? 'Processing...' : 'Upload from Gallery'}
                </Button>
                
                <Button
                  onClick={handleCameraCapture}
                  variant="outline"
                  className="w-full border-pink-600 text-pink-300 hover:bg-pink-600/20"
                  disabled={isProcessing}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {isProcessing ? 'Processing...' : 'Take Photo'}
                </Button>
              </div>
              
              <p className="text-sm text-gray-300 mt-4 text-center">
                For best results, use a full-body photo with good lighting
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style Coach Panel */}
      <AnimatePresence>
        {showStyleCoach && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-purple-900 to-pink-900 border-l border-pink-600/30 shadow-2xl z-40 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-pink-300">Style Coach</h3>
                <button 
                  onClick={() => setShowStyleCoach(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Tips Section */}
              <Card className="bg-black/30 border-pink-600/30 mb-4">
                <CardHeader>
                  <CardTitle className="text-pink-300 text-sm flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Style Tip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      onClick={prevTip}
                      className="text-pink-400 hover:text-pink-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400">
                      {currentTipIndex + 1} of {STYLE_TIPS.length}
                    </span>
                    <button 
                      onClick={nextTip}
                      className="text-pink-400 hover:text-pink-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-300">{STYLE_TIPS[currentTipIndex]}</p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {selectedDress && (
                <Card className="bg-black/30 border-pink-600/30">
                  <CardHeader>
                    <CardTitle className="text-pink-300 text-sm">
                      Perfect for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-pink-400" />
                        <span className="text-sm">Flattering silhouette</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-400" />
                        <span className="text-sm">Great for pageants</span>
                      </div>
                      <div className="flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="text-sm">Stage-ready glamour</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 