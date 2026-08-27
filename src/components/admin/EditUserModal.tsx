import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const editUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  rank: z.string(),
  status: z.enum(['active', 'inactive', 'blocked']),
  joiningPackage: z.number().min(0, 'Package must be positive'),
  panCardNumber: z.string().optional(),
  aadharCardNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankBranch: z.string().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserData {
  fullName: string;
  email: string;
  phone: string;
  rank: string;
  status: 'active' | 'inactive' | 'blocked';
  joiningPackage: number;
  panCardNumber?: string;
  aadharCardNumber?: string;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    branch?: string;
  };
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  userData: UserData;
  onSuccess: () => void;
}

const RANK_OPTIONS = [
  'Associate', 'Bronze', 'Silver', 'Gold', 'Platinum',
  'Diamond', 'Blue Diamond', 'Black Diamond', 'Royal Diamond',
  'Crown Diamond', 'Ambassador', 'Crown Ambassador', 'SSVPL Legend',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
];

const EditUserModal = ({ open, onOpenChange, memberId, userData, onSuccess }: EditUserModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: buildDefaults(userData),
  });

  useEffect(() => {
    if (userData) reset(buildDefaults(userData));
  }, [userData, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    try {
      setIsSubmitting(true);
      await api.patch(`/api/v1/admin/users/${memberId}`, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        rank: data.rank,
        status: data.status,
        joiningPackage: data.joiningPackage,
        panCardNumber: data.panCardNumber || undefined,
        kyc: {
          aadhaarNumber: data.aadharCardNumber || undefined,
        },
        bankDetails: {
          accountName: data.bankAccountName || '',
          accountNumber: data.bankAccountNumber || '',
          bankName: data.bankName || '',
          ifscCode: data.bankIfscCode || '',
          branch: data.bankBranch || '',
        },
      });
      toast.success('User details updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRank = watch('rank');
  const selectedStatus = watch('status');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Section A: Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" error={errors.fullName?.message}>
                <Input placeholder="Enter full name" {...register('fullName')} disabled={isSubmitting} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" placeholder="Enter email" {...register('email')} disabled={isSubmitting} />
              </Field>
              <Field label="Phone Number" error={errors.phone?.message}>
                <Input type="tel" placeholder="Enter phone" {...register('phone')} disabled={isSubmitting} />
              </Field>
              <Field label="PAN Card Number" error={errors.panCardNumber?.message}>
                <Input
                  placeholder="ABCDE1234F"
                  {...register('panCardNumber')}
                  disabled={isSubmitting}
                  className="uppercase"
                  onChange={(e) => setValue('panCardNumber', e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="Aadhaar Card Number" error={errors.aadharCardNumber?.message}>
                <Input placeholder="1234 5678 9012" {...register('aadharCardNumber')} disabled={isSubmitting} />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Section B: Account Settings */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Account Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Rank">
                <Select value={selectedRank} onValueChange={(v) => setValue('rank', v)} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
                  <SelectContent>
                    {RANK_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={selectedStatus} onValueChange={(v) => setValue('status', v as any)} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Joining Package (₹)" error={errors.joiningPackage?.message}>
                <Input type="number" placeholder="500" {...register('joiningPackage', { valueAsNumber: true })} disabled={isSubmitting} min={0} />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Section C: Bank Details */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Bank Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Account Holder Name">
                <Input placeholder="Account holder name" {...register('bankAccountName')} disabled={isSubmitting} />
              </Field>
              <Field label="Account Number">
                <Input placeholder="Account number" {...register('bankAccountNumber')} disabled={isSubmitting} />
              </Field>
              <Field label="Bank Name">
                <Input placeholder="Bank name" {...register('bankName')} disabled={isSubmitting} />
              </Field>
              <Field label="IFSC Code">
                <Input
                  placeholder="SBIN0001234"
                  {...register('bankIfscCode')}
                  disabled={isSubmitting}
                  className="uppercase"
                  onChange={(e) => setValue('bankIfscCode', e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="Branch">
                <Input placeholder="Branch name" {...register('bankBranch')} disabled={isSubmitting} />
              </Field>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Helper: build form defaults from userData
function buildDefaults(userData: UserData): EditUserFormData {
  return {
    fullName: userData.fullName || '',
    email: userData.email || '',
    phone: userData.phone || '',
    rank: userData.rank || 'Associate',
    status: userData.status || 'active',
    joiningPackage: userData.joiningPackage || 0,
    panCardNumber: userData.panCardNumber || '',
    aadharCardNumber: userData.aadharCardNumber || '',
    bankAccountName: userData.bankDetails?.accountName || '',
    bankAccountNumber: userData.bankDetails?.accountNumber || '',
    bankName: userData.bankDetails?.bankName || '',
    bankIfscCode: userData.bankDetails?.ifscCode || '',
    bankBranch: userData.bankDetails?.branch || '',
  };
}

// Reusable field wrapper
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default EditUserModal;
