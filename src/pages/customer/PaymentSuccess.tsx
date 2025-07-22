import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Handle payment success
        setTimeout(() => {
            navigate('/orders');
        }, 3000);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
                <p>Redirecting to orders...</p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
