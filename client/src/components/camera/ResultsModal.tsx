import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Target, Lightbulb, BarChart3, MessageCircle, X, Sparkles, CheckCircle, Copy, Check, Volume2, VolumeX, Loader2, Home, ArrowLeft, Settings, User, MessageSquare } from 'lucide-react';

interface JointScore {
  joint: string;
  score: number;
  feedback: string;
  category: 'excellent' | 'good' | 'fair' | 'needs-improvement';
}

interface PerformanceData {
  joint: string;
  userAverage: number;
  instructorAverage: number;
  difference: number;
  consistency: number;
  userRange: string;
  instructorRange: string;
}

interface NaturalLanguageAnalysis {
  feedback: string;
  techniqueTips: string;
  performanceData: PerformanceData[];
  timestamp: string;
}

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores?: JointScore[];
  overallScore?: number;
  feedback?: string;
  timing?: any;
  recordedVideo?: string;
  routineNotes?: string;
  angleData?: {
    timestamps: string[];
    userAngles: { [joint: string]: number[] };
    expectedAngles: { [joint: string]: number[] };
  };
  dtwResults?: Record<string, any>;
  userAngleTable?: {
    timestamps: string[];
    angles: { [joint: string]: number[] };
  };
  instructorAngleTable?: {
    timestamps: string[];
    angles: { [joint: string]: number[] };
  };
  fastDtwResults?: {
    overallScore: number;
    detailedJointScores: Array<{ name: string; score: number; cost: number }>;
  };
}

export default function ResultsModal({
  isOpen,
  onClose,
  scores = [],
  overallScore = 0,
  feedback = 'No feedback available.',
  timing,
  recordedVideo,
  routineNotes,
  angleData,
  dtwResults,
  userAngleTable,
  instructorAngleTable,
  fastDtwResults,
}: ResultsModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [naturalLanguageAnalysis, setNaturalLanguageAnalysis] = useState<NaturalLanguageAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'technical'>('overview');
  const [showCelebration, setShowCelebration] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Calculate performance metrics - ensure score is capped at 100
  const rawScore = fastDtwResults?.overallScore || overallScore || 0;
  const performanceScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const performanceLevel = performanceScore >= 85 ? 'excellent' : 
                          performanceScore >= 70 ? 'good' : 
                          performanceScore >= 50 ? 'fair' : 'needs-improvement';

  // Audio functions first
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsPlayingAudio(false);
  };

  const handlePlayAudio = async (text: string) => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
        setIsPlayingAudio(false);
      }

      // If we're currently playing the same text, just stop
      if (isPlayingAudio) {
        return;
      }

      setIsPlayingAudio(true);

      // Call the TTS endpoint
      const response = await fetch('/api/shifu/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      // Create audio from the response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Set up event listeners
      audio.addEventListener('ended', () => {
        setIsPlayingAudio(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      });

      audio.addEventListener('error', () => {
        setIsPlayingAudio(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      });

      // Play the audio
      setCurrentAudio(audio);
      await audio.play();

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      setCurrentAudio(null);
    }
  };

  // Get natural language analysis
  const getIntelligentAnalysis = async () => {
    if (!userAngleTable || !instructorAngleTable) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/routine-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAngleData: userAngleTable,
          instructorAngleData: instructorAngleTable,
          routineType: 'martial arts routine',
          overallScore: performanceScore
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setNaturalLanguageAnalysis(analysis);
        if (performanceScore >= 85) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
    } catch (error) {
      console.error('Failed to get intelligent analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-trigger analysis when modal opens
  useEffect(() => {
    if (isOpen && !naturalLanguageAnalysis && userAngleTable && instructorAngleTable) {
      getIntelligentAnalysis();
    }
  }, [isOpen, userAngleTable, instructorAngleTable]);

  // Cleanup audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-blue-500 to-blue-600';
    if (score >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const parseTechniqueTips = (tipsString: string): string[] => {
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(tipsString);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If not JSON, split by common delimiters
      return tipsString.split(/\d+\.\s*|\n-\s*|\n\*\s*/)
        .filter(tip => tip.trim().length > 0)
        .map(tip => tip.trim())
        .slice(0, 3);
    }
    return [tipsString];
  };

  const copyTechnicalData = () => {
    if (!userAngleTable || !instructorAngleTable) return;
    
    const userJoints = Object.keys(userAngleTable.angles);
    const instructorJoints = Object.keys(instructorAngleTable.angles);
    
    let userData = "USER JOINT DATA:\n";
    userJoints.forEach(joint => {
      userData += `${joint}: [${userAngleTable.angles[joint].join(', ')}]\n`;
    });
    
    let instructorData = "\nINSTRUCTOR JOINT DATA:\n";
    instructorJoints.forEach(joint => {
      instructorData += `${joint}: [${instructorAngleTable.angles[joint].join(', ')}]\n`;
    });
    
    const fullData = `CoachT Technical Analysis\n\nOverall Score: ${performanceScore}%\nTimestamps: ${userAngleTable.timestamps.length}\n\n${userData}${instructorData}`;
    
    navigator.clipboard.writeText(fullData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const navigateToHomepage = () => {
    window.location.href = '/app';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Celebration animation */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-60">
          <div className="absolute top-1/4 left-1/4 animate-bounce">
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </div>
          <div className="absolute top-1/3 right-1/3 animate-bounce delay-150">
            <Trophy className="h-6 w-6 text-gold-500" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-bounce delay-300">
            <CheckCircle className="h-7 w-7 text-green-400" />
          </div>
        </div>
      )}

      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Performance Analysis</CardTitle>
                <CardDescription className="text-purple-100">
                  Your martial arts technique breakdown
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToHomepage}
                className="text-white hover:bg-white/20"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Overall Score Display */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border-4 border-white/30">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                    {performanceScore}
                  </div>
                  <div className="text-sm text-white/80">Overall Score</div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className={`bg-gradient-to-r ${getScoreGradient(performanceScore)} text-white border-0`}>
                  {performanceLevel.charAt(0).toUpperCase() + performanceLevel.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <Progress 
            value={performanceScore} 
            className="mt-4 h-2 bg-white/20"
          />
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>AI Insights</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Technical</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{performanceScore}%</div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {fastDtwResults?.detailedJointScores?.length || 0}
                    </div>
                    <div className="text-sm text-gray-400">Joints Analyzed</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {userAngleTable?.timestamps?.length || 0}
                    </div>
                    <div className="text-sm text-gray-400">Data Points</div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Breakdown */}
              {fastDtwResults && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Joint Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {fastDtwResults.detailedJointScores.map((joint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-white font-medium">
                              {joint.name.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(joint.score)}`}
                                style={{ width: `${joint.score}%` }}
                              />
                            </div>
                            <span className={`font-bold ${getScoreColor(joint.score)}`}>
                              {joint.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              {isAnalyzing ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <div className="text-white font-medium">Analyzing your performance...</div>
                    <div className="text-gray-400 text-sm mt-2">Our AI is reviewing your technique</div>
                  </CardContent>
                </Card>
              ) : naturalLanguageAnalysis ? (
                <div className="space-y-6">
                  {/* Shifu Feedback */}
                  <Card className="bg-gradient-to-br from-purple-900 to-blue-900 border-purple-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center space-x-2">
                          <MessageCircle className="h-5 w-5" />
                          <span>Shifu Feedback</span>
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => isPlayingAudio ? stopAudio() : handlePlayAudio(naturalLanguageAnalysis.feedback)}
                          className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40"
                          disabled={!naturalLanguageAnalysis.feedback}
                        >
                          {isPlayingAudio ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Playing...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-2" />
                              Listen
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-100 leading-relaxed whitespace-pre-line">
                        {naturalLanguageAnalysis.feedback}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technique Tips */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5" />
                        <span>Technique Tips</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {parseTechniqueTips(naturalLanguageAnalysis.techniqueTips).map((tip, index) => (
                          <Alert key={index} className="bg-gray-700 border-gray-600">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <AlertDescription className="text-gray-200">
                              {tip}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <div className="text-white font-medium">No analysis available</div>
                    <div className="text-gray-400 text-sm mt-2">
                      Complete a routine with instructor data to get AI insights
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="technical" className="space-y-6 mt-6">
              {/* Technical Data */}
              {userAngleTable && instructorAngleTable && (
                <div className="space-y-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Technical Analysis</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyTechnicalData}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Data
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-sm text-gray-400">Overall Score</div>
                          <div className="text-2xl font-bold text-white">{performanceScore}%</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-sm text-gray-400">Data Points</div>
                          <div className="text-2xl font-bold text-white">{userAngleTable.timestamps.length}</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-sm text-gray-400">Joints Tracked</div>
                          <div className="text-2xl font-bold text-white">{Object.keys(userAngleTable.angles).length}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* User Angle Data Table */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Your Joint Angles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                          <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                            <tr>
                              <th className="px-4 py-2">Joint</th>
                              <th className="px-4 py-2">Avg Angle</th>
                              <th className="px-4 py-2">Min</th>
                              <th className="px-4 py-2">Max</th>
                              <th className="px-4 py-2">Range</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(userAngleTable.angles).map(([joint, angles]) => {
                              const avg = (angles.reduce((a, b) => a + b, 0) / angles.length).toFixed(1);
                              const min = Math.min(...angles).toFixed(1);
                              const max = Math.max(...angles).toFixed(1);
                              const range = (Math.max(...angles) - Math.min(...angles)).toFixed(1);
                              return (
                                <tr key={joint} className="border-b border-gray-700">
                                  <td className="px-4 py-2 font-medium text-white">{joint.replace(/_/g, ' ')}</td>
                                  <td className="px-4 py-2">{avg}°</td>
                                  <td className="px-4 py-2">{min}°</td>
                                  <td className="px-4 py-2">{max}°</td>
                                  <td className="px-4 py-2">{range}°</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Instructor Angle Data Table */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Instructor Joint Angles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                          <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                            <tr>
                              <th className="px-4 py-2">Joint</th>
                              <th className="px-4 py-2">Avg Angle</th>
                              <th className="px-4 py-2">Min</th>
                              <th className="px-4 py-2">Max</th>
                              <th className="px-4 py-2">Range</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(instructorAngleTable.angles).map(([joint, angles]) => {
                              const avg = (angles.reduce((a, b) => a + b, 0) / angles.length).toFixed(1);
                              const min = Math.min(...angles).toFixed(1);
                              const max = Math.max(...angles).toFixed(1);
                              const range = (Math.max(...angles) - Math.min(...angles)).toFixed(1);
                              return (
                                <tr key={joint} className="border-b border-gray-700">
                                  <td className="px-4 py-2 font-medium text-white">{joint.replace(/_/g, ' ')}</td>
                                  <td className="px-4 py-2">{avg}°</td>
                                  <td className="px-4 py-2">{min}°</td>
                                  <td className="px-4 py-2">{max}°</td>
                                  <td className="px-4 py-2">{range}°</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-6 bg-gray-700" />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Close
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
