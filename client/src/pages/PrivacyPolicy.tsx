import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Shield } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center text-pink-400 hover:text-pink-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-pink-400 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
            </div>
            <p className="text-gray-300 text-lg">Last updated: July 23, 2025</p>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl"
        >
          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">1.</span>
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Runway AI ("we", "us", or "our") is committed to protecting your privacy. This policy explains how we collect, use, store, and safeguard information when you use the Runway AI app and related services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you have questions or concerns about this policy or your data, contact us at:
              </p>
              <div className="bg-pink-50 border-l-4 border-pink-400 p-4 my-4">
                <div className="flex items-center mb-2">
                  <Mail className="w-4 h-4 text-pink-600 mr-2" />
                  <span className="font-semibold text-pink-800">Contact Information</span>
                </div>
                <p className="text-pink-700">
                  <strong>Ojas Kandhare:</strong> <a href="mailto:okandy@uw.edu" className="text-pink-600 hover:underline">okandy@uw.edu</a>
                </p>
                <p className="text-pink-700">
                  <strong>Arshia Kathpalia:</strong> <a href="mailto:arshia.x.kathpalia@gmail.com" className="text-pink-600 hover:underline">arshia.x.kathpalia@gmail.com</a>
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">2.</span>
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-700 mb-3">a. Information Provided by You</h3>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-600 mb-2">Account Details</h4>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Email address (used for account registration with our authentication provider, Supabase)</li>
                  <li>Display name or username (if provided)</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-600 mb-2">Profile and User Content</h4>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Profile photo (if added)</li>
                  <li>Event and calendar data that you create in the app (such as event titles, times, descriptions)</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-600 mb-2">Uploaded Content</h4>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Photos, videos, or audio recordings that you upload or create within the app (such as for Runway feedback, Interview Coach, or Dress Try-On)</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> We do not access, analyze, or share the contents of your uploaded media; all files remain private to your account unless you choose to share them.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-6">b. Device Permissions and Usage Data</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Camera Access:</strong> For photo/video features (e.g., dress try-on, runway feedback)</li>
                <li><strong>Microphone Access:</strong> For audio/video features (e.g., interview coaching)</li>
                <li><strong>Location Data:</strong> Used to enhance select features (such as event tracking, attendance, or analytics)</li>
                <li><strong>Basic Usage Data:</strong> Metrics such as feature usage frequency, error logs, and app navigation (used for internal improvements only)</li>
                <li><strong>Device and App Info:</strong> Such as device type, operating system, anonymous app identifiers</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">3.</span>
                How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To create, maintain, and verify your account</li>
                <li>To provide core features: live feedback, virtual try-on, event management, and coaching tools</li>
                <li>To store your content (media, calendar events) securely for your access</li>
                <li>To comply with legal and regulatory requirements</li>
                <li>To troubleshoot, maintain, and improve app performance</li>
              </ul>
            </section>

            {/* Deletion and User Control */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">4.</span>
                Deletion and User Control
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>In-App Account Deletion:</strong> You can delete your Runway AI account at any time from within the app. This will permanently erase your profile, calendar, and all associated data from our systems.</li>
                <li><strong>Access Control:</strong> You may review or update your profile and personal data in the app at any time.</li>
                <li><strong>Permissions:</strong> Camera, microphone, and location access can be controlled at the device level. Disabling permissions may limit certain features.</li>
              </ul>
            </section>

            {/* Data Sharing and Disclosure */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">5.</span>
                Data Sharing and Disclosure
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>No Sale of Personal Data:</strong> We do not sell, rent, or trade your personal information.</li>
                <li><strong>No Third-Party Services:</strong> As of July 23, 2025, Runway AI does not use any third-party analytics, advertising, or marketing platforms.</li>
                <li><strong>Legal Compliance Only:</strong> We may disclose information if required to do so by law or in response to valid legal requests (court order, government regulation, etc.).</li>
                <li><strong>Business Changes:</strong> In the event of a merger, acquisition, or asset sale, users will be notified before their information becomes subject to a different privacy policy.</li>
              </ul>
            </section>

            {/* Data Security and Storage */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">6.</span>
                Data Security and Storage
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Data Storage:</strong> All user data is securely stored on Supabase infrastructure; only authorized personnel have system-level access.</li>
                <li><strong>Uploaded Content:</strong> We cannot access, view, or use your uploaded media, except for internal debugging in rare, permission-granted cases (e.g., you report a bug with a file).</li>
                <li><strong>Encryption & Access Control:</strong> Data is encrypted at rest and in transit.</li>
              </ul>
            </section>

            {/* Your Rights and Choices */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">7.</span>
                Your Rights and Choices
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> You may view your account and content information at any time in-app.</li>
                <li><strong>Correction:</strong> Update your profile or fix errors in-app.</li>
                <li><strong>Erasure:</strong> Delete your account in-app for data removal; contact support for additional requests.</li>
                <li><strong>Children's Privacy:</strong> Runway AI is intended for users 13+. If you believe a child under 13 has created an account, contact us immediately for removal.</li>
              </ul>
            </section>

            {/* International Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">8.</span>
                International Data
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Data may be stored or processed in countries outside your own. We ensure appropriate safeguards are in place as required by applicable law.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">9.</span>
                Changes to This Policy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this policy as our app, features, or legal requirements evolve. Updates will be posted in-app and on our website, and a change of policy will be noted to all users.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-pink-500 mr-2">10.</span>
                Contact
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions, data deletion, or privacy concerns, email us at:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  <strong>Ojas Kandhare:</strong> <a href="mailto:okandy@uw.edu" className="text-pink-600 hover:underline">okandy@uw.edu</a>
                </p>
                <p className="text-gray-700">
                  <strong>Arshia Kathpalia:</strong> <a href="mailto:arshia.x.kathpalia@gmail.com" className="text-pink-600 hover:underline">arshia.x.kathpalia@gmail.com</a>
                </p>
              </div>
            </section>

            {/* Summary Note */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6 mt-8">
              <p className="text-gray-800 font-medium text-center">
                <strong>No marketing, advertising, or third-party analytics are used. You control your data, and all personal and uploaded information remains private and secure.</strong>
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}