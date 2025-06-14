
interface CustomerData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export const generateCustomerName = (customer: CustomerData): string => {
  console.log(`🎯 generateCustomerName called with data:`, customer);
  
  // If we have both first and last name, use them
  if (customer.first_name && customer.last_name) {
    const fullName = `${customer.first_name} ${customer.last_name}`;
    console.log(`✅ Using full name: "${fullName}"`);
    return fullName;
  }
  
  // If we have just first name, use it
  if (customer.first_name) {
    console.log(`✅ Using first name only: "${customer.first_name}"`);
    return customer.first_name;
  }
  
  // If we have just last name, use it
  if (customer.last_name) {
    console.log(`✅ Using last name only: "${customer.last_name}"`);
    return customer.last_name;
  }
  
  // If we have email, use the part before @
  if (customer.email && customer.email !== 'No email provided') {
    const emailName = customer.email.split('@')[0];
    console.log(`✅ Using email-derived name: "${emailName}"`);
    return emailName;
  }
  
  // Fallback to customer ID
  const fallbackName = `Customer ${customer.id.substring(0, 8)}`;
  console.log(`🔄 Using fallback name: "${fallbackName}"`);
  return fallbackName;
};

export const getCustomerEmail = (customer: CustomerData): string => {
  return customer.email && customer.email !== 'No email provided' ? customer.email : 'No email';
};
