import React from 'react';

const AboutUs = () => {
  return (
    <div className="container mx-auto py-16">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">About Us</h1>
      
      <div className="prose lg:prose-xl">
        <p>Welcome to Mills Mitra, your trusted partner for quality products and exceptional service. We are dedicated to providing you with the best possible shopping experience.</p>

        <h2>Our Mission</h2>
        <p>Our mission is to offer a wide range of high-quality products at competitive prices, while maintaining a strong commitment to customer satisfaction.</p>

        <h2>Our Values</h2>
        <ul>
          <li><strong>Quality:</strong> We source our products from reputable suppliers to ensure the highest standards.</li>
          <li><strong>Customer Satisfaction:</strong> Your satisfaction is our top priority. We are always here to help.</li>
          <li><strong>Integrity:</strong> We conduct our business with honesty and transparency.</li>
          <li><strong>Innovation:</strong> We continuously strive to improve and innovate our products and services.</li>
        </ul>

        <h2>Our Team</h2>
        <p>We have a dedicated team of professionals who are passionate about what they do. From product sourcing to customer support, we are here to serve you.</p>

        <h2>Contact Us</h2>
        <p>If you have any questions or comments, please feel free to contact us. We would love to hear from you!</p>
        <p>Email: support@millsmitra.com</p>
        <p>Phone: +91 98765 43210</p>
      </div>
    </div>
  );
};

export default AboutUs;
