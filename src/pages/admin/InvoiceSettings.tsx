
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, FileText, Building, Phone, Mail, Hash, CreditCard } from "lucide-react";

interface InvoiceSettings {
  id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  gst_number: string;
  fssai_number: string | null;
  pan_number: string | null;
  invoice_prefix: string;
  invoice_counter: number;
  terms_and_conditions: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
}

const InvoiceSettings = () => {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Error fetching invoice settings:", error);
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("invoice_settings")
        .update({
          company_name: settings.company_name,
          company_address: settings.company_address,
          company_phone: settings.company_phone,
          company_email: settings.company_email,
          gst_number: settings.gst_number,
          fssai_number: settings.fssai_number,
          pan_number: settings.pan_number,
          invoice_prefix: settings.invoice_prefix,
          invoice_counter: settings.invoice_counter,
          terms_and_conditions: settings.terms_and_conditions,
          bank_name: settings.bank_name,
          account_number: settings.account_number,
          ifsc_code: settings.ifsc_code,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice settings saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save invoice settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof InvoiceSettings, value: string | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No invoice settings found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Settings</h1>
          <p className="text-muted-foreground">
            Configure your company details and invoice preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                value={settings.company_address}
                onChange={(e) => updateField("company_address", e.target.value)}
                placeholder="123 Business Street, City, State 12345"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="company_phone">Phone Number</Label>
              <Input
                id="company_phone"
                value={settings.company_phone}
                onChange={(e) => updateField("company_phone", e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <Label htmlFor="company_email">Email Address</Label>
              <Input
                id="company_email"
                type="email"
                value={settings.company_email}
                onChange={(e) => updateField("company_email", e.target.value)}
                placeholder="info@yourcompany.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Tax & Registration Numbers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                value={settings.gst_number}
                onChange={(e) => updateField("gst_number", e.target.value)}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <Label htmlFor="fssai_number">FSSAI Number (Optional)</Label>
              <Input
                id="fssai_number"
                value={settings.fssai_number || ""}
                onChange={(e) => updateField("fssai_number", e.target.value)}
                placeholder="Enter FSSAI number"
              />
            </div>

            <div>
              <Label htmlFor="pan_number">PAN Number (Optional)</Label>
              <Input
                id="pan_number"
                value={settings.pan_number || ""}
                onChange={(e) => updateField("pan_number", e.target.value)}
                placeholder="ABCDE1234F"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
              <Input
                id="invoice_prefix"
                value={settings.invoice_prefix}
                onChange={(e) => updateField("invoice_prefix", e.target.value)}
                placeholder="INV"
              />
            </div>

            <div>
              <Label htmlFor="invoice_counter">Next Invoice Number</Label>
              <Input
                id="invoice_counter"
                type="number"
                value={settings.invoice_counter}
                onChange={(e) => updateField("invoice_counter", parseInt(e.target.value) || 1)}
                min="1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Next invoice will be: {settings.invoice_prefix}-{String(settings.invoice_counter).padStart(4, '0')}
              </p>
            </div>

            <div>
              <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_and_conditions"
                value={settings.terms_and_conditions || ""}
                onChange={(e) => updateField("terms_and_conditions", e.target.value)}
                placeholder="Thank you for your business! Please make payment within 30 days."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Details (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={settings.bank_name || ""}
                onChange={(e) => updateField("bank_name", e.target.value)}
                placeholder="State Bank of India"
              />
            </div>

            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={settings.account_number || ""}
                onChange={(e) => updateField("account_number", e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div>
              <Label htmlFor="ifsc_code">IFSC Code</Label>
              <Input
                id="ifsc_code"
                value={settings.ifsc_code || ""}
                onChange={(e) => updateField("ifsc_code", e.target.value)}
                placeholder="SBIN0001234"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceSettings;
