import React, { useState } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Shield,
  Sparkles,
  CheckCircle,
  Crown,
  ArrowLeft,
  Check,
} from "lucide-react";

interface OnboardingPaymentProps {
  onSuccess: () => void;
  onBack: () => void;
}

// Pricing plans
const PRICING_PLANS = {
  monthly: {
    price: 12,
    priceId: "price_1RkdiWHq7hIb1YPg2YZDnjlc", // Real monthly Price ID
    displayPrice: "$12",
    billing: "Billed monthly",
    description: "Monthly Subscription",
  },
  yearly: {
    price: 96,
    priceId: "price_1RkdiWHq7hIb1YPgdHcYotQZ", // Real yearly Price ID
    displayPrice: "$96",
    billing: "Only $8/month",
    description: "Yearly Subscription",
    savings: "Save 33.3% (Get 4 months free!)",
    mostPopular: true,
  },
};

const DiscountCodeSection: React.FC<{ onSuccess: () => void }> = ({
  onSuccess,
}) => {
  const [discountCode, setDiscountCode] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const { toast } = useToast();

  const handleCodeValidation = async () => {
    if (!discountCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter a discount code",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingCode(true);
    try {
      const response = await apiRequest("POST", "/api/validate-code", {
        code: discountCode,
      });
      const data = await response.json();

      if (data.valid) {
        toast({
          title: "Code Validated!",
          description: data.message,
        });

        // Store the validated code for use in payment
        localStorage.setItem("validated_discount_code", discountCode);

        // Handle success based on code type
        if (data.codeType === "bypass") {
          // For bypass codes, complete onboarding directly
          try {
            await apiRequest("POST", "/api/apply-bypass-code", {
              code: discountCode,
            });
            onSuccess();
          } catch (bypassError) {
            console.error("Failed to apply bypass code:", bypassError);
            toast({
              title: "Error",
              description: "Failed to apply code. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // For discount codes, they can proceed to choose a plan
          toast({
            title: "Discount Applied!",
            description: "Your discount will be applied at checkout.",
          });
        }
      } else {
        toast({
          title: "Invalid Code",
          description: data.message || "The code you entered is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Code validation error:", error);
      toast({
        title: "Validation Error",
        description: "Failed to validate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingCode(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 text-center"
    >
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-sm text-gray-400">
          Have a discount code or special access?
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter code"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
            onKeyPress={(e) => e.key === "Enter" && handleCodeValidation()}
          />
          <Button
            onClick={handleCodeValidation}
            disabled={isValidatingCode}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
          >
            {isValidatingCode ? "Checking..." : "Apply"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const OnboardingPayment: React.FC<OnboardingPaymentProps> = ({
  onSuccess,
  onBack,
}) => {
  const { toast } = useToast();

  const handlePlanSelect = async (plan: "monthly" | "yearly") => {
    try {
      const res = await apiRequest("POST", "/api/create-subscription", {
        priceId: PRICING_PLANS[plan].priceId,
      });
      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl; // Send user into Stripe Checkout
    } catch (err) {
      console.error(err);
      toast({
        title: "Payment Error",
        description: "Could not start subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto px-6"
    >
      <div className="text-center mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to questions
        </Button>
        <h2 className="text-3xl font-bold text-white mb-4">
          Unlock Your Full Martial Arts Potential
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-2">
          Kick. Learn. Advance.
        </p>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Join thousands of martial artists who've accelerated their progress
          with AI-powered coaching. Choose the plan that fits your training
          journey.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Monthly Plan */}
        <Card className="bg-gray-800/50 border-gray-700 relative overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-white">
              Monthly Subscription
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Perfect for trying it out or casual training.
            </CardDescription>
            <div className="space-y-2 mt-4">
              <div className="text-3xl font-bold text-white">
                {PRICING_PLANS.monthly.displayPrice}
              </div>
              <div className="text-sm text-gray-400">
                {PRICING_PLANS.monthly.billing}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Full access to AI coaching</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Real-time pose analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Progress tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Unlimited practice sessions</span>
              </div>
            </div>
            <Button
              onClick={() => handlePlanSelect("monthly")}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Start Monthly Plan
            </Button>
          </CardContent>
        </Card>

        {/* Yearly Plan */}
        <Card className="bg-gray-800/50 border-red-500/50 relative overflow-hidden shadow-lg shadow-red-500/20 ring-1 ring-red-500/30">
          {/* Most Popular Badge */}
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-bl-xl rounded-tr-xl text-sm font-bold flex items-center gap-1 shadow-lg">
            <Crown className="w-4 h-4" />
            Most Popular
          </div>

          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-white">
              Yearly Subscription
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Best for serious martial artists ready to commit and dominate.
            </CardDescription>
            <div className="space-y-2 mt-4">
              <div className="text-3xl font-bold text-white">
                {PRICING_PLANS.yearly.displayPrice}/year
              </div>
              <div className="text-sm text-green-400 font-semibold">
                {PRICING_PLANS.yearly.billing}
              </div>
              <div className="text-sm text-orange-400 font-medium">
                Save 33% — Pay for 8 months, train all year
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Full access to AI coaching</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Real-time pose analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Progress tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>Unlimited practice sessions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Sparkles className="w-4 h-4 text-green-500" />
                <span className="font-medium">Save 33% vs monthly</span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
              <div className="flex items-center justify-center gap-1">
                <span className="text-yellow-400">⭐</span>
                <span>
                  Most CoachT athletes choose this plan to stay consistent and
                  improve fastest.
                </span>
              </div>
            </div>

            <Button
              onClick={() => handlePlanSelect("yearly")}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-red-500/25"
            >
              Commit & Save
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>30-Day Guarantee</span>
          </div>
        </div>

        {/* Risk-free reassurance */}
        <div className="text-center text-sm text-gray-400 mt-4">
          <span className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
            Cancel anytime. Keep your progress data safe.
          </span>
        </div>

        {/* Discount Code Section */}
        <DiscountCodeSection onSuccess={onSuccess} />
      </div>
    </motion.div>
  );
};

export default OnboardingPayment;
