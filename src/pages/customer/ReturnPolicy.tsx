import React from 'react';

const ReturnPolicy = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Return Policy</h1>
      
      <p className="mb-4">
        Thank you for shopping at Mills Mitra. We want to ensure you are completely satisfied with your purchase. If you are not satisfied, you may return the product for a full refund or exchange, subject to the following conditions:
      </p>

      <ul className="list-disc pl-5 mb-4">
        <li>Returns must be initiated within 30 days of the delivery date.</li>
        <li>The product must be in its original condition, unused, and with all original packaging and tags.</li>
        <li>You must provide proof of purchase, such as the order number or receipt.</li>
        <li>Certain products are not eligible for return, including perishable goods, personalized items, and products marked as non-returnable.</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">How to Initiate a Return:</h2>
      <ol className="list-decimal pl-5 mb-4">
        <li>Contact our customer support team at support@millsmitra.com to request a return authorization.</li>
        <li>Pack the product securely in its original packaging.</li>
        <li>Include a copy of your proof of purchase and the return authorization number inside the package.</li>
        <li>Ship the package to the address provided by our customer support team.</li>
      </ol>

      <h2 className="text-xl font-semibold mb-2">Refund Process:</h2>
      <p className="mb-4">
        Once we receive the returned product and verify that it meets the return conditions, we will process your refund within 7-10 business days. The refund will be issued to the original payment method used for the purchase.
      </p>

      <h2 className="text-xl font-semibold mb-2">Exchanges:</h2>
      <p className="mb-4">
        If you would like to exchange a product, please indicate the desired replacement product when contacting our customer support team. Exchanges are subject to product availability.
      </p>

      <h2 className="text-xl font-semibold mb-2">Shipping Costs:</h2>
      <p className="mb-4">
        You are responsible for the shipping costs associated with returning the product. Shipping costs are non-refundable, unless the return is due to a defect or error on our part.
      </p>

      <h2 className="text-xl font-semibold mb-2">Damaged or Defective Products:</h2>
      <p className="mb-4">
        If you receive a damaged or defective product, please contact us immediately. We will arrange for a replacement or refund, and we will cover the return shipping costs.
      </p>

      <h2 className="text-xl font-semibold mb-2">Contact Us:</h2>
      <p className="mb-4">
        If you have any questions or concerns about our return policy, please contact our customer support team at support@millsmitra.com.
      </p>
    </div>
  );
};

export default ReturnPolicy;
