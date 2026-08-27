import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, Wallet, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, user } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId.trim() || !password.trim()) {
      toast.error('Please enter Member ID and Password');
      return;
    }
    
    try {
      const result = await login(memberId.trim(), password);
      
      if (result.success && result.redirect) {
        toast.success('Login successful!');
        // Role-based redirect from auth store
        navigate(result.redirect, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 to-green-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <img 
              src="https://res.cloudinary.com/dkgwi1xvx/image/upload/v1769630007/sdfsdf_q4ziyu.png" 
              alt="Sarva Solution Vision" 
              className="h-12 w-auto drop-shadow-md"
            />
          </Link>
          <p className="text-white/80 mt-2 text-lg font-medium">Premium Network Marketing Platform</p>
        </div>

        {/* Premium Photo Frame */}
        <div className="relative z-20 w-max mx-auto my-4 lg:my-6">
          {/* Outer elegant frame (Gold/Bronze effect) */}
          <div className="p-[2px] bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 rounded-[10px] shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
            {/* Inner mount (White Passe-partout) */}
            <div className="p-3 lg:p-4 bg-[#faf9f6] rounded-lg shadow-inner">
              {/* Image Container with inner shadow */}
              <div className="relative overflow-hidden rounded-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] border border-stone-300">
                <img 
                  src="/teamPhoto.png" 
                  alt="Our Team" 
                  className="w-full max-w-[280px] lg:max-w-[320px] xl:max-w-[400px] h-auto object-cover transform hover:scale-105 transition-transform duration-1000 ease-out"
                />
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="h-[1px] w-6 bg-amber-400/50"></div>
                <p className="text-center font-bold text-stone-800 text-[10px] lg:text-xs tracking-[0.2em] uppercase">
                  Leading The Future
                </p>
                <div className="h-[1px] w-6 bg-amber-400/50"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
            <div className="p-3 bg-white/20 rounded-xl shadow-inner">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Grow Your Network</h3>
              <p className="text-white/80 text-sm">Build a powerful team and earn unlimited commissions globally.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
            <div className="p-3 bg-white/20 rounded-xl shadow-inner">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Binary System</h3>
              <p className="text-white/80 text-sm">Proven binary compensation plan designed for maximum earnings.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
            <div className="p-3 bg-white/20 rounded-xl shadow-inner">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Instant Payouts</h3>
              <p className="text-white/80 text-sm">Get your earnings securely transferred directly to your bank account.</p>
            </div>
          </div>
        </div>
        
        <p className="text-white/60 text-sm relative z-10 font-medium">
          © 2026 Sarva Solution Vision Pvt Ltd. All rights reserved.
        </p>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your Member ID and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memberId" className="text-foreground">Member ID</Label>
                <Input
                  id="memberId"
                  type="text"
                  placeholder="e.g., SVS12345"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                  required
                  className="bg-card border-input"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-card border-input pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
