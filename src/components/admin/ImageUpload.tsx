
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
  maxSizeText?: string;
  recommendedSize?: string;
}

const ImageUpload = ({ 
  currentImage, 
  onImageChange, 
  label = "Image",
  maxSizeText = "Maximum file size: 5MB",
  recommendedSize = "Recommended size: 400x400px or larger"
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(currentImage);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;
      setImagePreview(imageUrl);
      onImageChange(imageUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const clearImage = async () => {
    if (imagePreview && imagePreview.includes('product-images')) {
      try {
        // Extract filename from URL for deletion
        const urlParts = imagePreview.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from('product-images')
          .remove([fileName]);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    setImagePreview("");
    onImageChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{label}</Label>
        
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            <Image className="mx-auto h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500">{maxSizeText}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Choose File"}
            </Button>
          </div>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Current Image:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearImage}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <img
            src={imagePreview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• {recommendedSize}</p>
        <p>• Supported formats: JPG, PNG, WebP</p>
        <p>• {maxSizeText}</p>
      </div>
    </div>
  );
};

export default ImageUpload;
