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
    priceId: 'price_1RkdiWHq7hIb1YPg2YZDnjlc', // Monthly price ID from Stripe
    displayPrice: '$12',
    billing: 'Billed monthly',
    description: 'Monthly Subscription'
  },
  yearly: {
    price: 96,
    priceId: 'price_1RkdiWHq7hIb1YPgdHcYotQZ', // Yearly price ID from Stripe
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
        // Force immediate redirect to /app after successful payment
        window.location.href = '/app';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: 'CoachT User',
              },
            },
          }}
        />
      </div>
      
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          `Start ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan`
        )}
      </Button>

      <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
        <Shield className="w-4 h-4" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
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
      
      if (data.success) {
        setCodeValidated(true);
        toast({
          title: "Code Validated!",
          description: data.message,
        });
        
        // Wait a moment then proceed to success
        setTimeout(() => {
          onSuccess();
          // Force immediate redirect to /app
          window.location.href = '/app';
        }, 1500);
      } else {
        toast({
          title: "Invalid Code",
          description: data.error || "Invalid discount code",
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
        <p className="text-gray-300">Taking you to your training...</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-center mb-4">
        <div className="flex-1 h-px bg-gray-700"></div>
        <span className="mx-4 text-sm text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>
      
      {!showDiscountCode ? (
        <button
          type="button"
          onClick={() => setShowDiscountCode(true)}
          className="w-full text-center text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors duration-200"
        >
          Have a discount code?
        </button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discount-code" className="text-sm font-medium text-gray-300">
              Discount Code
            </Label>
            <Input
              id="discount-code"
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="Enter your code"
              className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
            />
          </div>
          
          <Button
            type="button"
            onClick={handleCodeValidation}
            disabled={isValidatingCode || !discountCode.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            {isValidatingCode ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Validating...</span>
              </div>
            ) : (
              'Apply Code'
            )}
          </Button>
          
          <button
            type="button"
            onClick={() => setShowDiscountCode(false)}
            className="w-full text-center text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

const OnboardingPayment: React.FC<OnboardingPaymentProps> = ({ onSuccess, onBack }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Create subscription when plan is selected
  useEffect(() => {
    const createSubscription = async () => {
      if (!selectedPlan) return;

      setIsLoading(true);
      try {
        const response = await apiRequest("POST", "/api/create-subscription", {
          priceId: PRICING_PLANS[selectedPlan].priceId
        });
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret received');
        }
      } catch (error) {
        toast({
          title: "Setup Error",
          description: "Failed to set up payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createSubscription();
  }, [selectedPlan, toast]);

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#f97316',
        colorBackground: '#1f2937',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="absolute top-4 left-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to questions
          </Button>
          
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-orange-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">
              Unlock Your Full Martial Arts Potential
            </h1>
          </div>
          
          <p className="text-xl text-orange-500 font-semibold mb-2">
            Kick. Learn. Advance.
          </p>
          
          <p className="text-gray-300 max-w-2xl mx-auto">
            Join thousands of martial artists who've accelerated their progress with AI-powered coaching. 
            Choose the plan that fits your training journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className={`bg-gray-900/80 border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedPlan === 'monthly' ? 'border-orange-500 shadow-orange-500/20' : 'border-gray-700 hover:border-gray-600'
            }`} onClick={() => setSelectedPlan('monthly')}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Monthly Subscription</CardTitle>
                <CardDescription className="text-gray-400">Perfect for trying it out or casual training</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">$12</span>
                  <span className="text-gray-400 ml-2">Billed monthly</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Full access to AI coaching</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Real-time pose analysis</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Progress tracking</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Unlimited practice sessions</span>
                  </div>
                </div>
                <Button
                  variant={selectedPlan === 'monthly' ? 'default' : 'outline'}
                  className={`w-full ${selectedPlan === 'monthly' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  {selectedPlan === 'monthly' ? 'Selected' : 'Start Monthly Plan'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className={`bg-gray-900/80 border-2 cursor-pointer transition-all duration-200 hover:shadow-xl relative ${
              selectedPlan === 'yearly' ? 'border-orange-500 shadow-orange-500/20' : 'border-gray-700 hover:border-gray-600'
            }`} onClick={() => setSelectedPlan('yearly')}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </div>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Yearly Subscription</CardTitle>
                <CardDescription className="text-gray-400">Best for serious martial artists ready to commit and dominate</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">$96</span>
                  <span className="text-gray-400 ml-2">/year</span>
                  <div className="text-orange-500 font-semibold mt-1">Only $8/month</div>
                </div>
                <div className="bg-green-600/20 text-green-400 text-sm font-medium px-3 py-1 rounded-full mt-2">
                  Save 33% · Pay for 8 months, train all year
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Full access to AI coaching</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Real-time pose analysis</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Progress tracking</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    <span>Unlimited practice sessions</span>
                  </div>
                  <div className="flex items-center text-orange-400 font-semibold">
                    <Sparkles className="w-4 h-4 text-orange-500 mr-3" />
                    <span>Save 33% vs monthly</span>
                  </div>
                </div>
                <Button
                  variant={selectedPlan === 'yearly' ? 'default' : 'outline'}
                  className={`w-full ${selectedPlan === 'yearly' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  {selectedPlan === 'yearly' ? 'Selected' : 'Commit & Save'}
                </Button>
                <div className="text-center text-sm text-gray-400 mt-2">
                  <span className="flex items-center justify-center">
                    <Crown className="w-3 h-3 mr-1" />
                    Most CoachT athletes choose this plan to stay consistent and improve fastest.
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 border border-gray-700"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-300">Setting up your subscription...</span>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={stripeOptions}>
              <PaymentForm onSuccess={onSuccess} selectedPlan={selectedPlan} />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <div className="text-red-400">Failed to initialize payment. Please try again.</div>
            </div>
          )}

          <DiscountCodeSection onSuccess={onSuccess} />

          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>30-Day Guarantee</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPayment;