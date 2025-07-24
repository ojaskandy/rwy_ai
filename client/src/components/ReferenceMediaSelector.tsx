import { useState } from 'react';
import { Button } from '@/components/ui/button';
import MediaUploader from './MediaUploader';
import PreloadedVideoSelector from './PreloadedVideoSelector';
import { MartialArtsVideo } from '@/data/martialArtsVideos';

interface ReferenceMediaSelectorProps {
  onImageUpload: (image: HTMLImageElement, url: string) => void;
  onVideoUpload: (video: HTMLVideoElement, url: string, videoData?: MartialArtsVideo) => void;
  onCancel: () => void;
}

export default function ReferenceMediaSelector({ 
  onImageUpload, 
  onVideoUpload, 
  onCancel 
}: ReferenceMediaSelectorProps) {
  const [currentView, setCurrentView] = useState<'main' | 'preloaded' | 'upload'>('main');

  const handlePreloadedVideoSelect = (video: HTMLVideoElement | null, url: string, videoData: MartialArtsVideo) => {
    if (video) {
      onVideoUpload(video, url, videoData);
    }
  };

  const handleCustomVideoUpload = (video: HTMLVideoElement, url: string) => {
    onVideoUpload(video, url);
  };

  const handleCustomImageUpload = (image: HTMLImageElement, url: string) => {
    onImageUpload(image, url);
  };

  if (currentView === 'preloaded') {
    return (
      <PreloadedVideoSelector
        onVideoSelect={handlePreloadedVideoSelect}
        onCancel={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'upload') {
    return (
      <MediaUploader
        onImageUpload={handleCustomImageUpload}
        onVideoUpload={handleCustomVideoUpload}
        onCancel={() => setCurrentView('main')}
      />
    );
  }

  // Main selection view
  return (
    <div className="p-8 bg-white rounded-xl max-w-md w-full border border-pink-200 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-serif bg-gradient-to-r from-pink-500 to-pink-600 text-transparent bg-clip-text">
          Select Reference Media
        </h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-pink-600"
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      <p className="text-gray-600 text-center mb-8">
        Upload an image or video to compare with your live tracking
      </p>

      <div className="space-y-4">
        {/* Pre-loaded Video Option */}
        <Button
          onClick={() => setCurrentView('preloaded')}
          className="w-full h-16 bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white font-semibold text-lg flex items-center justify-center gap-3 rounded-xl"
        >
          <span className="material-icons text-2xl">video_library</span>
          Choose Pre-loaded Video
        </Button>

        {/* Upload Option */}
        <Button
          onClick={() => setCurrentView('upload')}
          className="w-full h-16 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold text-lg flex items-center justify-center gap-3 rounded-xl border border-gray-300"
        >
          <span className="material-icons text-2xl">file_upload</span>
          Upload Video
        </Button>

        {/* Cancel Button */}
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full border-pink-200 bg-transparent text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-xl"
        >
          <span className="material-icons mr-2">close</span>
          Cancel
        </Button>
      </div>

      <div className="mt-6 pt-4 border-t border-pink-100">
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Pre-loaded videos include training routines and techniques</p>
          <p>Upload supports: JPG, PNG, WEBP, MP4, WEBM</p>
        </div>
      </div>
    </div>
  );
} 