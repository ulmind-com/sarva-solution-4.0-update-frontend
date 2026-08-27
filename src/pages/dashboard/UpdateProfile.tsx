import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Upload, Loader2, Camera, Lock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import KYCDetailsTab from '@/components/profile/KYCDetailsTab';

const UpdateProfile = () => {
  const { user, bankDetails, isLoading, isProfileLoading, fetchProfile, updateProfile, error, clearError } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    panCardNumber: '',
    dateOfBirth: '',
    // Address
    street: '',
    city: '',
    state: '',
    pinCode: '',
    // Banking
    accountName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: '',
    // Nominee
    nomineeName: '',
    nomineeRelation: '',
    nomineeDob: '',
  });
  
  const [dob, setDob] = useState<Date | undefined>();
  const [nomineeDob, setNomineeDob] = useState<Date | undefined>();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // One-time lock checks
  const isBankLocked = !!(bankDetails?.accountNumber && bankDetails?.ifscCode);
  const isPanLocked = !!user?.panCardNumber;

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Pre-fill form when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        panCardNumber: user.panCardNumber || '',
        // Address
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        pinCode: user.address?.pinCode || '',
        // Nominee
        nomineeName: user.nominee?.name || '',
        nomineeRelation: user.nominee?.relation || '',
      }));
      
      if (user.dateOfBirth) {
        setDob(new Date(user.dateOfBirth));
      }
      
      if (user.nominee?.dateOfBirth) {
        setNomineeDob(new Date(user.nominee.dateOfBirth));
      }
    }
  }, [user]);

  // Pre-fill bank details
  useEffect(() => {
    if (bankDetails) {
      setFormData(prev => ({
        ...prev,
        accountName: bankDetails.accountName || '',
        accountNumber: bankDetails.accountNumber || '',
        confirmAccountNumber: bankDetails.accountNumber || '',
        ifscCode: bankDetails.ifscCode || '',
        bankName: bankDetails.bankName || '',
        branch: bankDetails.branch || '',
      }));
    }
  }, [bankDetails]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    // Validate account numbers match
    if (formData.accountNumber && formData.accountNumber !== formData.confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }

    const formDataToSend = new FormData();
    
    // Append simple text fields
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    
    // Only send PAN if not already locked
    if (!isPanLocked) {
      formDataToSend.append('panCardNumber', formData.panCardNumber);
    }
    
    if (dob) {
      formDataToSend.append('dateOfBirth', dob.toISOString());
    }
    
    // Append profile picture if selected
    if (profileImage) {
      formDataToSend.append('profilePicture', profileImage);
    }
    
    // Append address as JSON string
    const addressObj = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      pinCode: formData.pinCode,
    };
    formDataToSend.append('address', JSON.stringify(addressObj));
    
    // Only send bank details if not already locked
    if (!isBankLocked) {
      const bankObj = {
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
        branch: formData.branch,
      };
      formDataToSend.append('bankDetails', JSON.stringify(bankObj));
    }
    
    // Append nominee details as JSON string
    const nomineeObj = {
      name: formData.nomineeName,
      relation: formData.nomineeRelation,
      dateOfBirth: nomineeDob?.toISOString() || '',
    };
    formDataToSend.append('nominee', JSON.stringify(nomineeObj));

    const result = await updateProfile(formDataToSend);
    
    if (result.success) {
      toast.success('Profile Updated Successfully');
      setProfileImage(null);
      setImagePreview(null);
    }
  };

  // Get display image (preview or existing) - profilePicture is an object with url
  const displayImage = imagePreview || user?.profilePicture?.url || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Update Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="flex w-full justify-start overflow-x-auto scrollbar-hide bg-muted/50 p-1 mb-6 gap-1">
              <TabsTrigger value="personal" className="flex-shrink-0 whitespace-nowrap">Personal Details</TabsTrigger>
              <TabsTrigger value="contact" className="flex-shrink-0 whitespace-nowrap">Contact Details</TabsTrigger>
              <TabsTrigger value="banking" className="flex-shrink-0 whitespace-nowrap">Banking Details</TabsTrigger>
              <TabsTrigger value="nominee" className="flex-shrink-0 whitespace-nowrap">Nominee Details</TabsTrigger>
              <TabsTrigger value="kyc" className="flex-shrink-0 whitespace-nowrap">KYC Details</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              {/* Profile Photo Section */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {displayImage ? (
                      <AvatarImage src={displayImage} alt="Profile" />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {isProfileLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        user?.fullName?.charAt(0) || 'U'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {imagePreview && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                      <Camera className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                      <Upload className="h-4 w-4" />
                      {imagePreview ? 'Change Photo' : 'Upload Photo'}
                    </div>
                  </Label>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    id="photo" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
                  {imagePreview && (
                    <p className="text-xs text-primary mt-1">New photo selected - click Update to save</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sponsor ID</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      value={user?.sponsorId || 'N/A'} 
                      disabled 
                      className="bg-muted"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Sponsor Name</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      value={user?.sponsorName || 'N/A'} 
                      disabled 
                      className="bg-muted"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Member ID</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      value={user?.memberId || 'N/A'} 
                      disabled 
                      className="bg-muted"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Joining Date</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      value={user?.createdAt ? format(new Date(user.createdAt), 'PPP') : ''} 
                      disabled 
                      className="bg-muted"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dob && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dob ? format(dob, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dob}
                          onSelect={setDob}
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="phone"
                      type="tel" 
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <Textarea 
                      name="street"
                      placeholder="Enter your complete address" 
                      rows={3}
                      value={formData.street}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select 
                      value={formData.state} 
                      onValueChange={(value) => handleSelectChange('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="karnataka">Karnataka</SelectItem>
                        <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="gujarat">Gujarat</SelectItem>
                        <SelectItem value="rajasthan">Rajasthan</SelectItem>
                        <SelectItem value="west-bengal">West Bengal</SelectItem>
                        <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                        <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="telangana">Telangana</SelectItem>
                        <SelectItem value="kerala">Kerala</SelectItem>
                        <SelectItem value="punjab">Punjab</SelectItem>
                        <SelectItem value="haryana">Haryana</SelectItem>
                        <SelectItem value="bihar">Bihar</SelectItem>
                        <SelectItem value="odisha">Odisha</SelectItem>
                        <SelectItem value="madhya-pradesh">Madhya Pradesh</SelectItem>
                        <SelectItem value="chhattisgarh">Chhattisgarh</SelectItem>
                        <SelectItem value="jharkhand">Jharkhand</SelectItem>
                        <SelectItem value="assam">Assam</SelectItem>
                        <SelectItem value="goa">Goa</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Pin Code</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="pinCode"
                      type="text" 
                      placeholder="XXXXXX" 
                      maxLength={6}
                      value={formData.pinCode}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="banking" className="space-y-6">
              {isBankLocked && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Lock className="h-4 w-4" />
                  <AlertDescription className="flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 flex-shrink-0" />
                    Bank details are locked for security. Please contact Admin to modify.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="accountName"
                      type="text" 
                      placeholder="Enter account holder name"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      disabled={isBankLocked}
                      className={isBankLocked ? 'bg-muted' : ''}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="accountNumber"
                      type="text" 
                      placeholder="Enter account number"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      disabled={isBankLocked}
                      className={isBankLocked ? 'bg-muted' : ''}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm Account Number</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="confirmAccountNumber"
                      type="text" 
                      placeholder="Re-enter account number"
                      value={formData.confirmAccountNumber}
                      onChange={handleInputChange}
                      disabled={isBankLocked}
                      className={isBankLocked ? 'bg-muted' : ''}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="ifscCode"
                      type="text" 
                      placeholder="XXXX0XXXXXX"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      disabled={isBankLocked}
                      className={isBankLocked ? 'bg-muted uppercase' : 'uppercase'}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="bankName"
                      type="text" 
                      placeholder="Enter bank name"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      disabled={isBankLocked}
                      className={isBankLocked ? 'bg-muted' : ''}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Branch Name</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="branch"
                      type="text" 
                      placeholder="Enter branch name"
                      value={formData.branch}
                      onChange={handleInputChange}
                      disabled={isBankLocked}
                      className={isBankLocked ? 'bg-muted' : ''}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>PAN Card Number {isPanLocked && <Lock className="inline h-3 w-3 ml-1" />}</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="panCardNumber"
                      type="text" 
                      placeholder="XXXXX0000X" 
                      maxLength={10}
                      value={formData.panCardNumber}
                      onChange={handleInputChange}
                      disabled={isPanLocked}
                      className={isPanLocked ? 'bg-muted uppercase' : 'uppercase'}
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nominee" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nominee Name</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input 
                      name="nomineeName"
                      type="text" 
                      placeholder="Enter nominee full name"
                      value={formData.nomineeName}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Relation</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select 
                      value={formData.nomineeRelation}
                      onValueChange={(value) => handleSelectChange('nomineeRelation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="son">Son</SelectItem>
                        <SelectItem value="daughter">Daughter</SelectItem>
                        <SelectItem value="brother">Brother</SelectItem>
                        <SelectItem value="sister">Sister</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  {isProfileLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !nomineeDob && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nomineeDob ? format(nomineeDob, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={nomineeDob}
                          onSelect={setNomineeDob}
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kyc" className="space-y-6">
              <KYCDetailsTab />
            </TabsContent>

            <div className="mt-8 pt-6 border-t border-border">
              <Button onClick={handleUpdate} disabled={isLoading || isProfileLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Changes'
                )}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateProfile;
