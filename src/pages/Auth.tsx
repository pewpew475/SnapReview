import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Code2, Lock, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { supabaseClient } from "@/lib/supabase-client";

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const validatePassword = (pwd: string): PasswordValidation => {
    return {
      length: pwd.length >= 8 && pwd.length <= 128,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordValidation(validatePassword(value));
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await apiClient.signIn(email, password);
      
      // Store session in Supabase client
      if (result.session) {
        const { error: sessionError } = await supabaseClient.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Failed to set session');
        }
        
        // Verify session is set
        const { data: { session: verifySession } } = await supabaseClient.auth.getSession();
        if (!verifySession) {
          throw new Error('Session verification failed');
        }
      } else {
        throw new Error('No session returned. Please check your credentials.');
      }

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isPasswordValid()) {
      toast.error("Please ensure your password meets all requirements");
      return;
    }

    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("name") as string;

    try {
      const result = await apiClient.signUp(email, password, fullName);
      
      // Store session in Supabase client
      if (result.session) {
        const { error: sessionError } = await supabaseClient.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Failed to set session');
        }
        
        // Verify session is set
        const { data: { session: verifySession } } = await supabaseClient.auth.getSession();
        if (!verifySession) {
          throw new Error('Session verification failed');
        }
        
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        // Email confirmation might be required
        if (result.requiresEmailConfirmation) {
          toast.success("Account created! Please check your email to confirm your account.");
          // Don't navigate if no session
        } else {
          // Try to sign in automatically (for development)
          try {
            const signInResult = await apiClient.signIn(email, password);
            if (signInResult.session) {
              const { error: sessionError } = await supabaseClient.auth.setSession({
                access_token: signInResult.session.access_token,
                refresh_token: signInResult.session.refresh_token,
              });
              
              if (!sessionError) {
                toast.success("Account created successfully!");
                navigate("/dashboard");
                return;
              }
            }
          } catch (signInError) {
            // If auto sign-in fails, show email confirmation message
            toast.success("Account created! Please check your email to confirm your account.");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Code2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">SnapReview AI</h1>
          <p className="text-muted-foreground">Elevate your code quality with AI</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me
                      </label>
                    </div>
                    <Button variant="link" className="px-0" type="button">
                      Forgot password?
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Start evaluating your code with AI today</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only approved email domains are allowed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        required
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                      />
                    </div>
                    
                    {/* Password Requirements */}
                    {password && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className={`flex items-center gap-2 ${passwordValidation.length ? 'text-accent' : 'text-muted-foreground'}`}>
                          {passwordValidation.length ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>8-128 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.uppercase ? 'text-accent' : 'text-muted-foreground'}`}>
                          {passwordValidation.uppercase ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.lowercase ? 'text-accent' : 'text-muted-foreground'}`}>
                          {passwordValidation.lowercase ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.number ? 'text-accent' : 'text-muted-foreground'}`}>
                          {passwordValidation.number ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.special ? 'text-accent' : 'text-muted-foreground'}`}>
                          {passwordValidation.special ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>One special character</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" required />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the Terms & Conditions
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || (password && !isPasswordValid())}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
