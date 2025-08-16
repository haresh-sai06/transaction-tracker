import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, MessageSquare, TrendingUp } from 'lucide-react';

interface SMSPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGrantPermission: () => void;
  onDenyPermission: () => void;
}

export const SMSPermissionDialog = ({
  open,
  onOpenChange,
  onGrantPermission,
  onDenyPermission
}: SMSPermissionDialogProps) => {
  const [isGranting, setIsGranting] = useState(false);

  const handleGrantPermission = async () => {
    setIsGranting(true);
    try {
      await onGrantPermission();
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            SMS Permission Required
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2">
            <p>
              This app needs access to your SMS messages to automatically parse transaction details and track expenses.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Read Transaction Messages</p>
                  <p className="text-xs text-muted-foreground">
                    Parse SMS from banks and payment apps to extract transaction details
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Automatic Expense Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Categorize and track your spending without manual entry
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                🔒 <strong>Your Privacy is Protected:</strong> We only read transaction-related messages. 
                Personal messages are never accessed or stored.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDenyPermission}
            className="w-full sm:w-auto"
          >
            Not Now
          </Button>
          <Button
            onClick={handleGrantPermission}
            disabled={isGranting}
            className="w-full sm:w-auto"
          >
            {isGranting ? "Granting..." : "Grant Permission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};