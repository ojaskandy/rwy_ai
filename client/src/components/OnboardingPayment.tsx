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
import { CreditCard, Shield, Sparkles, CheckCircle } from "lucide-react";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface OnboardingPaymentProps {
  onSuccess: () => void;
  onBack: () => void;
}

const PaymentForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);

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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

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
          description: "Welcome to CoachT! Let's start your martial arts journey.",
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
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold text-green-400">Access Granted!</h3>
        <p className="text-gray-300">Your discount code has been validated. Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discount Code Section */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Have a Discount Code?
          </CardTitle>
          <CardDescription>
            Enter your code to get instant access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="discount-code">Discount Code</Label>
              <Input
                id="discount-code"
                type="text"
                placeholder="Enter your code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="bg-gray-700 border-gray-600"
                disabled={isValidatingCode}
              />
            </div>
            <Button
              onClick={handleCodeValidation}
              disabled={isValidatingCode || !discountCode.trim()}
              className="mt-6"
            >
              {isValidatingCode ? "Validating..." : "Apply"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-gray-400">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Payment Section */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            One-time payment for lifetime access to CoachT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-4">
            <PaymentElement />
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secured by Stripe - Your payment information is protected</span>
            </div>

            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {isProcessing ? "Processing..." : "Complete Payment ($29.99)"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const OnboardingPayment: React.FC<OnboardingPaymentProps> = ({ onSuccess, onBack }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { amount: 2999 });
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("No client secret received");
        }
      } catch (error) {
        toast({
          title: "Payment Setup Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
        <p className="text-gray-400">Setting up secure payment...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-400">Failed to initialize payment system</p>
        <Button onClick={onBack} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          Complete Your Journey
        </h2>
        <p className="text-gray-300">
          Join thousands of martial artists training with AI-powered coaching
        </p>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-gray-800/30 rounded-lg">
          <div className="text-2xl mb-2">🥋</div>
          <h3 className="font-semibold text-white">Expert Coaching</h3>
          <p className="text-sm text-gray-400">AI-powered form analysis</p>
        </div>
        <div className="text-center p-4 bg-gray-800/30 rounded-lg">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-white">Progress Tracking</h3>
          <p className="text-sm text-gray-400">Monitor your improvement</p>
        </div>
        <div className="text-center p-4 bg-gray-800/30 rounded-lg">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold text-white">Personalized Goals</h3>
          <p className="text-sm text-gray-400">Tailored to your level</p>
        </div>
      </div>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm onSuccess={onSuccess} />
      </Elements>

      <div className="text-center">
        <Button onClick={onBack} variant="ghost" className="text-gray-400">
          ← Back to Questions
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPayment;