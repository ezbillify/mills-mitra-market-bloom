import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch with our team for any questions about our millet products.
          </p>
        </div>

        {/* Only Contact Info - Removed Message Form */}
        <div className="flex justify-center max-w-5xl mx-auto">
          {/* Contact Information Cards */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">Call us for immediate assistance</p>
                <p className="font-semibold text-lg">+91 88619 23747</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">Send us an email anytime</p>
                <p className="font-semibold text-lg">support@millsmitra.com</p>
                <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">Visit our manufacturing facility</p>
                <p className="font-semibold">CHAMUNDESHWARI ENTERPRISES</p>
                <p className="text-gray-600">Hadli Village, Kasaba Hobli</p>
                <p className="text-gray-600">Malavalli (tq), Mandya (dist)</p>
                <p className="text-gray-600">Karnataka - 571430</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Why Choose Mills Mitra?</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-primary mb-2">Premium Quality</h4>
                  <p className="text-gray-600">Certified organic millet products sourced directly from farmers</p>
                </div>
                <div>
                  <h4 className="font-medium text-primary mb-2">Fast Shipping</h4>
                  <p className="text-gray-600">Free delivery on orders above ₹798 across India</p>
                </div>
                <div>
                  <h4 className="font-medium text-primary mb-2">Expert Support</h4>
                  <p className="text-gray-600">Nutritionist-backed recommendations for your health goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
