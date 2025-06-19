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
  },

  // Karate Kata - Local Video Files
  {
    id: 'karate-kata-1',
    name: 'Heian Shodan',
    description: 'First kata in the Heian series - fundamental Shotokan karate form with basic blocks, punches and stances',
    category: 'karate',
    difficulty: 'beginner',
    duration: '2:28',
    videoUrl: '/videos/karate/Heian Shodan June 17 2025.mp4',
    thumbnailUrl: '/videos/karate/Heian Shodan.jpg',
    isLocalFile: true
  },
  {
    id: 'karate-kata-2',
    name: 'Heian Nidan',
    description: 'Second kata in the Heian series - builds on Heian Shodan with new techniques including knife hand and side kicks',
    category: 'karate',
    difficulty: 'beginner',
    duration: '2:42',
    videoUrl: '/videos/karate/Heian Nidan June 18 2025.mp4',
    thumbnailUrl: '/videos/karate/Heian Nidan.jpg',
    isLocalFile: true
  },
  {
    id: 'karate-kata-3',
    name: 'Heian Sandan',
    description: 'Third kata in the Heian series - introduces more complex movements, turns, and advanced techniques',
    category: 'karate',
    difficulty: 'intermediate',
    duration: '2:32',
    videoUrl: '/videos/karate/Heian Sandan June 18 2025.mp4',
    thumbnailUrl: '/videos/karate/Heian Sandan.jpg',
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