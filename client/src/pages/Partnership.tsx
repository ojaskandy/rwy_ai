import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building, Users, Target, Trophy, HandHeart, Mail, Phone, Globe } from "lucide-react";
import { Link } from "wouter";

const partnershipSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  organizationType: z.enum(["dojo", "school", "gym", "community_center", "corporate", "other"], {
    required_error: "Please select your organization type"
  }),
  partnershipType: z.enum(["training_partner", "technology_integration", "content_collaboration", "equipment_sponsor", "event_partnership", "other"], {
    required_error: "Please select partnership type"
  }),
  studentCount: z.string().min(1, "Please specify number of students/members"),
  message: z.string().min(50, "Please provide at least 50 characters describing your partnership interest"),
});

type PartnershipFormValues = z.infer<typeof partnershipSchema>;

export default function Partnership() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<PartnershipFormValues>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: {
      organizationName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      organizationType: undefined,
      partnershipType: undefined,
      studentCount: "",
      message: "",
    },
  });

  const onSubmit = async (data: PartnershipFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(`Partnership Inquiry from ${data.organizationName}`);
      const body = encodeURIComponent(`
Partnership Inquiry

Organization: ${data.organizationName}
Contact: ${data.contactName}
Email: ${data.email}
Phone: ${data.phone}
Website: ${data.website || "Not provided"}
Organization Type: ${data.organizationType}
Partnership Type: ${data.partnershipType}
Student/Member Count: ${data.studentCount}

Message:
${data.message}

---
Sent from CoachT Partnership Portal
      `);
      
      window.location.href = `mailto:partnerships@coacht.ai?subject=${subject}&body=${body}`;
      
      setTimeout(() => {
        setIsSubmitted(true);
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error("Error submitting partnership form:", error);
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md mx-auto px-4"
        >
          <div className="mb-8">
            <Trophy className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 mb-4">
              Thank You!
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Your partnership inquiry has been sent. We'll get back to you within 24 hours.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Return to Home
              </Button>
            </Link>
            <Link href="/welcome">
              <Button variant="outline" className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                Learn More About CoachT
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20" />
      
      {/* Header */}
      <div className="relative z-10 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-red-400 hover:text-red-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
              Partnership
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join forces with CoachT to revolutionize martial arts training at your organization
            </p>
          </motion.div>
        </div>
      </div>

      {/* Partnership Benefits */}
      <div className="relative z-10 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-red-900/30 backdrop-blur-lg">
                <CardHeader>
                  <Target className="h-8 w-8 text-red-500 mb-2" />
                  <CardTitle className="text-red-400">Enhanced Training</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Provide your students with AI-powered form analysis and personalized feedback to accelerate their progress.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-red-900/30 backdrop-blur-lg">
                <CardHeader>
                  <Users className="h-8 w-8 text-red-500 mb-2" />
                  <CardTitle className="text-red-400">Community Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Attract new students with cutting-edge technology and retain existing ones with engaging training experiences.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-red-900/30 backdrop-blur-lg">
                <CardHeader>
                  <HandHeart className="h-8 w-8 text-red-500 mb-2" />
                  <CardTitle className="text-red-400">Instructor Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Empower your instructors with detailed analytics and progress tracking to provide better guidance.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Partnership Form */}
      <div className="relative z-10 px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-red-900/30 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-red-400 text-center">
                  Partnership Inquiry
                </CardTitle>
                <CardDescription className="text-gray-300 text-center">
                  Tell us about your organization and how we can work together
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-red-400">Organization Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your dojo, school, or organization"
                                {...field}
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-red-400">Contact Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your full name"
                                {...field}
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-red-400">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@organization.com"
                                {...field}
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-red-400">Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(555) 123-4567"
                                {...field}
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-red-400">Website (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://yourorganization.com"
                              {...field}
                              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organizationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-red-400">Organization Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dojo">Martial Arts Dojo</SelectItem>
                                <SelectItem value="school">School/Educational Institution</SelectItem>
                                <SelectItem value="gym">Fitness Center/Gym</SelectItem>
                                <SelectItem value="community_center">Community Center</SelectItem>
                                <SelectItem value="corporate">Corporate Wellness</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="partnershipType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-red-400">Partnership Interest</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                  <SelectValue placeholder="Select partnership type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="training_partner">Training Partner</SelectItem>
                                <SelectItem value="technology_integration">Technology Integration</SelectItem>
                                <SelectItem value="content_collaboration">Content Collaboration</SelectItem>
                                <SelectItem value="equipment_sponsor">Equipment Sponsorship</SelectItem>
                                <SelectItem value="event_partnership">Event Partnership</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="studentCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-red-400">Number of Students/Members</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 50, 100-200, 500+"
                              {...field}
                              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-red-400">Partnership Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your organization, your goals, and how you envision working together with CoachT..."
                              className="min-h-[120px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                    >
                      {isSubmitting ? "Sending..." : "Send Partnership Inquiry"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="relative z-10 px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-red-400 mb-8">Get in Touch</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Mail className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <p className="text-gray-300">
                  <span className="font-semibold">Email:</span><br />
                  partnerships@coacht.ai
                </p>
              </div>
              <div className="text-center">
                <Phone className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <p className="text-gray-300">
                  <span className="font-semibold">Phone:</span><br />
                  Coming Soon
                </p>
              </div>
              <div className="text-center">
                <Globe className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <p className="text-gray-300">
                  <span className="font-semibold">Website:</span><br />
                  coacht.ai
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}