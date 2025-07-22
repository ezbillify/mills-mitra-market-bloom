
import ImageUpload from "./ImageUpload";

interface ProductImageUploadProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
}

const ProductImageUpload = ({ currentImage, onImageChange }: ProductImageUploadProps) => {
  return (
    <ImageUpload
      currentImage={currentImage}
      onImageChange={onImageChange}
      label="Product Image"
      recommendedSize="Recommended size: 400x400px or larger"
      maxSizeText="Maximum file size: 5MB"
    />
  );
};

export default ProductImageUpload;
