import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, AlertCircle, User, Shirt, Link, Sparkles,
  RefreshCw, ArrowLeft, Download
} from 'lucide-react';
import { useLocation } from 'wouter';

// Virtual try-on interfaces (keeping all backend logic intact)
interface TryOnResult {
  id: string;
  status: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[];
  error?: {
    name: string;
    message: string;
  } | null;
}

interface TryOnOptions {
  category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  mode?: 'performance' | 'balanced' | 'quality';
  garment_photo_type?: 'auto' | 'model' | 'flat-lay';
  num_samples?: number;
  seed?: number;
  segmentation_free?: boolean;
  moderation_level?: 'conservative' | 'permissive' | 'none';
  output_format?: 'png' | 'jpeg';
  return_base64?: boolean;
}

export default function DressTryOn() {
  const [, navigate] = useLocation();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string>('');
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [garmentImageFile, setGarmentImageFile] = useState<File | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qualityMode, setQualityMode] = useState<'performance' | 'balanced' | 'quality'>('balanced');
  const [showResult, setShowResult] = useState(false);
  const [showMagicAnimation, setShowMagicAnimation] = useState(false);
  
  const personImageRef = useRef<HTMLInputElement>(null);
  const garmentImageRef = useRef<HTMLInputElement>(null);

  // Helper function to convert file to base64 (keeping backend logic)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle person image upload (keeping backend logic)
  const handlePersonImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setUserImage(base64);
        setUserImageFile(file);
        setUserImageUrl('');
        setError(null);
      } catch (error) {
        console.error('Failed to convert file to base64:', error);
        setError('Failed to process image. Please try again.');
      }
    }
  };

  // Handle garment image upload (keeping backend logic)
  const handleGarmentImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setGarmentImage(base64);
        setGarmentImageFile(file);
        setGarmentImageUrl('');
        setError(null);
      } catch (error) {
        console.error('Failed to convert file to base64:', error);
        setError('Failed to process image. Please try again.');
      }
    }
  };

  // Handle person image URL (keeping backend logic)
  const handlePersonImageUrl = (url: string) => {
    setUserImageUrl(url);
    if (url.trim()) {
      setUserImage(url);
      setUserImageFile(null);
      setError(null);
    }
  };

  // Handle garment image URL (keeping backend logic)
  const handleGarmentImageUrl = (url: string) => {
    setGarmentImageUrl(url);
    if (url.trim()) {
      setGarmentImage(url);
      setGarmentImageFile(null);
      setError(null);
    }
  };

  // Get current effective image URLs/data (keeping backend logic)
  const getCurrentImages = (): { personImage: string; garmentImage: string } => {
    const personImg = userImageUrl.trim() || userImage || '';
    const garmentImg = garmentImageUrl.trim() || garmentImage || '';
    return { personImage: personImg, garmentImage: garmentImg };
  };

  // Handle magic button click with cool animation
  const handleSeeTheMagic = async () => {
    setShowMagicAnimation(true);
    
    // Wait for magic animation to complete
    setTimeout(async () => {
      setShowMagicAnimation(false);
      await handleTryOn();
    }, 3000);
  };

  // Handle try-on with FashnAI integration (keeping all backend logic)
  const handleTryOn = async () => {
    const { personImage: personImg, garmentImage: garmentImg } = getCurrentImages();
    
    if (!personImg || !garmentImg) {
      setError('Please upload both your photo and a dress image');
      return;
    }

    setIsProcessing(true);
    setShowResult(true);
    setError(null);
    setTryOnResult(null);

    try {
      console.log('[TryOn] Starting virtual try-on with FashnAI...');
      
      const options: TryOnOptions = {
        category: 'one-pieces',
        mode: qualityMode,
        garment_photo_type: 'auto',
        num_samples: 1,
        moderation_level: 'permissive',
        output_format: 'png',
        return_base64: false
      };

      console.log('[TryOn] Using options:', options);

      const response = await fetch('/api/fashn/tryon-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_image: personImg,
          garment_image: garmentImg,
          options
        })
      });

      const result = await response.json();
      console.log('[TryOn] API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Try-on failed');
      }

      setTryOnResult(result.data);
      
      if (result.data.status === 'completed' && result.data.output?.length > 0) {
        console.log('[TryOn] ✅ Try-on completed successfully');
      } else if (result.data.status === 'failed') {
        const errorMsg = result.data.error?.message || 'Try-on failed';
        throw new Error(errorMsg);
      }

    } catch (err: any) {
      console.error('[TryOn] ❌ Try-on failed:', err);
      setError(err.message || 'Failed to generate virtual try-on');
    } finally {
      setIsProcessing(false);
    }
  };

  const canTryOn = userImage && garmentImage && !isProcessing;

  const resetAll = () => {
    setUserImage(null);
    setUserImageFile(null);
    setUserImageUrl('');
    setGarmentImage(null);
    setGarmentImageFile(null);
    setGarmentImageUrl('');
    setTryOnResult(null);
    setError(null);
    setShowResult(false);
    setShowMagicAnimation(false);
  };

  if (showResult) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: '#FFC5D3' }}>
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => setShowResult(false)}
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-lg font-bold text-gray-800">Your Virtual Try-On</h1>
            <Button
              onClick={resetAll}
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              Start Over
            </Button>
          </div>

          {/* Result Display */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="aspect-[3/4] max-w-xs mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                {tryOnResult?.output && tryOnResult.output.length > 0 && tryOnResult.status === 'completed' ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full relative overflow-hidden"
                  >
                    {/* White Light Reveal Effect */}
                    <motion.div
                      initial={{ 
                        background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0) 70%)',
                        scale: 0,
                        opacity: 1
                      }}
                      animate={{ 
                        scale: [0, 3, 4],
                        opacity: [1, 0.8, 0]
                      }}
                      transition={{ 
                        duration: 0.8,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 z-20 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0) 70%)'
                      }}
                    />
                    
                    {/* Result Image */}
                    <motion.img
                      src={tryOnResult.output[0]}
                      alt="Virtual try-on result"
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Sparkle Effects */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            opacity: 0,
                            scale: 0,
                            x: Math.random() * 200,
                            y: Math.random() * 200
                          }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            rotate: 360
                          }}
                          transition={{ 
                            duration: 1,
                            delay: 0.4 + i * 0.1,
                            ease: "easeOut"
                          }}
                          className="absolute w-3 h-3 bg-white rounded-full shadow-lg"
                          style={{
                            boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                ) : isProcessing ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                    <div className="text-center p-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mb-4"
                      >
                        <Sparkles className="w-12 h-12 mx-auto text-pink-500" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-pink-700 mb-1">Creating Magic...</h3>
                      <p className="text-sm text-pink-600">Usually takes 30-60 seconds</p>
                      {tryOnResult && (
                        <p className="text-xs text-pink-500 mt-1 capitalize">
                          {tryOnResult.status.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : error ? (
                  <div className="w-full h-full flex items-center justify-center bg-red-50">
                    <div className="text-center text-red-600 p-4">
                      <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                      <p className="font-medium text-sm">{error}</p>
                      <Button
                        onClick={() => setError(null)}
                        className="mt-3 bg-pink-500 hover:bg-pink-600 text-white"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-500">
                      <Sparkles className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-sm">Waiting for result...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Success Actions */}
              {tryOnResult?.output && tryOnResult.output.length > 0 && tryOnResult.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 flex gap-3 justify-center"
                >
                  <Button
                    onClick={() => {
                      setTryOnResult(null);
                      setError(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Try Another
                  </Button>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = tryOnResult.output![0];
                      link.download = `virtual-tryon-${Date.now()}.png`;
                      link.click();
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Magic Animation Overlay
  if (showMagicAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFC5D3' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="mb-6"
          >
            <Sparkles className="w-20 h-20 mx-auto text-pink-600" />
          </motion.div>
          <motion.h2
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-3xl font-bold text-gray-800 mb-2"
          >
            Creating Magic...
          </motion.h2>
          <motion.p
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-600"
          >
            Transforming your look ✨
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#FFC5D3' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800 mb-2"
          >
            Virtual Dress Try-On
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600"
          >
            Upload your photo and a dress to see how you'll look
          </motion.p>
        </div>

        {/* Tilted Cards Container */}
        <div className="relative min-h-[500px] mb-12 pb-8">
          {/* Your Photo Card - Always visible, tilted left */}
          <motion.div
            initial={{ opacity: 0, rotate: -8, x: -50 }}
            animate={{ opacity: 1, rotate: -8, x: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="absolute top-0 left-0 w-72 z-10"
            style={{ transformOrigin: 'center bottom' }}
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Upload Picture of Yourself</h3>
                </div>

                <div 
                  onClick={() => !userImage && personImageRef.current?.click()}
                  className={`aspect-[3/4] border-3 border-dashed rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    userImage 
                      ? 'border-pink-400 bg-pink-50' 
                      : 'border-pink-400 bg-pink-50/70 hover:bg-pink-100 cursor-pointer hover:scale-105'
                  }`}
                >
                  {userImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={userImage}
                        alt="Your photo"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserImage(null);
                          setUserImageFile(null);
                          setUserImageUrl('');
                        }}
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white border-0 shadow-lg w-8 h-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-pink-600">
                      <Upload className="w-12 h-12 mx-auto mb-3" />
                      <p className="font-bold text-lg mb-1">Click to Upload</p>
                      <p className="text-sm text-pink-500">Your beautiful photo</p>
                    </div>
                  )}
                </div>

                {!userImage && (
                  <div className="mt-4 space-y-2">
                    <div className="text-center text-gray-500 text-sm">or paste URL</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste image URL"
                        value={userImageUrl}
                        onChange={(e) => handlePersonImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-pink-300 bg-white/70"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePersonImageUrl(userImageUrl)}
                        className="border-pink-200 text-pink-600 hover:bg-pink-50 px-3"
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={personImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePersonImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Dress Card - Shows after user uploads photo, tilted right, overlapping */}
          <AnimatePresence>
            {userImage && (
              <motion.div
                initial={{ opacity: 0, rotate: 8, x: 50, y: 20 }}
                animate={{ opacity: 1, rotate: 8, x: 20, y: 60 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute top-0 right-0 w-72 z-20"
                style={{ transformOrigin: 'center bottom' }}
              >
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Shirt className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Choose Your Dress</h3>
                    </div>

                    <div 
                      onClick={() => !garmentImage && garmentImageRef.current?.click()}
                      className={`aspect-[3/4] border-3 border-dashed rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                        garmentImage 
                          ? 'border-purple-400 bg-purple-50' 
                          : 'border-purple-400 bg-purple-50/70 hover:bg-purple-100 cursor-pointer hover:scale-105'
                      }`}
                    >
                      {garmentImage ? (
                        <div className="relative w-full h-full">
                          <img
                            src={garmentImage}
                            alt="Dress/Garment"
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setGarmentImage(null);
                              setGarmentImageFile(null);
                              setGarmentImageUrl('');
                            }}
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white border-0 shadow-lg w-8 h-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-purple-600">
                          <Upload className="w-12 h-12 mx-auto mb-3" />
                          <p className="font-bold text-lg mb-1">Upload Dress</p>
                          <p className="text-sm text-purple-500">Your dream outfit</p>
                        </div>
                      )}
                    </div>

                    {!garmentImage && (
                      <div className="mt-4 space-y-2">
                        <div className="text-center text-gray-500 text-sm">or paste URL</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Paste dress image URL"
                            value={garmentImageUrl}
                            onChange={(e) => handleGarmentImageUrl(e.target.value)}
                            className="flex-1 px-3 py-2 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-purple-300 bg-white/70"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGarmentImageUrl(garmentImageUrl)}
                            className="border-purple-200 text-purple-600 hover:bg-purple-50 px-3"
                          >
                            <Link className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={garmentImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleGarmentImageUpload}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* See the Magic Button */}
        <AnimatePresence>
          {canTryOn && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.8 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className="text-center mb-8 mt-4"
            >
              <Button
                onClick={handleSeeTheMagic}
                disabled={isProcessing}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:from-pink-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 border-0 relative overflow-hidden"
              >
                <motion.div
                  animate={{ 
                    background: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 z-0"
                />
                <span className="relative z-10 flex items-center">
                  <Sparkles className="w-6 h-6 mr-3" />
                  See the Magic
                  <Sparkles className="w-6 h-6 ml-3" />
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <Card className="bg-red-50 border-red-200 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm flex-1 font-medium">{error}</p>
                    <Button
                      onClick={() => setError(null)}
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-100 p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 