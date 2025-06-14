
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

interface ProductImageUploadProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
}

const ProductImageUpload = ({ currentImage, onImageChange }: ProductImageUploadProps) => {
  const [imagePreview, setImagePreview] = useState(currentImage);
  const [imageUrl, setImageUrl] = useState(currentImage);

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
    onImageChange(url);
  };

  const clearImage = () => {
    setImageUrl("");
    setImagePreview("");
    onImageChange("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Product Image</Label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
          {imageUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {imagePreview && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
          <img
            src={imagePreview}
            alt="Product preview"
            className="w-32 h-32 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>• Recommended size: 400x400px or larger</p>
        <p>• Supported formats: JPG, PNG, WebP</p>
        <p>• Maximum file size: 5MB</p>
      </div>
    </div>
  );
};

export default ProductImageUpload;
