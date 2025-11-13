import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, CreditCard, DollarSign, Building2, Mail } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Donations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donationType, setDonationType] = useState("one-time");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);

  const predefinedAmounts = ["10", "25", "50", "100", "250"];

  // Auto-fill with demo data for testing purposes
  const fillDemoData = () => {
    setDonationType("one-time");
    setAmount("50");
    setCustomAmount("");
    setDonorName("John Smith");
    setDonorEmail("john.smith@example.com");
    setMessage("Happy to support archaeological preservation!");
    setCardNumber("4532 1234 5678 9010");
    setExpiryDate("12/25");
    setCvv("123");
    setBillingAddress("123 Main Street");
    setCity("New York");
    setZipCode("10001");

    toast({
      title: "Demo Data Loaded",
      description: "Form filled with sample data for testing",
    });
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ').substring(0, 19);
    } else {
      return v;
    }
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = amount === "custom" ? customAmount : amount;

    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    if (!donorName || !donorEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate credit card information
    if (!cardNumber || !expiryDate || !cvv || !billingAddress || !city || !zipCode) {
      toast({
        title: "Missing Payment Information",
        description: "Please fill in all credit card and billing details.",
        variant: "destructive",
      });
      return;
    }

    // Basic card number validation (should be 16 digits)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      toast({
        title: "Invalid Card Number",
        description: "Please enter a valid credit card number.",
        variant: "destructive",
      });
      return;
    }

    // Basic CVV validation
    if (cvv.length < 3 || cvv.length > 4) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid CVV code (3-4 digits).",
        variant: "destructive",
      });
      return;
    }

    // Show thank you message
    setShowThankYou(true);

    // Also show toast notification
    toast({
      title: "Thank You for Your Donation!",
      description: `Your ${donationType} donation of $${finalAmount} has been processed successfully.`,
    });

    // Reset form after a delay
    setTimeout(() => {
      setAmount("");
      setCustomAmount("");
      setDonorName("");
      setDonorEmail("");
      setMessage("");
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setBillingAddress("");
      setCity("");
      setZipCode("");
      setShowThankYou(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <PageHeader />
        </header>

        {/* Thank You Message */}
        {showThankYou && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm mx-auto">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-green-600">Thank You!</h2>
                  <p className="text-muted-foreground">
                    Your generous donation of ${amount === "custom" ? customAmount : amount} has been received.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your contribution makes a real difference in preserving archaeological treasures for future generations.
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    You will receive a confirmation email shortly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header Section */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Support Our Mission</h1>
            <p className="text-muted-foreground">
              Help us preserve and discover archaeological treasures. Your donation makes a difference.
            </p>
          </div>
        </div>

        {/* Donation Form */}
        <div className="px-6 pb-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Make a Donation</CardTitle>
              <CardDescription>
                Every contribution helps us continue our archaeological research and preservation efforts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Donation Type */}
                <div className="space-y-3">
                  <Label>Donation Type</Label>
                  <RadioGroup value={donationType} onValueChange={setDonationType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <Label htmlFor="one-time" className="cursor-pointer font-normal">
                        One-time donation
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="cursor-pointer font-normal">
                        Monthly donation
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Amount Selection */}
                <div className="space-y-3">
                  <Label>Select Amount (USD)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {predefinedAmounts.map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant={amount === amt ? "default" : "outline"}
                        onClick={() => {
                          setAmount(amt);
                          setCustomAmount("");
                        }}
                        className="w-full"
                      >
                        ${amt}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant={amount === "custom" ? "default" : "outline"}
                      onClick={() => setAmount("custom")}
                      className="w-full col-span-3"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Custom Amount
                    </Button>
                  </div>

                  {amount === "custom" && (
                    <div className="space-y-2 mt-2">
                      <Input
                        type="number"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min="1"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>

                {/* Donor Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="donor-name">Full Name *</Label>
                    <Input
                      id="donor-name"
                      placeholder="John Doe (Click to fill demo data)"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      onClick={fillDemoData}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donor-email">Email Address *</Label>
                    <Input
                      id="donor-email"
                      type="email"
                      placeholder="john@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Leave a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number *</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry-date">Expiry Date *</Label>
                      <Input
                        id="expiry-date"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing-address">Billing Address *</Label>
                    <Input
                      id="billing-address"
                      placeholder="123 Main Street"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip-code">ZIP Code *</Label>
                      <Input
                        id="zip-code"
                        placeholder="10001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').substring(0, 10))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" size="lg">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Donate {amount && (amount === "custom" ? (customAmount ? `$${customAmount}` : "") : `$${amount}`)}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Other Ways to Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Bank Transfer</h4>
                  <p className="text-sm text-muted-foreground">
                    Contact us for direct bank transfer details for larger donations.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Contact Us</h4>
                  <p className="text-sm text-muted-foreground">
                    Email us at donations@archepal.org for any questions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Donations;
