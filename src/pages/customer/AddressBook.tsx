import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddressManager from "@/components/customer/AddressManager";

const AddressBook = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/account")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Account
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Address Book</CardTitle>
          <p className="text-gray-600">
            Manage your saved addresses for faster checkout
          </p>
        </CardHeader>
        <CardContent>
          <AddressManager />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressBook;