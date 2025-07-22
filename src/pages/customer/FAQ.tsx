import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-medium">
              How do I place an order?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              To place an order, browse our products, add items to your cart, and proceed to checkout. 
              You'll need to create an account or log in, provide shipping details, and complete payment.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-medium">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              We accept credit/debit cards, UPI payments, net banking, and cash on delivery for eligible orders.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-medium">
              How long will it take to receive my order?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Delivery times vary based on your location. Typically, orders are delivered within 3-7 business days.
              You can track your order status in the "My Orders" section of your account.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-medium">
              What is your return policy?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              We accept returns within 7 days of delivery for most products. Items must be unused and in their
              original packaging. Please visit our Return Policy page for more details.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-medium">
              Do you offer wholesale pricing?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Yes, we offer wholesale pricing for bulk orders. Please contact our customer service team
              at wholesale@millsmitra.com for more information and pricing details.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-medium">
              How can I track my order?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              You can track your order by logging into your account and visiting the "My Orders" section.
              You'll find tracking information and delivery status for all your orders.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg font-medium">
              What if I receive a damaged product?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              If you receive a damaged product, please contact our customer service within 48 hours of delivery.
              Include photos of the damaged item and packaging, and we'll arrange a replacement or refund.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-medium">
              Can I modify or cancel my order?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Orders can be modified or canceled within 1 hour of placement. After that, if the order has not
              been shipped, you may contact customer service to request changes, but we cannot guarantee that
              all requests can be accommodated.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="max-w-3xl mx-auto mt-8 text-center">
        <p className="text-gray-600">
          Can't find the answer you're looking for? Contact our customer support team at{" "}
          <a href="mailto:support@millsmitra.com" className="text-primary hover:underline">
            support@millsmitra.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default FAQ;
