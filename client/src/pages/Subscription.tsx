import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';
import { Loader2, ExternalLink } from 'lucide-react';

export default function SubscriptionPage() {
  const { createBillingPortalSession } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create billing portal session:', error);
      setErrorMessage('Could not open the subscription portal. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-16 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Manage Your Subscription</h1>
        <p className="text-gray-600 mb-8">
          You are currently on the Premium plan. Click the button below to open the secure billing portal where you can manage your payment methods, view invoices, or cancel your subscription.
        </p>

        <Button
          onClick={handleManageSubscription}
          disabled={isLoading}
          size="lg"
          className="w-full max-w-xs mx-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Opening Portal...
            </>
          ) : (
            <>
              Open Billing Portal
              <ExternalLink className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
        
        {errorMessage && (
          <p className="text-red-600 mt-4 text-sm">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
