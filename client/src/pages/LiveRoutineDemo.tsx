import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ReferenceMediaSelector from '@/components/ReferenceMediaSelector';
import { MartialArtsVideo } from '@/data/martialArtsVideos';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

const LiveRoutineDemo: React.FC = () => {
  const [, navigate] = useLocation();
  const [showSelector, setShowSelector] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    video: HTMLVideoElement;
    url: string;
    data?: MartialArtsVideo;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    image: HTMLImageElement;
    url: string;
  } | null>(null);

  const handleVideoUpload = (video: HTMLVideoElement, url: string, videoData?: MartialArtsVideo) => {
    setSelectedVideo({ video, url, data: videoData });
    setShowSelector(false);
  };

  const handleImageUpload = (image: HTMLImageElement, url: string) => {
    setSelectedImage({ image, url });
    setShowSelector(false);
  };

  const handleCancel = () => {
    setShowSelector(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-[#6b1b1b] to-black h-12 px-4 shadow-md flex items-center">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-white hover:text-red-400 font-semibold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>
        <div className="flex-1 flex justify-center">
          <span className="text-red-400 font-bold text-xl">Live Routine Demo</span>
        </div>
        <div className="w-24" /> {/* Spacer for symmetry */}
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-500 text-transparent bg-clip-text">
              Start Live Routine
            </h1>
            <p className="text-gray-300 text-lg">
              Choose a pre-loaded martial arts form or upload your own reference media
            </p>
          </div>

          {/* Main Action Button */}
          {!selectedVideo && !selectedImage && (
            <div className="text-center mb-8">
              <Button
                onClick={() => setShowSelector(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xl px-8 py-4 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300"
              >
                Select Reference Media
              </Button>
            </div>
          )}

          {/* Selected Media Display */}
          {selectedVideo && (
            <div className="bg-gray-800/50 rounded-lg p-6 border border-red-900/30 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-red-400">Selected Video</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <video
                    src={selectedVideo.url}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
                <div className="space-y-4">
                  {selectedVideo.data ? (
                    <>
                      <div>
                        <h4 className="font-semibold text-white">{selectedVideo.data.name}</h4>
                        <p className="text-gray-400">{selectedVideo.data.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                          {selectedVideo.data.category.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 text-white text-sm rounded-full ${
                          selectedVideo.data.difficulty === 'beginner' ? 'bg-green-600' :
                          selectedVideo.data.difficulty === 'intermediate' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}>
                          {selectedVideo.data.difficulty.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-gray-600 text-white text-sm rounded-full">
                          {selectedVideo.data.duration}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-white">Custom Video</h4>
                      <p className="text-gray-400">User uploaded video</p>
                    </div>
                  )}
                  <Button
                    onClick={() => setSelectedVideo(null)}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    Remove Video
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="bg-gray-800/50 rounded-lg p-6 border border-red-900/30 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-red-400">Selected Image</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedImage.url}
                    alt="Reference"
                    className="w-full rounded-lg"
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white">Custom Image</h4>
                    <p className="text-gray-400">User uploaded reference image</p>
                  </div>
                  <Button
                    onClick={() => setSelectedImage(null)}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    Remove Image
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(selectedVideo || selectedImage) && (
            <div className="text-center space-y-4">
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-lg px-8 py-3 rounded-lg shadow-lg hover:shadow-green-500/50 transition-all duration-300"
              >
                Start Live Comparison
              </Button>
              <div>
                <Button
                  onClick={() => setShowSelector(true)}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  Choose Different Media
                </Button>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-red-900/20">
              <div className="text-3xl mb-4">🥋</div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">Pre-loaded Forms</h3>
              <p className="text-gray-400">
                Choose from a library of martial arts forms including karate katas, taekwondo poomsae, and more.
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-red-900/20">
              <div className="text-3xl mb-4">📹</div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">Custom Uploads</h3>
              <p className="text-gray-400">
                Upload your own reference videos or images to compare with your live performance.
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-red-900/20">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">AI Analysis</h3>
              <p className="text-gray-400">
                Get real-time pose comparison and feedback to improve your martial arts technique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Media Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <ReferenceMediaSelector
            onImageUpload={handleImageUpload}
            onVideoUpload={handleVideoUpload}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
};

export default LiveRoutineDemo; 