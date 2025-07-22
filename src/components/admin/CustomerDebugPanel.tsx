
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CustomerDebugPanel = () => {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const { toast } = useToast();

  const runDebugFunction = async () => {
    setLoading(true);
    try {
      console.log('🔍 Calling enhanced debug-customers function...');
      
      const { data, error } = await supabase.functions.invoke('debug-customers');
      
      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      console.log('✅ Enhanced debug data received:', data);
      setDebugData(data);
      
      toast({
        title: "Debug Complete",
        description: `Found ${data.totalProfiles} profiles and ${data.totalOrders} orders. RLS: ${data.rlsTestResult.canAccessWithPublicKey ? 'Working' : 'Issue detected'}`,
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

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Enhanced Customer Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebugFunction} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Running Enhanced Debug..." : "Run Enhanced Customer Debug"}
        </Button>
        
        {debugData && (
          <div className="space-y-4">
            {/* RLS Status Check */}
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                RLS Policy Status
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Frontend can access profiles:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugData.rlsTestResult.canAccessWithPublicKey)}
                    <span className={debugData.rlsTestResult.canAccessWithPublicKey ? 'text-green-600' : 'text-red-600'}>
                      {debugData.rlsTestResult.canAccessWithPublicKey ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Public access count:</span>
                  <span>{debugData.rlsTestResult.publicAccessCount}</span>
                </div>
                {debugData.rlsTestResult.error && (
                  <div className="text-red-600 text-xs">
                    Error: {debugData.rlsTestResult.error}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Database Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Profiles: {debugData.totalProfiles}</div>
                <div>Total Orders: {debugData.totalOrders}</div>
                <div>Complete Profiles: {debugData.profilesWithData}</div>
                <div>Incomplete Profiles: {debugData.incompleteProfiles}</div>
              </div>
            </div>

            {/* Profile Completeness */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Profile Completeness Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>With Names: {debugData.profileCompleteness.withNames}</div>
                <div>With Email: {debugData.profileCompleteness.withEmail}</div>
                <div>With Phone: {debugData.profileCompleteness.withPhone}</div>
                <div>With Address: {debugData.profileCompleteness.withAddress}</div>
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

            {/* Sample Data */}
            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-semibold">Sample Complete Profiles</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-48">
                {JSON.stringify(debugData.sampleCompleteProfiles, null, 2)}
              </pre>
            </details>

            <details className="bg-yellow-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-semibold">Sample Incomplete Profiles</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-48">
                {JSON.stringify(debugData.sampleIncompleteProfiles, null, 2)}
              </pre>
            </details>
            
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
