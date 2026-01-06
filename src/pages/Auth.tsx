import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dna, Mail, Lock, User, ArrowLeft, Shield, Loader2, KeyRound, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Separator } from '@/components/ui/separator';

type AuthMode = 'login' | 'signup' | 'admin' | 'forgot' | 'reset';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, signIn, signUp, checkIsAdmin, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const type = searchParams.get('type');
    
    if (type === 'recovery') {
      setMode('reset');
    } else if (modeParam === 'signup') {
      setMode('signup');
    } else if (modeParam === 'admin') {
      setMode('admin');
    } else if (modeParam === 'forgot') {
      setMode('forgot');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading && mode !== 'reset') {
      navigate('/dashboard');
    }
  }, [user, isAdmin, authLoading, navigate, mode]);

  const validateForm = (): boolean => {
    try {
      if (mode === 'forgot') {
        emailSchema.parse(formData.email);
        return true;
      }
      
      if (mode === 'reset') {
        passwordSchema.parse(formData.password);
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return false;
        }
        return true;
      }
      
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);
      
      if (mode === 'signup') {
        nameSchema.parse(formData.name);
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return false;
        }
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('Password reset link sent! Check your email.');
      setMode('login');
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('Password updated successfully! You can now sign in.');
      setMode('login');
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (mode === 'forgot') {
      await handleForgotPassword();
      return;
    }

    if (mode === 'reset') {
      await handleResetPassword();
      return;
    }
    
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Account created successfully! Redirecting...');
      } else {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (mode === 'admin') {
          const hasAdminRole = await checkIsAdmin();
          if (!hasAdminRole) {
            toast.error('You do not have admin privileges.');
            return;
          }
        }
        
        toast.success('Login successful! Redirecting...');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-dna-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-dna-accent/10 rounded-full blur-3xl animate-float" />
      
      {/* DNA strands */}
      <div className="absolute left-0 top-0 bottom-0 w-8 opacity-20">
        <div className="h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_30px,hsl(var(--primary))_30px,hsl(var(--primary))_32px,transparent_32px,transparent_60px)]" />
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-8 opacity-20">
        <div className="h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_30px,hsl(var(--accent))_30px,hsl(var(--accent))_32px,transparent_32px,transparent_60px)]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to home */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Auth Card */}
        <div className="glass-card p-8 rounded-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="relative">
              <Dna className="h-10 w-10 text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-2xl gradient-text">BioDaCa</span>
              <span className="text-xs text-muted-foreground -mt-1">Creating your task simple</span>
            </div>
          </div>

          {/* Mode Tabs - Hide for forgot/reset modes */}
          {mode !== 'forgot' && mode !== 'reset' && (
            <div className="flex gap-2 mb-8 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'login' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                User Login
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'signup' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setMode('admin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'admin' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Admin
              </button>
            </div>
          )}

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-heading font-bold mb-2">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'admin' && 'Admin Login'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Set New Password'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === 'login' && 'Sign in to access your dashboard'}
              {mode === 'signup' && 'Start your bioinformatics journey'}
              {mode === 'admin' && 'Access the admin dashboard'}
              {mode === 'forgot' && 'Enter your email to receive a reset link'}
              {mode === 'reset' && 'Choose a new secure password'}
            </p>
          </div>

          {/* Admin Badge */}
          {mode === 'admin' && (
            <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 bg-primary/10 rounded-lg">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Administrator Access</span>
            </div>
          )}

          {/* Reset Password Badge */}
          {(mode === 'forgot' || mode === 'reset') && (
            <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 bg-primary/10 rounded-lg">
              <KeyRound className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                {mode === 'forgot' ? 'Password Recovery' : 'Create New Password'}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="pl-10 bg-background"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10 bg-background"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-10 bg-background"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="pl-10 bg-background"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'admin') && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button variant="hero" size="lg" type="submit" className="w-full" disabled={loading || googleLoading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === 'login' && (loading ? 'Signing In...' : 'Sign In')}
              {mode === 'signup' && (loading ? 'Creating Account...' : 'Create Account')}
              {mode === 'admin' && (loading ? 'Signing In...' : 'Admin Sign In')}
              {mode === 'forgot' && (loading ? 'Sending...' : 'Send Reset Link')}
              {mode === 'reset' && (loading ? 'Updating...' : 'Update Password')}
            </Button>

            {/* Google OAuth - show only for login/signup modes */}
            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                    or continue with
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {googleLoading ? 'Signing in...' : 'Continue with Google'}
                </Button>
              </>
            )}
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
            {mode === 'admin' && (
              <>
                Not an admin?{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                  User login
                </button>
              </>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <>
                Remember your password?{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                  Back to login
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
