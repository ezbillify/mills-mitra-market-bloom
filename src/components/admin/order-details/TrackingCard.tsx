
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Save } from "lucide-react";

interface TrackingCardProps {
  trackingNumber: string;
  onTrackingNumberChange: (value: string) => void;
  onUpdate: () => void;
  isUpdating: boolean;
}

const TrackingCard = ({ trackingNumber, onTrackingNumberChange, onUpdate, isUpdating }: TrackingCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping & Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="tracking-number">Tracking Number:</Label>
          <div className="flex gap-2">
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(e) => onTrackingNumberChange(e.target.value)}
              placeholder="Enter tracking number"
            />
            <Button
              size="sm"
              onClick={onUpdate}
              disabled={isUpdating}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackingCard;
