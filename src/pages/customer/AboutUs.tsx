import React from 'react';
import { Wheat, Heart, Leaf, Phone, Mail, MapPin, Award, Users, Clock } from 'lucide-react';

const AboutUs = () => {
  const features = [
    {
      icon: <Wheat className="w-8 h-8 text-green-600" />,
      title: "100% Organic Millets",
      description: "Carefully sourced ancient grains rich in fiber, vitamins, and minerals"
    },
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Natural Energy Boost",
      description: "Sustained energy release to keep you active throughout the day"
    },
    {
      icon: <Leaf className="w-8 h-8 text-green-500" />,
      title: "Pure & Natural",
      description: "No artificial additives, preservatives, or chemicals"
    }
  ];

  const stats = [
    { number: "500+", label: "Happy Customers" },
    { number: "100%", label: "Organic Products" },
    { number: "5★", label: "Customer Rating" },
    { number: "2+", label: "Years of Trust" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-amber-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 p-2">
            <img 
              src="public/lovable-uploads/15f592d4-1f27-4123-b5d7-dcf05b8463c7.png" 
              alt="Mills Mitra Logo" 
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const nextSibling = target.nextElementSibling as HTMLElement;
                target.style.display = 'none';
                if (nextSibling) {
                  nextSibling.style.display = 'block';
                }
              }}
            />
            <Wheat className="w-12 h-12 text-green-600 hidden" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Mills Mitra
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-95">
            Crafting Pure Organic Millet Health Mix for Your Natural Energy & Wellness
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-full px-6 py-2 text-sm font-medium">
              🌱 100% Organic
            </div>
            <div className="bg-white bg-opacity-20 rounded-full px-6 py-2 text-sm font-medium">
              ⚡ Natural Energy
            </div>
            <div className="bg-white bg-opacity-20 rounded-full px-6 py-2 text-sm font-medium">
              💚 Chemical Free
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white shadow-lg -mt-12 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        {/* Our Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Story</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-amber-500 mx-auto mb-6"></div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="text-xl mb-6 text-gray-800 font-medium">
                Mills Mitra Pure Organic Millets Health Mix is born from a passion for natural wellness and sustainable nutrition.
              </p>
              
              <p className="mb-6">
                Our carefully crafted blend combines the wisdom of ancient grains with modern nutritional science. Each variety of organic millet in our health mix brings unique benefits - from rich fiber content that supports digestion to essential vitamins and minerals that nourish your body from within.
              </p>
              
              <p className="mb-6">
                What sets us apart is our commitment to purity. These time-tested ancient grains provide a sustained release of energy, keeping you active, focused, and energized throughout your day without the crashes associated with processed foods.
              </p>
              
              <p>
                Whether you start your morning with a nourishing porridge, blend it into a smoothie, or enjoy it as a wholesome mid-day snack, Mills Mitra ensures every serving delivers both exceptional taste and complete nutrition. We believe in fueling your body the way nature intended!
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Mills Mitra?</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-amber-500 mx-auto mb-6"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-green-600 to-amber-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-12 md:px-12 md:py-16 text-white">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Get In Touch</h2>
              <p className="text-xl opacity-90">We'd love to hear from you! Reach out with any questions or feedback.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 group-hover:bg-opacity-30 transition-all duration-300">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                <a href="mailto:support@millsmitra.com" className="text-white hover:text-yellow-200 transition-colors duration-300 font-medium">
                  support@millsmitra.com
                </a>
              </div>
              
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 group-hover:bg-opacity-30 transition-all duration-300">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Call Us</h3>
                <a href="tel:+918861923747" className="text-white hover:text-yellow-200 transition-colors duration-300 font-medium">
                  +91 88619 23747
                </a>
              </div>
              
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 group-hover:bg-opacity-30 transition-all duration-300">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Response Time</h3>
                <p className="text-white opacity-90">
                  Within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Embrace Natural Wellness?</h3>
          <p className="text-gray-400 mb-6">Join thousands of customers who trust Mills Mitra for their daily nutrition needs.</p>
          <button className="bg-gradient-to-r from-green-500 to-amber-500 text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            Explore Our Products
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
