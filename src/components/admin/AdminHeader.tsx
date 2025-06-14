
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, Search } from "lucide-react";
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
    <header className="bg-white shadow-sm border-b border-warm-beige/20 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-warm-brown">
            Admin Dashboard
          </h1>
          <p className="text-earth-brown/70 mt-1">Manage your millet marketplace</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-brown/50 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-warm-beige/10 border border-warm-beige/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-golden-millet/50 focus:border-golden-millet text-warm-brown placeholder:text-earth-brown/50"
            />
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-olive-leaf hover:bg-olive-leaf/10 hover:text-olive-leaf rounded-lg"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-golden-millet rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 text-olive-leaf hover:bg-olive-leaf/10 hover:text-olive-leaf rounded-lg px-3 py-2"
              >
                <div className="w-8 h-8 bg-golden-millet rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-warm-brown" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-warm-brown">Admin</div>
                  <div className="text-xs text-earth-brown/70 truncate max-w-32">
                    {user?.email}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-warm-beige/20 shadow-xl z-50">
              <div className="px-4 py-3 text-sm text-earth-brown border-b border-warm-beige/20">
                <div className="font-medium">Signed in as</div>
                <div className="text-olive-leaf truncate font-medium">{user?.email}</div>
              </div>
              <DropdownMenuSeparator className="bg-warm-beige/20" />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-warm-brown hover:bg-warm-beige/10 cursor-pointer">
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
