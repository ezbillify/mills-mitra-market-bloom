
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-warm-beige px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-warm-brown">
          Admin Dashboard
        </h1>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-olive-leaf hover:bg-warm-beige">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-olive-leaf hover:bg-warm-beige">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border-warm-beige">
              <div className="px-4 py-2 text-sm text-earth-brown">
                <div className="font-medium">Signed in as</div>
                <div className="text-olive-leaf truncate">{user?.email}</div>
              </div>
              <DropdownMenuSeparator className="bg-warm-beige" />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-warm-brown hover:bg-warm-beige">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
