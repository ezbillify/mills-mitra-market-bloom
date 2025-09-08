import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Upload, Star, StarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductImage } from "@/types/product";

interface MultipleImageUploadProps {
  productId?: string; // For editing existing products
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

interface PendingImage {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  display_order: number;
  is_primary: boolean;
}

const MultipleImageUpload = ({ 
  productId, 
  images, 
  onImagesChange, 
  maxImages = 5 
}: MultipleImageUploadProps) => {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // Convert ProductImage to display format
  const existingImages = images.map(img => ({
    id: img.id,
    url: img.image_url,
    is_primary: img.is_primary,
    display_order: img.display_order,
    uploaded: true,
    uploading: false
  }));

  const allImages = [
    ...existingImages,
    ...pendingImages.map(img => ({
      id: img.id,
      url: img.preview,
      is_primary: img.is_primary,
      display_order: img.display_order,
      uploaded: false,
      uploading: img.uploading
    }))
  ].sort((a, b) => a.display_order - b.display_order);

  const handleFileSelect = (files: FileList) => {
    const totalImages = allImages.length;
    const availableSlots = maxImages - totalImages;
    
    if (availableSlots <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images`,
        variant: "destructive",
      });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    const newPendingImages: PendingImage[] = [];

    filesToProcess.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select only image files",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select images smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const id = `pending-${Date.now()}-${index}`;
      const preview = URL.createObjectURL(file);
      const display_order = totalImages + index;
      const is_primary = totalImages === 0 && index === 0; // First image is primary

      newPendingImages.push({
        id,
        file,
        preview,
        uploading: false,
        display_order,
        is_primary
      });
    });

    setPendingImages(prev => [...prev, ...newPendingImages]);
  };

  const uploadImage = async (pendingImage: PendingImage) => {
    setPendingImages(prev => 
      prev.map(img => 
        img.id === pendingImage.id ? { ...img, uploading: true } : img
      )
    );

    try {
      const fileExt = pendingImage.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, pendingImage.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // If we have a productId, save to database immediately
      if (productId) {
        const { data: newImage, error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: publicUrl,
            display_order: pendingImage.display_order,
            is_primary: pendingImage.is_primary
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Add to images array
        const updatedImages = [...images, newImage];
        onImagesChange(updatedImages);
      } else {
        // For new products, create a temporary ProductImage object
        const tempImage: ProductImage = {
          id: `temp-${Date.now()}`,
          product_id: '',
          image_url: publicUrl,
          display_order: pendingImage.display_order,
          is_primary: pendingImage.is_primary,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const updatedImages = [...images, tempImage];
        onImagesChange(updatedImages);
      }

      // Remove from pending
      setPendingImages(prev => prev.filter(img => img.id !== pendingImage.id));
      URL.revokeObjectURL(pendingImage.preview);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      setPendingImages(prev => 
        prev.map(img => 
          img.id === pendingImage.id ? { ...img, uploading: false } : img
        )
      );
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removePendingImage = (imageId: string) => {
    const imageToRemove = pendingImages.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
      setPendingImages(prev => prev.filter(img => img.id !== imageId));
    }
  };

  const removeUploadedImage = async (imageId: string) => {
    if (!productId) {
      // For new products, just remove from array
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);
      return;
    }

    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);

      toast({
        title: "Success",
        description: "Image removed successfully",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  const setPrimaryImage = async (imageId: string, isUploaded: boolean) => {
    if (isUploaded && productId) {
      try {
        // First, unset all primary flags
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);

        // Then set the selected image as primary
        await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', imageId);

        // Update local state
        const updatedImages = images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }));
        onImagesChange(updatedImages);

        toast({
          title: "Success",
          description: "Primary image updated",
        });
      } catch (error) {
        console.error('Primary update error:', error);
        toast({
          title: "Error",
          description: "Failed to update primary image",
          variant: "destructive",
        });
      }
    } else {
      // For pending images or new products
      if (isUploaded) {
        const updatedImages = images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }));
        onImagesChange(updatedImages);
      } else {
        setPendingImages(prev =>
          prev.map(img => ({
            ...img,
            is_primary: img.id === imageId
          }))
        );
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Product Images (Max {maxImages})</Label>
      
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent 
          className="p-6 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop images here, or click to select
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  Choose Images
                </label>
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Supported: JPG, PNG, GIF • Max 5MB each • {allImages.length}/{maxImages} images
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allImages.map((img) => (
            <Card key={img.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={img.url}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Loading overlay */}
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}

                  {/* Primary badge */}
                  {img.is_primary && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-white"
                      onClick={() => setPrimaryImage(img.id, img.uploaded)}
                      title={img.is_primary ? "Remove as primary" : "Set as primary"}
                    >
                      {img.is_primary ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-white text-red-600 hover:bg-red-50"
                      onClick={() => img.uploaded ? removeUploadedImage(img.id) : removePendingImage(img.id)}
                      disabled={img.uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-600">
                    Order: {img.display_order + 1}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending uploads */}
      {pendingImages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pending Uploads</Label>
          <div className="space-y-2">
            {pendingImages.map((img) => (
              <div key={img.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <img
                  src={img.preview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{img.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(img.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => uploadImage(img)}
                    disabled={img.uploading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {img.uploading ? "Uploading..." : "Upload"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removePendingImage(img.id)}
                    disabled={img.uploading}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;
