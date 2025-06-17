import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle } from "lucide-react";

const internshipApplicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  socialMediaHandle: z.string().optional(),
  socialMediaPlatform: z.enum(["linkedin", "twitter", "github", "instagram", "tiktok", "other"]).optional(),
  technicalHackAnswer: z.string().max(100, "Please keep under 100 words").optional(),
  unorthodoxThingAnswer: z.string().max(100, "Please keep under 100 words").optional(),
  resumeFileName: z.string().optional(),
  resumeFileUrl: z.string().optional(),
});

type InternshipApplicationFormValues = z.infer<typeof internshipApplicationSchema>;

export default function InternshipApplication() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<InternshipApplicationFormValues>({
    resolver: zodResolver(internshipApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      socialMediaHandle: "",
      socialMediaPlatform: undefined,
      technicalHackAnswer: "",
      unorthodoxThingAnswer: "",
      resumeFileName: "",
      resumeFileUrl: "",
    },
  });

  const applicationMutation = useMutation({
    mutationFn: async (data: InternshipApplicationFormValues) => {
      const response = await apiRequest("POST", "/api/internship-applications", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && file.type !== "application/msword" && 
        file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('applicantName', form.getValues('fullName') || 'unknown');

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setResumeFile(file);
      form.setValue("resumeFileName", file.name);
      form.setValue("resumeFileUrl", result.fileUrl);
      setUploading(false);
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been attached successfully.",
      });
    } catch (error) {
      setUploading(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: InternshipApplicationFormValues) => {
    applicationMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <CheckCircle className="w-24 h-24 text-red-500 mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-gray-300 mb-6">
            Thank you for your interest in joining the CoachT team. We'll review your application and get back to you soon.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25"
          >
            Return to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Join the <span className="text-red-500">CoachT</span> Team
          </h1>
          <p className="text-gray-300 text-lg">
            Revolutionize martial arts training with AI
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900/80 border-red-900/50 backdrop-blur-sm shadow-xl shadow-red-500/10">
            <CardHeader className="border-b border-red-900/30">
              <CardTitle className="text-white text-2xl">Internship Application</CardTitle>
              <CardDescription className="text-gray-400">
                We're looking for passionate individuals to join our mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Full Name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              placeholder="Your full name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              placeholder="your.email@example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Social Media */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="socialMediaPlatform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Most Relevant Social Platform</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500">
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="github">GitHub</SelectItem>
                              <SelectItem value="twitter">Twitter</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="tiktok">TikTok</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socialMediaHandle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Handle/Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              placeholder="@username or profile URL"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Optional Questions */}
                  <FormField
                    control={form.control}
                    name="technicalHackAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">
                          Technical/Non-technical System Hack (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-20 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            placeholder="Describe a technical or non-technical system you hacked to your benefit (under 100 words)"
                            maxLength={600}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unorthodoxThingAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">
                          Unorthodox/Silly Thing You Made People Care About (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-20 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            placeholder="Describe something unorthodox or silly you got people to care about and how (under 100 words)"
                            maxLength={600}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Resume Upload */}
                  <div className="space-y-4">
                    <FormLabel className="text-white font-medium">Resume Upload</FormLabel>
                    <div className="border-2 border-dashed border-red-800/50 rounded-lg p-6 text-center bg-gray-800/30">
                      {resumeFile ? (
                        <div className="flex items-center justify-center space-x-2 text-red-400">
                          <FileText className="w-5 h-5" />
                          <span>{resumeFile.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-red-400 mx-auto" />
                          <p className="text-gray-300">Upload your resume (PDF or Word)</p>
                          <p className="text-sm text-gray-500">Max file size: 5MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className={`inline-block mt-4 px-6 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          uploading 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                        }`}
                      >
                        {uploading ? 'Uploading...' : resumeFile ? 'Change Resume' : 'Choose File'}
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={applicationMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 text-lg font-bold shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
                  >
                    {applicationMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}