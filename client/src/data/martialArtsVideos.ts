export interface MartialArtsVideo {
  id: string;
  name: string;
  description: string;
  category: 'taekwondo' | 'karate' | 'kung-fu' | 'boxing' | 'muay-thai' | 'jiu-jitsu';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  isLocalFile?: boolean;
}

export const martialArtsVideos: MartialArtsVideo[] = [
  // Taekwondo Forms - Local Video Files
  // To add a new video:
  // 1. Place the video file in public/videos/[category]/
  // 2. Add an entry here with the correct path
  // 3. Optionally add a thumbnail image in the same directory
  
  {
    id: 'taekwondo-form-1',
    name: 'Taegeuk 1 - Il Jang',
    description: 'First taekwondo poomsae with basic stances and blocks',
    category: 'taekwondo',
    difficulty: 'beginner',
    duration: '2:30',
    videoUrl: '/videos/taekwondo/Taegeuk 1 Il Jang.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 1 Il Jang.jpg',
    isLocalFile: true
  },
  {
    id: 'taekwondo-form-2',
    name: 'Taegeuk 2 - Ee Jang',
    description: 'Second taekwondo poomsae with advancing techniques',
    category: 'taekwondo',
    difficulty: 'beginner',
    duration: '2:03',
    videoUrl: '/videos/taekwondo/Taegeuk 2 Ee Jang June 16 2025.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 2 Ee Jang.jpg',
    isLocalFile: true
  },
  {
    id: 'taekwondo-form-3',
    name: 'Taegeuk 3 - Sam Jang',
    description: 'Third taekwondo poomsae with enhanced stance work and kicking techniques',
    category: 'taekwondo',
    difficulty: 'intermediate',
    duration: '2:12',
    videoUrl: '/videos/taekwondo/Taegeuk 3 Sam Jang June 16 2025.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 3 Sam Jang.jpg',
    isLocalFile: true
  },
  {
    id: 'taekwondo-form-4',
    name: 'Taegeuk 4 - Sa Jang',
    description: 'Fourth taekwondo poomsae with advanced combinations and footwork',
    category: 'taekwondo',
    difficulty: 'intermediate',
    duration: '2:05',
    videoUrl: '/videos/taekwondo/Taegeuk 4 Sa Jang June 16 2025.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 4 Sa Jang.jpg',
    isLocalFile: true
  },
  {
    id: 'taekwondo-form-5',
    name: 'Taegeuk 5 - Oh Jang',
    description: 'Fifth taekwondo poomsae with complex turning movements and techniques',
    category: 'taekwondo',
    difficulty: 'intermediate',
    duration: '2:18',
    videoUrl: '/videos/taekwondo/Taegeuk 5 Oh Jang June 16 2025.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 5 Oh Jang.jpg',
    isLocalFile: true
  },
  {
    id: 'taekwondo-form-6',
    name: 'Taegeuk 6 - Yook Jang',
    description: 'Sixth taekwondo poomsae with advanced kicking and defensive techniques',
    category: 'taekwondo',
    difficulty: 'advanced',
    duration: '2:14',
    videoUrl: '/videos/taekwondo/Taegeuk 6 Yook Jang June 16 2025.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 6 Yook Jang.jpg',
    isLocalFile: true
  },
  {
    id: 'taekwondo-form-7',
    name: 'Taegeuk 7 - Chil Jang',
    description: 'Seventh taekwondo poomsae with sophisticated movements and advanced techniques',
    category: 'taekwondo',
    difficulty: 'advanced',
    duration: '2:45',
    videoUrl: '/videos/taekwondo/Taegeuk 7 Chil Jang June 16 2025.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 7 Chil Jang.jpg',
    isLocalFile: true
  },
  {
    id: 'taekwondo-form-8',
    name: 'Taegeuk 8 - Pal Jang',
    description: 'Eighth taekwondo poomsae with master-level techniques and complex combinations',
    category: 'taekwondo',
    difficulty: 'advanced',
    duration: '2:29',
    videoUrl: '/videos/taekwondo/Taegeuk 8 Pal Jang June 17 2025.mp4',
    thumbnailUrl: '/videos/taekwondo/Taegeuk 8 Pal Jang.jpg',
    isLocalFile: true
  }
];

export const getCategorizedVideos = () => {
  const categories = martialArtsVideos.reduce((acc, video) => {
    if (!acc[video.category]) {
      acc[video.category] = [];
    }
    acc[video.category].push(video);
    return acc;
  }, {} as Record<string, MartialArtsVideo[]>);
  
  return categories;
};

export const getVideoById = (id: string): MartialArtsVideo | undefined => {
  return martialArtsVideos.find(video => video.id === id);
}; 