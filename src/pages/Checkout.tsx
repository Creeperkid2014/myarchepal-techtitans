import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, CreditCard, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArtifactsService, Artifact } from "@/services/artifacts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// NOTE: This checkout page allows ANYONE to purchase artifacts without authentication
const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(false);

  const [purchaseData, setPurchaseData] = useState({
    quantity: 1,
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: ""
  });

  useEffect(() => {
    const loadArtifact = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "Artifact ID not found",
          variant: "destructive"
        });
        navigate("/artifacts");
        return;
      }

      try {
        setLoading(true);
        const artifactData = await ArtifactsService.getArtifactById(id);

        if (!artifactData) {
          toast({
            title: "Error",
            description: "Artifact not found",
            variant: "destructive"
          });
          navigate("/artifacts");
          return;
        }

        if (!artifactData.forSale || !artifactData.quantity || artifactData.quantity === 0) {
          toast({
            title: "Not Available",
            description: "This artifact is not available for purchase",
            variant: "destructive"
          });
          navigate("/artifacts");
          return;
        }

        setArtifact(artifactData);
      } catch (error) {
        console.error("Error loading artifact:", error);
        toast({
          title: "Error",
          description: "Failed to load artifact",
          variant: "destructive"
        });
        navigate("/artifacts");
      } finally {
        setLoading(false);
      }
    };

    loadArtifact();
  }, [id, navigate, toast]);

  // Sync billing address with shipping address when checkbox is checked
  useEffect(() => {
    if (sameAsShipping) {
      setPurchaseData(prev => ({
        ...prev,
        billingAddress: prev.address,
        billingCity: prev.city,
        billingState: prev.state,
        billingZipCode: prev.zipCode,
        billingCountry: prev.country
      }));
    }
  }, [sameAsShipping, purchaseData.address, purchaseData.city, purchaseData.state, purchaseData.zipCode, purchaseData.country]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPurchaseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuantityChange = (value: string) => {
    setPurchaseData(prev => ({
      ...prev,
      quantity: parseInt(value)
    }));
  };

  const validateForm = () => {
    if (!purchaseData.cardNumber || !purchaseData.cardName || !purchaseData.expiryDate || !purchaseData.cvv) {
      toast({
        title: "Validation Error",
        description: "Please fill in all credit card information",
        variant: "destructive"
      });
      return false;
    }

    if (!purchaseData.address || !purchaseData.city || !purchaseData.state || !purchaseData.zipCode || !purchaseData.country) {
      toast({
        title: "Validation Error",
        description: "Please fill in all shipping address information",
        variant: "destructive"
      });
      return false;
    }

    if (!sameAsShipping) {
      if (!purchaseData.billingAddress || !purchaseData.billingCity || !purchaseData.billingState || !purchaseData.billingZipCode || !purchaseData.billingCountry) {
        toast({
          title: "Validation Error",
          description: "Please fill in all billing address information",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !artifact || !id) {
      return;
    }

    setProcessing(true);

    try {
      // Calculate new quantity
      const newQuantity = (artifact.quantity || 0) - purchaseData.quantity;

      // Update artifact quantity in database
      await ArtifactsService.updateArtifact(id, {
        quantity: newQuantity
      });

      // Show success
      setPurchaseComplete(true);

      // Navigate back after a delay
      setTimeout(() => {
        navigate("/artifacts");
      }, 5000);

    } catch (error) {
      console.error("Error processing purchase:", error);
      toast({
        title: "Error",
        description: "Failed to process purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You for Your Purchase!</h2>
            <p className="text-muted-foreground mb-4">
              Your order has been received successfully.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              We will contact you soon when the order is ready for delivery.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <p className="text-sm font-medium mb-2">Order Summary:</p>
              <p className="text-xs text-muted-foreground">{artifact?.name}</p>
              <p className="text-xs text-muted-foreground">Quantity: {purchaseData.quantity}</p>
              <p className="text-sm font-bold text-primary mt-2">
                Total: {artifact?.currency || 'USD'} {((artifact?.salePrice || 0) * purchaseData.quantity).toLocaleString()}
              </p>
            </div>
            <Button onClick={() => navigate("/artifacts")} className="w-full">
              Back to Artifacts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!artifact) {
    return null;
  }

  const totalPrice = (artifact.salePrice || 0) * purchaseData.quantity;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <PageHeader />
        </header>

        <div className="p-4 space-y-4">
          {/* Artifact Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {artifact.images && artifact.images.length > 0 ? (
                    <img
                      src={artifact.images[0]}
                      alt={artifact.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">
                      {artifact.type === 'Coin' ? '🪙' :
                       artifact.type === 'Ceramic' ? '🏺' :
                       artifact.type === 'Weapon' ? '🗡️' :
                       artifact.type === 'Glass' ? '🍶' :
                       artifact.type === 'Personal Ornament' ? '📎' :
                       artifact.type === 'Sculpture' ? '🗿' :
                       '🏺'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{artifact.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{artifact.material}</p>
                  <p className="text-lg font-bold text-blue-600">
                    {artifact.currency || 'USD'} {artifact.salePrice?.toLocaleString()}
                    <span className="text-xs text-muted-foreground ml-1">per item</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Select
                    value={purchaseData.quantity.toString()}
                    onValueChange={handleQuantityChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.min(artifact.quantity || 0, 10) }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {artifact.quantity}
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      {artifact.currency || 'USD'} {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <form onSubmit={handlePurchase} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={purchaseData.cardNumber}
                    onChange={handleInputChange}
                    maxLength={19}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    name="cardName"
                    placeholder="John Doe"
                    value={purchaseData.cardName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={purchaseData.expiryDate}
                      onChange={handleInputChange}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={purchaseData.cvv}
                      onChange={handleInputChange}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="123 Main Street"
                    value={purchaseData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="New York"
                      value={purchaseData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="NY"
                      value={purchaseData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      placeholder="10001"
                      value={purchaseData.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="USA"
                      value={purchaseData.country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) => setSameAsShipping(checked === true)}
                  />
                  <label
                    htmlFor="sameAsShipping"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Billing address is the same as shipping address
                  </label>
                </div>

                {!sameAsShipping && (
                  <>
                    <div>
                      <Label htmlFor="billingAddress">Street Address</Label>
                      <Input
                        id="billingAddress"
                        name="billingAddress"
                        placeholder="123 Main Street"
                        value={purchaseData.billingAddress}
                        onChange={handleInputChange}
                        required={!sameAsShipping}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          name="billingCity"
                          placeholder="New York"
                          value={purchaseData.billingCity}
                          onChange={handleInputChange}
                          required={!sameAsShipping}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingState">State</Label>
                        <Input
                          id="billingState"
                          name="billingState"
                          placeholder="NY"
                          value={purchaseData.billingState}
                          onChange={handleInputChange}
                          required={!sameAsShipping}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingZipCode">ZIP Code</Label>
                        <Input
                          id="billingZipCode"
                          name="billingZipCode"
                          placeholder="10001"
                          value={purchaseData.billingZipCode}
                          onChange={handleInputChange}
                          required={!sameAsShipping}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingCountry">Country</Label>
                        <Input
                          id="billingCountry"
                          name="billingCountry"
                          placeholder="USA"
                          value={purchaseData.billingCountry}
                          onChange={handleInputChange}
                          required={!sameAsShipping}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Artifact
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
