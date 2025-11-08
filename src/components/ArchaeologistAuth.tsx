import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArchaeologistService } from '@/services/archaeologists';
import { VerificationService } from '@/services/verification';
import { Loader2, Mail, Lock, GraduationCap, Shield, CheckCircle, User } from 'lucide-react';

interface ArchaeologistAuthProps {
  onAuthSuccess?: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const ArchaeologistAuth: React.FC<ArchaeologistAuthProps> = ({
  onAuthSuccess,
  defaultMode = 'signin'
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(defaultMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();

  // Signup-specific fields
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    verificationCode: '',
    institution: '',
    specialization: '',
    credentials: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        title: "Error",
        description: "Firebase authentication is not initialized",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if user is registered as archaeologist
      const isArchaeologist = await ArchaeologistService.isArchaeologist(userCredential.user.uid);

      if (!isArchaeologist) {
        // Sign out if not an archaeologist
        await auth.signOut();
        toast({
          title: "Access Denied",
          description: "This account is not registered as an archaeologist. Please contact an administrator.",
          variant: "destructive"
        });
        return;
      }

      // Get user's display name for personalized welcome
      const profile = await ArchaeologistService.getArchaeologistProfile(userCredential.user.uid);
      const userName = profile?.displayName || userCredential.user.displayName || userCredential.user.email?.split('@')[0] || "";

      console.log("Archaeologist signed in:", userCredential.user);
      toast({
        title: userName ? `Welcome back, ${userName}!` : "Welcome back!",
        description: "Successfully signed in as an archaeologist",
      });
      onAuthSuccess?.();
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        title: "Error",
        description: "Firebase authentication is not initialized",
        variant: "destructive"
      });
      return;
    }

    // Verify archaeologist code
    if (!VerificationService.isValidVerificationCode(signupData.verificationCode)) {
      toast({
        title: "Invalid Verification Code",
        description: "Please provide a valid archaeologist verification code",
        variant: "destructive"
      });
      return;
    }

    // Basic validation
    if (!signupData.firstName || !signupData.lastName || !signupData.institution || !signupData.specialization) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Combine first and last name
      const displayName = `${signupData.firstName} ${signupData.lastName}`.trim();

      // Register as archaeologist
      await ArchaeologistService.registerAsArchaeologist(
        userCredential.user.uid,
        userCredential.user.email || '',
        displayName,
        signupData.institution,
        signupData.specialization,
        signupData.credentials
      );

      console.log("Archaeologist account created:", userCredential.user);
      toast({
        title: `Welcome to ArchePal, ${displayName}!`,
        description: "Your archaeologist account has been created successfully",
      });
      onAuthSuccess?.();
    } catch (error: any) {
      console.error("Error creating account:", error.message);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        variant: "destructive"
      });
      return;
    }

    if (!auth) {
      toast({
        title: "Error",
        description: "Firebase authentication is not initialized",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send reset email",
        variant: "destructive"
      });
    }
  };

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <GraduationCap className="w-5 h-5" />
          {isSigningUp ? 'Register as Archaeologist' : 'Archaeologist Sign In'}
        </CardTitle>
        <CardDescription>
          {isSigningUp
            ? 'Create your verified archaeologist account'
            : 'Access your archaeologist dashboard'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={isSigningUp ? handleSignUp : handleSignIn} className="space-y-4">

          {isSigningUp && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Verification Required</span>
              </div>
              <p className="text-xs text-blue-700">
                Only verified archaeologists can create accounts. Please enter your verification code to continue.
              </p>
            </div>
          )}

          {isSigningUp && (
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Archaeologist Verification Code *</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  value={signupData.verificationCode}
                  onChange={handleSignupInputChange}
                  placeholder="Enter verification code"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {isSigningUp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    value={signupData.firstName}
                    onChange={handleSignupInputChange}
                    placeholder="First name"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    name="lastName"
                    value={signupData.lastName}
                    onChange={handleSignupInputChange}
                    placeholder="Last name"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSigningUp ? "Password (min. 6 characters)" : "Enter your password"}
                className="pl-10"
                minLength={isSigningUp ? 6 : undefined}
                required
                disabled={loading}
              />
            </div>
          </div>

          {isSigningUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution/Organization *</Label>
                <Input
                  id="institution"
                  name="institution"
                  value={signupData.institution}
                  onChange={handleSignupInputChange}
                  placeholder="e.g., University of Archaeology"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  value={signupData.specialization}
                  onChange={handleSignupInputChange}
                  placeholder="e.g., Ancient Roman History"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentials">Credentials/Qualifications</Label>
                <Textarea
                  id="credentials"
                  name="credentials"
                  value={signupData.credentials}
                  onChange={handleSignupInputChange}
                  placeholder="e.g., PhD in Archaeology, Published researcher..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSigningUp ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              <>
                {isSigningUp ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Archaeologist Account
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Sign In as Archaeologist
                  </>
                )}
              </>
            )}
          </Button>
        </form>

        {!isSigningUp && (
          <div className="text-center">
            <Button
              variant="link"
              onClick={handlePasswordReset}
              className="text-sm"
              disabled={loading || resetEmailSent}
            >
              {resetEmailSent ? 'Reset email sent!' : 'Forgot password?'}
            </Button>
          </div>
        )}

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => setIsSigningUp(!isSigningUp)}
            className="text-sm"
            disabled={loading}
          >
            {isSigningUp
              ? "Already have an archaeologist account? Sign In"
              : "Need an archaeologist account? Register"
            }
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          <p>🏛️ Professional archaeologist accounts only</p>
          <p>Public users can browse without signing up</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArchaeologistAuth;