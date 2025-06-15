
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CustomerDebugPanel = () => {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const { toast } = useToast();

  const runDebugFunction = async () => {
    setLoading(true);
    try {
      console.log('🔍 Calling debug-customers function...');
      
      const { data, error } = await supabase.functions.invoke('debug-customers');
      
      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      console.log('✅ Debug data received:', data);
      setDebugData(data);
      
      toast({
        title: "Debug Complete",
        description: `Found ${data.totalProfiles} profiles and ${data.totalOrders} orders`,
      });
    } catch (error: any) {
      console.error('💥 Error calling debug function:', error);
      toast({
        title: "Debug Failed",
        description: error.message || "Failed to run debug function",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Customer Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebugFunction} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Running Debug..." : "Run Customer Debug"}
        </Button>
        
        {debugData && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Profiles: {debugData.totalProfiles}</div>
                <div>Total Orders: {debugData.totalOrders}</div>
                <div>Profiles with Data: {debugData.profilesWithData}</div>
                <div>Target Customer Found: {debugData.targetCustomer.found ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            {debugData.targetCustomer.found && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Target Customer (a48bc14d)</h4>
                <div className="text-sm space-y-1">
                  <div>Name: {debugData.targetCustomer.profile.first_name} {debugData.targetCustomer.profile.last_name}</div>
                  <div>Email: {debugData.targetCustomer.profile.email}</div>
                  <div>Phone: {debugData.targetCustomer.profile.phone || 'Not provided'}</div>
                  <div>Orders: {debugData.targetCustomer.orderCount}</div>
                </div>
              </div>
            )}
            
            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-semibold">Raw Debug Data</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerDebugPanel;
