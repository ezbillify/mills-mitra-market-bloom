
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { InvoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";

interface PDFInvoiceCardProps {
  orderId: string;
}

const PDFInvoiceCard = ({ orderId }: PDFInvoiceCardProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  const generatePDFInvoice = async () => {
    setIsGeneratingPDF(true);
    try {
      await InvoiceService.downloadInvoiceForOrder(orderId);
      toast({
        title: "Success",
        description: "PDF invoice generated and downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error generating PDF invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF invoice",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          PDF Invoice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Generate and download a professional PDF invoice for this order.
        </p>
        <Button
          onClick={generatePDFInvoice}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGeneratingPDF ? "Generating PDF..." : "Download PDF Invoice"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PDFInvoiceCard;
