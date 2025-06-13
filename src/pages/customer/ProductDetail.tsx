
import { useParams } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Product Detail</h1>
      <p className="text-gray-600 mt-2">Product ID: {id}</p>
      <p className="mt-4">Product detail page coming soon...</p>
    </div>
  );
};

export default ProductDetail;
