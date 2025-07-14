import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Shield, Sparkles, CheckCircle, Crown, ArrowLeft, Check } from "lucide-react";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface OnboardingPaymentProps {
  onSuccess: () => void;
  onBack: () => void;
}

// Pricing plans
const PRICING_PLANS = {
  monthly: {
    price: 12,
    priceId: 'price_monthly', // This would be set from Stripe dashboard
    displayPrice: '$12',
    billing: 'Billed monthly',
    description: 'Monthly Subscription'
  },
  yearly: {
    price: 96,
    priceId: 'price_yearly', // This would be set from Stripe dashboard
    displayPrice: '$96',
    billing: 'Only $8/month',
    description: 'Yearly Subscription',
    savings: 'Save 33.3% (Get 4 months free!)',
    mostPopular: true
  }
};

const PaymentForm: React.FC<{ onSuccess: () => void; selectedPlan: 'monthly' | 'yearly' }> = ({ onSuccess, selectedPlan }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [showDiscountCode, setShowDiscountCode] = useState(false);

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
      const response = await apiRequest("POST", "/api/validate-code", { code: discountCode });
      const data = await response.json();
      
      if (data.valid) {
        setCodeValidated(true);
        toast({
          title: "Code Validated!",
          description: data.message,
        });
        
        // Wait a moment then proceed to success
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        toast({
          title: "Invalid Code",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/app`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to CoachT! Your martial arts journey begins now.",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (codeValidated) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">Access Granted!</h3>
        <p className="text-gray-300">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-xl transition-all"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            `Complete Payment - ${PRICING_PLANS[selectedPlan].displayPrice}`
          )}
        </Button>
      </form>

      {/* Discount Code Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-sm text-gray-400">Or</span>
          <Separator className="flex-1" />
        </div>
        
        {!showDiscountCode ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowDiscountCode(true)}
            className="w-full text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
          >
            I have a discount code
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="discount-code" className="text-sm font-medium text-gray-300">
                Discount Code
              </Label>
              <Input
                id="discount-code"
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter your discount code"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Button
              type="button"
              onClick={handleCodeValidation}
              disabled={isValidatingCode || !discountCode.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {isValidatingCode ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validating...
                </div>
              ) : (
                "Validate Code"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Shield className="w-4 h-4" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </div>
  );
};

// Discount Code Section Component
const DiscountCodeSection: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [showDiscountCode, setShowDiscountCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
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
      const response = await apiRequest("POST", "/api/validate-code", { code: discountCode });
      const data = await response.json();
      
      if (data.valid) {
        setCodeValidated(true);
        toast({
          title: "Code Validated!",
          description: data.message,
        });
        
        // Wait a moment then proceed to success
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        toast({
          title: "Invalid Code",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingCode(false);
    }
  };

  if (codeValidated) {
    return (
      <div className="text-center mt-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">Access Granted!</h3>
        <p className="text-gray-300">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Separator className="flex-1" />
        <span className="text-sm text-gray-500">Have a discount code?</span>
        <Separator className="flex-1" />
      </div>
      
      {!showDiscountCode ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowDiscountCode(true)}
          className="w-full text-gray-400 hover:text-white border-gray-600 hover:border-gray-500 bg-transparent"
        >
          Enter Discount Code
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="discount-code-bottom" className="text-sm font-medium text-gray-300">
              Discount Code
            </Label>
            <Input
              id="discount-code-bottom"
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter your code"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
            />
          </div>
          <Button
            type="button"
            onClick={handleCodeValidation}
            disabled={isValidatingCode || !discountCode.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {isValidatingCode ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validating...
              </div>
            ) : (
              "Apply Code"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const OnboardingPayment: React.FC<OnboardingPaymentProps> = ({ onSuccess, onBack }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [clientSecret, setClientSecret] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePlanSelect = async (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    
    try {
      const response = await apiRequest("POST", "/api/create-subscription", { planType: plan });
      const data = await response.json();
      
      setClientSecret(data.clientSecret);
      setShowPaymentForm(true);
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  if (showPaymentForm && clientSecret) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto px-6"
      >
        <div className="text-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowPaymentForm(false)}
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to plans
          </Button>
          <h2 className="text-2xl font-bold text-white mb-2">Complete Your Payment</h2>
          <p className="text-gray-300">
            {PRICING_PLANS[selectedPlan].description} - {PRICING_PLANS[selectedPlan].displayPrice}
          </p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm onSuccess={onSuccess} selectedPlan={selectedPlan} />
        </Elements>
      </motion.div>
    );
  }

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
        <h2 className="text-3xl font-bold text-white mb-4">Unlock Your Full Martial Arts Potential</h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-2">
          Kick. Learn. Advance.
        </p>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Join thousands of martial artists who've accelerated their progress with AI-powered coaching. Choose the plan that fits your training journey.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Monthly Plan */}
        <Card className="bg-gray-800/50 border-gray-700 relative overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-white">Monthly Subscription</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Perfect for trying it out or casual training.
            </CardDescription>
            <div className="space-y-2 mt-4">
              <div className="text-3xl font-bold text-white">{PRICING_PLANS.monthly.displayPrice}</div>
              <div className="text-sm text-gray-400">{PRICING_PLANS.monthly.billing}</div>
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
              onClick={() => handlePlanSelect('monthly')}
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
            <CardTitle className="text-xl font-bold text-white">Yearly Subscription</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Best for serious martial artists ready to commit and dominate.
            </CardDescription>
            <div className="space-y-2 mt-4">
              <div className="text-3xl font-bold text-white">{PRICING_PLANS.yearly.displayPrice}/year</div>
              <div className="text-sm text-green-400 font-semibold">{PRICING_PLANS.yearly.billing}</div>
              <div className="text-sm text-orange-400 font-medium">Save 33% — Pay for 8 months, train all year</div>
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
                <span>Most CoachT athletes choose this plan to stay consistent and improve fastest.</span>
              </div>
            </div>
            
            <Button
              onClick={() => handlePlanSelect('yearly')}
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