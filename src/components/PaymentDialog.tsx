import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Lock, CreditCard } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationId: string;
  amount?: number;
  onSuccess?: () => void;
}

const PaymentDialog = ({ open, onOpenChange, evaluationId, amount = 99, onSuccess }: PaymentDialogProps) => {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
      toast.error('Please fill in all payment details');
      return;
    }

    // Basic validation
    const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      toast.error('Please enter a valid card number');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      toast.error('Please enter expiry date in MM/YY format');
      return;
    }

    if (!/^\d{3,4}$/.test(paymentData.cvv)) {
      toast.error('Please enter a valid CVV');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // Step 1: Create payment order
      const orderResult = await apiClient.createPaymentOrder(evaluationId, amount);
      
      if (!orderResult.success || !orderResult.order_id) {
        throw new Error('Failed to create payment order');
      }

      // Step 2: Simulate payment processing (demo mode)
      // In a real app, this would redirect to payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      // Step 3: Verify payment (demo - auto-verify)
      const verifyResult = await apiClient.verifyPayment(
        orderResult.order_id,
        `demo_payment_${Date.now()}`,
        'demo_signature'
      );

      if (verifyResult.success && verifyResult.evaluation_unlocked) {
        setStep('success');
        toast.success('Payment successful! Report unlocked.');
        
        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
          if (onSuccess) {
            onSuccess();
          }
          // Reset form
          setStep('form');
          setPaymentData({
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: '',
          });
        }, 2000);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setStep('form');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Unlock Full Report
          </DialogTitle>
          <DialogDescription>
            Complete payment to unlock the full evaluation report with detailed analysis
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-6">
            {/* Price Display */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-center">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-primary">₹{amount}</div>
                  <p className="text-sm text-muted-foreground">One-time payment</p>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Full detailed analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Refactored code examples</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Security recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Performance optimizations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <CreditCard className="w-4 h-4" />
                <span>Demo Payment - No actual charge will be made</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholder">Cardholder Name</Label>
                <Input
                  id="cardholder"
                  placeholder="John Doe"
                  value={paymentData.cardholderName}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, cardholderName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  value={paymentData.cardNumber}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      cardNumber: formatCardNumber(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={paymentData.expiryDate}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        expiryDate: formatExpiryDate(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    value={paymentData.cvv}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        cvv: e.target.value.replace(/\D/g, ''),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                Pay ₹{amount}
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Processing payment...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we process your payment
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-lg">Payment Successful!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your report has been unlocked. Redirecting...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;

