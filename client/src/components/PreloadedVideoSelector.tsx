import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { martialArtsVideos, getCategorizedVideos, MartialArtsVideo } from '@/data/martialArtsVideos';

interface PreloadedVideoSelectorProps {
  onVideoSelect: (video: HTMLVideoElement, url: string, videoData: MartialArtsVideo) => void;
  onCancel: () => void;
}

export default function PreloadedVideoSelector({ onVideoSelect, onCancel }: PreloadedVideoSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);
  
  const categorizedVideos = getCategorizedVideos();
  const categories = Object.keys(categorizedVideos);
  
  // Filter videos based on search and category
  const filteredVideos = martialArtsVideos.filter(video => {
    const matchesSearch = video.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleVideoSelect = async (videoData: MartialArtsVideo) => {
    setLoading(videoData.id);
    
    try {
      // Create video element and load the local video file
      const video = document.createElement('video');
      video.onloadeddata = () => {
        setLoading(null);
        onVideoSelect(video, videoData.videoUrl, videoData);
      };
      video.onerror = () => {
        setLoading(null);
        console.error('Failed to load video:', videoData.videoUrl);
        alert(`Failed to load video: ${videoData.name}. Please make sure the video file exists at ${videoData.videoUrl}`);
      };
      video.src = videoData.videoUrl;
      video.load();
    } catch (error) {
      setLoading(null);
      console.error('Error loading video:', error);
      alert('Error loading video. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-600';
      case 'intermediate': return 'bg-yellow-600';
      case 'advanced': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'karate': return '🥋';
      case 'taekwondo': return '🦵';
      case 'kung-fu': return '🐉';
      case 'boxing': return '🥊';
      case 'muay-thai': return '🇹🇭';
      case 'jiu-jitsu': return '🤼';
      default: return '🥋';
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden border border-red-900/30 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-serif bg-gradient-to-r from-red-500 to-red-600 text-transparent bg-clip-text">
          Choose Martial Arts Form
        </h3>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Info */}
      <div className="mb-6 p-3 bg-gray-800/50 rounded-lg border border-red-900/30">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="material-icons text-sm text-blue-400">info</span>
          <span>All videos support full pose detection and skeleton analysis</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <Input
          type="text"
          placeholder="Search forms and techniques..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border-red-900/30 text-white placeholder-gray-400"
        />
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-red-600 hover:bg-red-700' : 'border-red-900/30 text-gray-300 hover:bg-red-900/20'}
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'bg-red-600 hover:bg-red-700' : 'border-red-900/30 text-gray-300 hover:bg-red-900/20'}
            >
              {getCategoryIcon(category)} {category.replace('-', ' ').toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="overflow-y-auto max-h-96 pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map(video => (
            <div
              key={video.id}
              className="bg-gray-800/50 rounded-lg border border-red-900/30 overflow-hidden hover:border-red-600/50 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative h-32 bg-gray-700 overflow-hidden">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to category icon if thumbnail doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-4xl">${getCategoryIcon(video.category)}</div>`;
                    }
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge className={`${getDifficultyColor(video.difficulty)} text-white text-xs`}>
                    {video.difficulty}
                  </Badge>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <span className="material-icons text-xs">analytics</span>
                  Full Analysis
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h4 className="font-semibold text-white mb-2 line-clamp-2">{video.name}</h4>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                
                <Button
                  onClick={() => handleVideoSelect(video)}
                  disabled={loading === video.id}
                  className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-sm"
                >
                  {loading === video.id ? (
                    <>
                      <span className="material-icons animate-spin text-sm mr-2">hourglass_top</span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-sm mr-2">play_arrow</span>
                      Select Form
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredVideos.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <span className="material-icons text-4xl mb-2">search_off</span>
            <p>No forms found matching your criteria</p>
            <p className="text-sm mt-2">Try uploading your video files to the public/videos/ directory</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-red-900/30 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-red-900/30 bg-gray-900 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </Button>
        <div className="text-sm text-gray-400">
          {filteredVideos.length} form{filteredVideos.length !== 1 ? 's' : ''} available
        </div>
      </div>
    </div>
  );
} 