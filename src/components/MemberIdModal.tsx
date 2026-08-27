import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const MemberIdModal = () => {
  const { registeredMemberId, registeredPassword, registeredFullName, showMemberIdModal, closeMemberIdModal } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    if (registeredMemberId) {
      const textToCopy = `${registeredFullName ? `Name: ${registeredFullName}\n` : ''}Member ID: ${registeredMemberId}${registeredPassword ? `\nPassword: ${registeredPassword}` : ''}\nLogin URL: https://www.sarvasolutionvision.com/login`;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Login details copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    closeMemberIdModal();
    navigate('/login');
  };

  return (
    <Dialog open={showMemberIdModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Registration Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Your account has been created. Please save your login details below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-full flex items-center justify-between rounded-lg bg-accent px-4 py-3">
            <div className="flex flex-col gap-2 w-full pr-4">
              {registeredFullName && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground mr-4">Name:</span>
                  <span className="font-bold text-accent-foreground">{registeredFullName}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground mr-4">Member ID:</span>
                <span className="font-bold text-accent-foreground tracking-wider">{registeredMemberId}</span>
              </div>
              {registeredPassword && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground mr-4">Password:</span>
                  <span className="font-bold text-accent-foreground">{registeredPassword}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-sm text-muted-foreground mr-4 whitespace-nowrap">Login URL:</span>
                <span className="text-sm font-medium text-accent-foreground text-right whitespace-nowrap">https://www.sarvasolutionvision.com/login</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-10 w-10 shrink-0 border bg-background/50 hover:bg-background"
              title="Copy details"
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-destructive font-medium text-center px-4">
            ⚠️ Important: Please write down or copy these login details. You will need them to login.
          </p>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            I've Saved It - Continue to Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberIdModal;
