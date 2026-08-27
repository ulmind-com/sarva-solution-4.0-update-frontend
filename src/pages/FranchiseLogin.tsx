import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFranchiseAuthStore } from '@/stores/useFranchiseAuthStore';
import { toast } from 'sonner';

const FranchiseLogin = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated, clearError } = useFranchiseAuthStore();
  const [formData, setFormData] = useState({
    vendorId: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/franchise/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await login(formData.vendorId, formData.password);

    if (result.success) {
      toast.success('Login successful!');
      navigate('/franchise/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="shadow-xl border-border/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Franchise Login</CardTitle>
            <CardDescription>
              Enter your vendor credentials to access the franchise portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendorId">Vendor ID</Label>
                <Input
                  id="vendorId"
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleInputChange}
                  placeholder="Enter your vendor ID"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login to Franchise Portal
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Not a franchise partner?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  User Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FranchiseLogin;
