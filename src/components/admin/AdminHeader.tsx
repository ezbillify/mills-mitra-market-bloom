
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
    <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-royal-green">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage your millet marketplace</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-green/50 focus:border-royal-green text-gray-900 placeholder:text-gray-500"
            />
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-royal-green hover:bg-royal-green/10 hover:text-royal-green rounded-lg"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-medium-green rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 text-royal-green hover:bg-royal-green/10 hover:text-royal-green rounded-lg px-3 py-2"
              >
                <div className="w-8 h-8 bg-royal-green rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-gray-900">Admin</div>
                  <div className="text-xs text-gray-600 truncate max-w-32">
                    {user?.email}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200 shadow-xl z-50">
              <div className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                <div className="font-medium">Signed in as</div>
                <div className="text-royal-green truncate font-medium">{user?.email}</div>
              </div>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-gray-900 hover:bg-gray-50 cursor-pointer">
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
