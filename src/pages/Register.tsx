import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, TrendingUp, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import MemberIdModal from '@/components/MemberIdModal';
import api from '@/lib/api';
import { sendOtp, verifyOtp } from '@/services/otpService';

const Register = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    sponsorId: referralId?.toUpperCase() || '',
    panCardNumber: '',
    preferredPosition: '' as 'left' | 'right' | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // Phone OTP verification
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [sponsorName, setSponsorName] = useState<string | null>(null);
  const [isVerifyingSponsor, setIsVerifyingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReferral = !!referralId;
  
  const { register, isLoading, error, clearError } = useAuthStore();

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Debounced sponsor verification
  useEffect(() => {
    const sponsorId = formData.sponsorId.trim();
    if (!sponsorId) {
      setSponsorName(null);
      setSponsorError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsVerifyingSponsor(true);
      setSponsorName(null);
      setSponsorError(null);
      try {
        const res = await api.get(`/api/v1/user-name/${encodeURIComponent(sponsorId)}`);
        if (res.data?.success && res.data?.data?.fullName) {
          setSponsorName(res.data.data.fullName);
        } else {
          setSponsorError('Invalid Sponsor ID');
        }
      } catch {
        setSponsorError('Invalid Sponsor ID');
      } finally {
        setIsVerifyingSponsor(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.sponsorId]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sponsorId' || name === 'panCardNumber' ? value.toUpperCase() : value,
    }));
    // Changing the phone number invalidates any previous OTP verification.
    if (name === 'phone') {
      setOtpSent(false);
      setOtpInput('');
      setPhoneVerified(false);
      setVerifiedPhone(null);
    }
  };

  const handleSendOtp = async () => {
    const phone = formData.phone.trim();
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit phone number first');
      return;
    }
    setSendingOtp(true);
    try {
      await sendOtp(phone);
      setOtpSent(true);
      setOtpInput('');
      setResendIn(30);
      toast.success('OTP sent to your phone number');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length < 4) return;
    setVerifyingOtp(true);
    try {
      await verifyOtp(formData.phone.trim(), otpInput.trim());
      setPhoneVerified(true);
      setVerifiedPhone(formData.phone.trim());
      toast.success('Phone number verified!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Incorrect OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    if (!phoneVerified || verifiedPhone !== formData.phone.trim()) {
      toast.error('Please verify your phone number via OTP');
      return false;
    }
    if (!formData.sponsorId.trim()) {
      toast.error('Please enter a valid Sponsor ID');
      return false;
    }
    if (!formData.preferredPosition) {
      toast.error('Please select a position (Left or Right)');
      return false;
    }
    if (!formData.panCardNumber.trim()) {
      toast.error('Please enter your PAN Card number');
      return false;
    }
    if (!agreedToTerms) {
      toast.error('Please accept the Terms & Conditions to continue');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await register({
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
      sponsorId: formData.sponsorId.trim(),
      panCardNumber: formData.panCardNumber.trim(),
      preferredPosition: formData.preferredPosition as 'left' | 'right',
    });
    
    if (result.success) {
      toast.success('Registration successful!');
      // Modal will be shown automatically by the store
    }
  };

  return (
    <>
      <MemberIdModal />
      
      <div className="min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
          <div>
            <Link to="/" className="inline-block">
              <img 
                src="https://res.cloudinary.com/dkgwi1xvx/image/upload/v1769630007/sdfsdf_q4ziyu.png" 
                alt="Sarva Solution Vision" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-primary-foreground/80 mt-2">Network Marketing Platform</p>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-foreground">Start Your Journey Today</h2>
            <p className="text-primary-foreground/80">
              Join thousands of successful entrepreneurs who are building their financial freedom with Sarva Solution Vision.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-foreground/10 p-4 rounded-lg">
                <p className="text-2xl font-bold text-primary-foreground">10,000+</p>
                <p className="text-primary-foreground/70 text-sm">Active Members</p>
              </div>
              <div className="bg-primary-foreground/10 p-4 rounded-lg">
                <p className="text-2xl font-bold text-primary-foreground">₹5Cr+</p>
                <p className="text-primary-foreground/70 text-sm">Total Payouts</p>
              </div>
            </div>
          </div>
          
          <p className="text-primary-foreground/60 text-sm">
            © 2026 Sarva Solution Vision Pvt Ltd. All rights reserved.
          </p>
        </div>
        
        {/* Right side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <Card className="w-full max-w-md border-border shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your details to join the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sponsorId" className="text-foreground">Sponsor ID *</Label>
                  <Input
                    id="sponsorId"
                    name="sponsorId"
                    type="text"
                    placeholder="e.g., SVS001"
                    value={formData.sponsorId}
                    onChange={handleChange}
                    required
                    className={`bg-card border-input ${sponsorError ? 'border-destructive' : sponsorName ? 'border-green-500' : ''}`}
                    disabled={isLoading || isReferral}
                    readOnly={isReferral}
                  />
                  {isVerifyingSponsor && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                    </p>
                  )}
                  {!isVerifyingSponsor && sponsorName && (
                    <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Sponsor: {sponsorName}
                    </p>
                  )}
                  {!isVerifyingSponsor && sponsorError && (
                    <p className="text-xs text-destructive mt-1">{sponsorError}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferredPosition" className="text-foreground">Select Position *</Label>
                  <Select
                    value={formData.preferredPosition}
                    onValueChange={(value: 'left' | 'right') => 
                      setFormData(prev => ({ ...prev, preferredPosition: value }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-card border-input">
                      <SelectValue placeholder="Choose Left or Right" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="bg-card border-input"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-card border-input"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="bg-card border-input flex-1"
                      disabled={isLoading || phoneVerified}
                    />
                    {phoneVerified ? (
                      <span className="flex items-center gap-1 px-3 text-sm font-medium text-green-600 whitespace-nowrap">
                        <CheckCircle className="h-4 w-4" /> Verified
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOtp}
                        disabled={isLoading || sendingOtp || resendIn > 0}
                        className="shrink-0 whitespace-nowrap"
                      >
                        {sendingOtp ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : resendIn > 0 ? (
                          `Resend in ${resendIn}s`
                        ) : otpSent ? (
                          'Resend OTP'
                        ) : (
                          'Send OTP'
                        )}
                      </Button>
                    )}
                  </div>

                  {otpSent && !phoneVerified && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="bg-card border-input flex-1 tracking-widest"
                        disabled={isLoading || verifyingOtp}
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || verifyingOtp || otpInput.length < 4}
                        className="shrink-0"
                      >
                        {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="panCardNumber" className="text-foreground">PAN Card Number *</Label>
                  <Input
                    id="panCardNumber"
                    name="panCardNumber"
                    type="text"
                    placeholder="e.g., ABCDE1234F"
                    value={formData.panCardNumber}
                    onChange={handleChange}
                    required
                    className="bg-card border-input"
                    disabled={isLoading}
                    maxLength={10}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password (min 6 characters)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="bg-card border-input pr-10"
                      disabled={isLoading}
                      minLength={6}
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
                
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="agreeTerms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    disabled={isLoading}
                    className="mt-0.5"
                  />
                  <Label htmlFor="agreeTerms" className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer">
                    I have read and agree to the{' '}
                    <Link
                      to="/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Terms &amp; Conditions
                    </Link>
                  </Label>
                </div>

                {phoneVerified ? (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !agreedToTerms}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Join Network
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground border border-dashed border-input rounded-md py-2.5">
                    <ShieldCheck className="h-4 w-4" />
                    Verify your phone number to continue
                  </p>
                )}
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Register;
