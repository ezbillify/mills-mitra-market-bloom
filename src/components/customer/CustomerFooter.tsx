
import { Link } from "react-router-dom";

const CustomerFooter = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">MILLS MITRA</h3>
            <p className="text-gray-300 mb-4">
              Your trusted partner for quality products and exceptional service.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Contact Us</li>
              <li>Return Policy</li>
              <li>Shipping Info</li>
              <li>FAQ</li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="text-gray-300 space-y-2">
              <p>Email: support@millsmitra.com</p>
              <p>Phone: +91 98765 43210</p>
              <p>Hours: Mon-Sat 9AM-6PM</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 Mills Mitra. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
