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
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full"
                  >
                    <img
                      src={tryOnResult.output[0]}
                      alt="Virtual try-on result"
                      className="w-full h-full object-cover"
                    />
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

  return (
    <div className="min-h-screen p-3" style={{ backgroundColor: '#FFC5D3' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-800 mb-2"
          >
            Virtual Dress Try-On
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-sm"
          >
            Upload your photo and a dress to see how you'll look
          </motion.p>
        </div>

        {/* Upload Areas */}
        <div className="space-y-4 mb-6">
          {/* Your Photo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Your Photo</h3>
                </div>

                <div 
                  onClick={() => !userImage && personImageRef.current?.click()}
                  className={`aspect-[4/5] border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 ${
                    userImage 
                      ? 'border-pink-300 bg-pink-50' 
                      : 'border-pink-300 bg-pink-50/50 hover:bg-pink-50 cursor-pointer'
                  }`}
                >
                  {userImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={userImage}
                        alt="Your photo"
                        className="w-full h-full object-cover rounded-lg"
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
                        className="absolute top-1 right-1 bg-white/90 hover:bg-white border-0 shadow-md w-8 h-8 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-pink-600">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium text-sm mb-1">Upload your photo</p>
                      <p className="text-xs text-pink-500">Click to browse</p>
                    </div>
                  )}
                </div>

                {!userImage && (
                  <div className="mt-3 space-y-2">
                    <div className="text-center text-gray-500 text-xs">or</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste image URL"
                        value={userImageUrl}
                        onChange={(e) => handlePersonImageUrl(e.target.value)}
                        className="flex-1 px-2 py-1 border border-pink-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white/50"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePersonImageUrl(userImageUrl)}
                        className="border-pink-200 text-pink-600 hover:bg-pink-50 px-2"
                      >
                        <Link className="w-3 h-3" />
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

          {/* Dress/Garment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Shirt className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Dress/Garment</h3>
                </div>

                <div 
                  onClick={() => !garmentImage && garmentImageRef.current?.click()}
                  className={`aspect-[4/5] border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 ${
                    garmentImage 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-purple-300 bg-purple-50/50 hover:bg-purple-50 cursor-pointer'
                  }`}
                >
                  {garmentImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={garmentImage}
                        alt="Dress/Garment"
                        className="w-full h-full object-cover rounded-lg"
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
                        className="absolute top-1 right-1 bg-white/90 hover:bg-white border-0 shadow-md w-8 h-8 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-purple-600">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium text-sm mb-1">Upload dress image</p>
                      <p className="text-xs text-purple-500">Click to browse</p>
                    </div>
                  )}
                </div>

                {!garmentImage && (
                  <div className="mt-3 space-y-2">
                    <div className="text-center text-gray-500 text-xs">or</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste dress image URL"
                        value={garmentImageUrl}
                        onChange={(e) => handleGarmentImageUrl(e.target.value)}
                        className="flex-1 px-2 py-1 border border-purple-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGarmentImageUrl(garmentImageUrl)}
                        className="border-purple-200 text-purple-600 hover:bg-purple-50 px-2"
                      >
                        <Link className="w-3 h-3" />
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
        </div>

        {/* See How You Look Button */}
        <AnimatePresence>
          {canTryOn && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="text-center mb-4"
            >
              <Button
                onClick={handleTryOn}
                disabled={isProcessing}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:from-pink-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 border-0 w-full"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                See How You Look
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
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs flex-1">{error}</p>
                    <Button
                      onClick={() => setError(null)}
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-100 p-1"
                    >
                      <X className="w-3 h-3" />
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