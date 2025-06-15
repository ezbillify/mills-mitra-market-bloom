import React from 'react';

const ShippingPolicy = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Shipping Policy</h1>
      
      <p className="mb-4">
        Thank you for shopping at Mills Mitra. This Shipping Policy outlines our procedures for shipping your orders.
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Processing Time</h2>
        <p>
          Orders are typically processed within 1-2 business days. Processing occurs Monday through Friday, excluding holidays.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Shipping Rates & Delivery Estimates</h2>
        <p>
          Shipping rates are calculated at checkout based on the weight of your order and the destination. Delivery estimates are provided at checkout and are estimates only.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Shipping Destinations</h2>
        <p>
          We currently ship to addresses within India. We are working to expand our shipping destinations in the future.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Shipment Confirmation & Order Tracking</h2>
        <p>
          You will receive a shipment confirmation email once your order has shipped, containing your tracking number(s). The tracking number will be active within 24 hours.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Customs, Duties, and Taxes</h2>
        <p>
          Mills Mitra is not responsible for any customs duties, taxes, or fees applied to your order. All fees imposed during or after shipping are the responsibility of the customer.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Damages</h2>
        <p>
          Mills Mitra is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier or our support team directly to file a claim. Please save all packaging material and damaged goods before filing a claim.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Returns Policy</h2>
        <p>
          Our Return & Refund Policy provides detailed information about options and procedures for returning your order.
        </p>
      </section>
    </div>
  );
};

export default ShippingPolicy;
