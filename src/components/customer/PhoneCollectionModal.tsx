import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PhoneCollectionModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const PhoneCollectionModal = ({ isOpen, onComplete }: PhoneCollectionModalProps) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to continue.",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation (adjust regex based on your needs)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        firstName: user?.user_metadata?.first_name || "",
        lastName: user?.user_metadata?.last_name || "",
        phone: phone.trim(),
      });

      toast({
        title: "Profile completed!",
        description: "Your phone number has been saved.",
      });

      onComplete();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to save phone number. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <p className="text-sm text-gray-500">
              We need your phone number to process orders and send updates.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !phone.trim()}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};