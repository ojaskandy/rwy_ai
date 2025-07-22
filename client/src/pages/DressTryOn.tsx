import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Camera, Sparkles, ChevronLeft, ChevronRight,
  RefreshCw, X, AlertCircle, User, Shirt, Link, Check
} from 'lucide-react';
import { useLocation } from 'wouter';

const STYLE_TIPS = [
  "For pageant competitions, choose gowns that highlight your silhouette",
  "Bold colors like royal blue and emerald make powerful statements on stage",
  "Consider the venue lighting when selecting dress colors",
  "Fitted bodices with flowing skirts create elegant movement",
  "Metallic accents catch stage lights beautifully"
];

// Virtual try-on interfaces
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
  const [showStyleCoach, setShowStyleCoach] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qualityMode, setQualityMode] = useState<'performance' | 'balanced' | 'quality'>('balanced');
  
  const personImageRef = useRef<HTMLInputElement>(null);
  const garmentImageRef = useRef<HTMLInputElement>(null);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle person image upload
  const handlePersonImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setUserImage(base64);
        setUserImageFile(file);
        setUserImageUrl(''); // Clear URL when file is uploaded
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Failed to convert file to base64:', error);
        setError('Failed to process image. Please try again.');
      }
    }
  };

  // Handle garment image upload
  const handleGarmentImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setGarmentImage(base64);
        setGarmentImageFile(file);
        setGarmentImageUrl(''); // Clear URL when file is uploaded
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Failed to convert file to base64:', error);
        setError('Failed to process image. Please try again.');
      }
    }
  };

  // Handle person image URL
  const handlePersonImageUrl = (url: string) => {
    setUserImageUrl(url);
    if (url.trim()) {
      setUserImage(url);
      setUserImageFile(null); // Clear file when URL is set
      setError(null); // Clear any previous errors
    }
  };

  // Handle garment image URL
  const handleGarmentImageUrl = (url: string) => {
    setGarmentImageUrl(url);
    if (url.trim()) {
      setGarmentImage(url);
      setGarmentImageFile(null); // Clear file when URL is set
      setError(null); // Clear any previous errors
    }
  };

  // Get current effective image URLs/data
  const getCurrentImages = (): { personImage: string; garmentImage: string } => {
    const personImg = userImageUrl.trim() || userImage || '';
    const garmentImg = garmentImageUrl.trim() || garmentImage || '';
    return { personImage: personImg, garmentImage: garmentImg };
  };

  // Handle try-on with new FashnAI integration
  const handleTryOn = async () => {
    const { personImage: personImg, garmentImage: garmentImg } = getCurrentImages();
    
    // Validate images are provided
    if (!personImg || !garmentImg) {
      setError('Please upload both your photo and a dress image');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTryOnResult(null);

    try {
      console.log('[TryOn] Starting virtual try-on with FashnAI...');
      
      // Prepare options based on UI selections
      const options: TryOnOptions = {
        category: 'one-pieces', // Assume dresses for pageantry
        mode: qualityMode,
        garment_photo_type: 'auto',
        num_samples: 1,
        moderation_level: 'permissive',
        output_format: 'png',
        return_base64: false // Get URLs for better performance
      };

      console.log('[TryOn] Using options:', options);

      // Use the complete endpoint that handles polling automatically
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

  const { personImage: personImg, garmentImage: garmentImg } = getCurrentImages();
  const canTryOn = personImg && garmentImg && !isProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quality Mode Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-purple-600">Quality:</span>
              <select
                value={qualityMode}
                onChange={(e) => setQualityMode(e.target.value as any)}
                className="px-3 py-1 border border-purple-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isProcessing}
              >
                <option value="performance">Fast</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Best</option>
              </select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStyleCoach(!showStyleCoach)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Style Coach
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Oops! Something went wrong</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Image Uploads */}
          <div className="space-y-6">
            {/* Person Image Upload */}
            <Card className="border-2 border-purple-100 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <User className="w-5 h-5" />
                  Your Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview */}
                <div className="relative">
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border-2 border-dashed border-purple-200 flex items-center justify-center overflow-hidden">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt="Your photo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-purple-400">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Upload your photo</p>
                      </div>
                    )}
                  </div>
                  {userImage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUserImage(null);
                        setUserImageFile(null);
                        setUserImageUrl('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Upload Options */}
                <div className="space-y-3">
                  <Button
                    onClick={() => personImageRef.current?.click()}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-purple-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-purple-500">Or</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Paste image URL"
                        value={userImageUrl}
                        onChange={(e) => handlePersonImageUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={isProcessing}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePersonImageUrl(userImageUrl)}
                      className="border-purple-200 text-purple-600"
                      disabled={isProcessing}
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <input
                  ref={personImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePersonImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Garment Image Upload */}
            <Card className="border-2 border-pink-100 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <Shirt className="w-5 h-5" />
                  Dress/Garment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview */}
                <div className="relative">
                  <div className="aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg border-2 border-dashed border-pink-200 flex items-center justify-center overflow-hidden">
                    {garmentImage ? (
                      <img
                        src={garmentImage}
                        alt="Garment"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-pink-400">
                        <Shirt className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Upload dress image</p>
                      </div>
                    )}
                  </div>
                  {garmentImage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setGarmentImage(null);
                        setGarmentImageFile(null);
                        setGarmentImageUrl('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Upload Options */}
                <div className="space-y-3">
                  <Button
                    onClick={() => garmentImageRef.current?.click()}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Dress
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-pink-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-pink-500">Or</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Paste dress image URL"
                        value={garmentImageUrl}
                        onChange={(e) => handleGarmentImageUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-pink-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        disabled={isProcessing}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGarmentImageUrl(garmentImageUrl)}
                      className="border-pink-200 text-pink-600"
                      disabled={isProcessing}
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <input
                  ref={garmentImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGarmentImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Try-On Result */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-100 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Sparkles className="w-5 h-5" />
                  Virtual Try-On Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden">
                  {tryOnResult?.output && tryOnResult.output.length > 0 && tryOnResult.status === 'completed' ? (
                    <img
                      src={tryOnResult.output[0]}
                      alt="Virtual try-on result"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : isProcessing ? (
                    <div className="text-center text-blue-400">
                      <RefreshCw className="w-16 h-16 mx-auto mb-4 animate-spin" />
                      <p className="text-lg font-medium mb-2">Creating Magic...</p>
                      <p className="text-sm">This usually takes 30-60 seconds</p>
                      {tryOnResult && (
                        <p className="text-xs mt-2 text-blue-300">
                          Status: {tryOnResult.status}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-blue-400">
                      <Sparkles className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">AI Magic Happens Here</p>
                      <p className="text-sm">Upload both images and click "Try On" to see the result</p>
                    </div>
                  )}
                </div>

                {/* Try-On Button */}
                <div className="mt-6">
                  <Button
                    onClick={handleTryOn}
                    disabled={!canTryOn}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Creating Magic...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Try On Dress
                      </>
                    )}
                  </Button>
                  
                  {!canTryOn && !isProcessing && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Please upload both your photo and a dress image
                    </p>
                  )}
                </div>

                {/* Success Actions */}
                {tryOnResult?.output && tryOnResult.output.length > 0 && tryOnResult.status === 'completed' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTryOnResult(null);
                        setError(null);
                      }}
                      className="flex-1 border-blue-200 text-blue-600"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Try Another
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = tryOnResult.output![0];
                        link.download = `virtual-tryon-${Date.now()}.png`;
                        link.click();
                      }}
                      className="flex-1 border-blue-200 text-blue-600"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Style Coach */}
          <AnimatePresence>
            {showStyleCoach && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="space-y-6"
              >
                <Card className="border-2 border-yellow-100 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <Sparkles className="w-5 h-5" />
                      Style Coach Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 leading-relaxed">
                          {STYLE_TIPS[currentTipIndex]}
                        </p>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentTipIndex((prev) => 
                            prev > 0 ? prev - 1 : STYLE_TIPS.length - 1
                          )}
                          className="border-yellow-200 text-yellow-600"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <span className="text-sm text-yellow-600 self-center">
                          {currentTipIndex + 1} of {STYLE_TIPS.length}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentTipIndex((prev) => 
                            prev < STYLE_TIPS.length - 1 ? prev + 1 : 0
                          )}
                          className="border-yellow-200 text-yellow-600"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Best Practices */}
                <Card className="border-2 border-green-100 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Camera className="w-5 h-5" />
                      Best Results Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-green-700">
                      <div>• Use full-body photos with good lighting</div>
                      <div>• Stand straight with arms slightly away from body</div>
                      <div>• Choose clear, high-quality garment images</div>
                      <div>• Avoid busy backgrounds for cleaner results</div>
                      <div>• Dress images work best on plain backgrounds</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 