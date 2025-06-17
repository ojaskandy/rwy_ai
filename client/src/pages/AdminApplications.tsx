import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, Mail, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";

type InternshipApplication = {
  id: number;
  fullName: string;
  email: string;
  socialMediaHandle?: string;
  socialMediaPlatform?: string;
  technicalHackAnswer?: string;
  unorthodoxThingAnswer?: string;
  resumeFileName?: string;
  resumeFileUrl?: string;
  createdAt: string;
};

export default function AdminApplications() {
  const { data: applications, isLoading, error } = useQuery<InternshipApplication[]>({
    queryKey: ["/api/internship-applications"],
  });

  const handleDownloadResume = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openSocialMedia = (platform: string, handle: string) => {
    let url = handle;
    if (!handle.startsWith('http')) {
      switch (platform) {
        case 'linkedin':
          url = handle.startsWith('/') ? `https://linkedin.com${handle}` : `https://linkedin.com/in/${handle}`;
          break;
        case 'github':
          url = `https://github.com/${handle.replace('@', '')}`;
          break;
        case 'twitter':
          url = `https://twitter.com/${handle.replace('@', '')}`;
          break;
        case 'instagram':
          url = `https://instagram.com/${handle.replace('@', '')}`;
          break;
        case 'tiktok':
          url = `https://tiktok.com/@${handle.replace('@', '')}`;
          break;
        default:
          url = handle;
      }
    }
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading applications</p>
          <p className="text-gray-400">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="text-red-500">CoachT</span> Internship Applications
          </h1>
          <p className="text-gray-300 text-lg">
            Review and manage candidate applications
          </p>
        </motion.div>

        {applications && applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-gray-400 text-lg">No applications received yet</p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {applications?.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/80 border-red-900/50 backdrop-blur-sm shadow-xl shadow-red-500/10">
                  <CardHeader className="border-b border-red-900/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white text-xl flex items-center gap-2">
                          <User className="w-5 h-5 text-red-400" />
                          {application.fullName}
                        </CardTitle>
                        <CardDescription className="text-gray-400 flex items-center gap-2 mt-2">
                          <Mail className="w-4 h-4" />
                          {application.email}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-gray-300 border-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6 space-y-6">
                    {/* Social Media */}
                    {application.socialMediaPlatform && application.socialMediaHandle && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Social Media</h4>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-600/20 text-red-300 border-red-600/50">
                            {application.socialMediaPlatform}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSocialMedia(application.socialMediaPlatform!, application.socialMediaHandle!)}
                            className="text-gray-300 hover:text-white hover:bg-red-600/20"
                          >
                            {application.socialMediaHandle}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Resume */}
                    {application.resumeFileUrl && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Resume</h4>
                        <Button
                          onClick={() => handleDownloadResume(application.resumeFileUrl!, application.resumeFileName || 'resume.pdf')}
                          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download {application.resumeFileName || 'Resume'}
                        </Button>
                      </div>
                    )}

                    {/* Technical Hack Answer */}
                    {application.technicalHackAnswer && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Technical/System Hack</h4>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <p className="text-gray-300">{application.technicalHackAnswer}</p>
                        </div>
                      </div>
                    )}

                    {/* Unorthodox Thing Answer */}
                    {application.unorthodoxThingAnswer && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Unorthodox/Silly Achievement</h4>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <p className="text-gray-300">{application.unorthodoxThingAnswer}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}