import { useState, useRef } from 'react';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: () => void;
}

const SEGMENTS = [
  { value: 'health care', label: 'Health Care' },
  { value: 'aquaculture', label: 'Aquaculture' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'personal care', label: 'Personal Care' },
  { value: 'home care', label: 'Home Care' },
  { value: 'luxury goods', label: 'Luxury Goods' },
  { value: 'offer package', label: 'Offer Package' },
];

const AddProductModal = ({ open, onOpenChange, onProductCreated }: AddProductModalProps) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [bv, setBv] = useState('');
  const [description, setDescription] = useState('');
  const [segment, setSegment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please select a valid image file (PNG, JPG, or JPEG)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeImage = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setBv('');
    setDescription('');
    setSegment('');
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!bv || parseFloat(bv) <= 0) {
      toast.error('Please enter a valid BV');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!segment) {
      toast.error('Please select a product segment');
      return;
    }
    if (!file) {
      toast.error('Please upload a product image');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('price', price);
      formData.append('bv', bv);
      formData.append('description', description.trim());
      formData.append('segment', segment);
      formData.append('productImage', file);

      await api.post('/api/v1/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Product created successfully!');
      resetForm();
      onOpenChange(false);
      onProductCreated();
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create product. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isSubmitting) {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the product details below. All fields are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              disabled={isSubmitting}
            />
          </div>

          {/* Price and BV in grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bv">Business Volume (BV)</Label>
              <Input
                id="bv"
                type="number"
                min="0"
                step="0.01"
                value={bv}
                onChange={(e) => setBv(e.target.value)}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Segment Select */}
          <div className="space-y-2">
            <Label htmlFor="segment">Product Segment</Label>
            <Select value={segment} onValueChange={setSegment} disabled={isSubmitting}>
              <SelectTrigger id="segment">
                <SelectValue placeholder="Select a segment" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((seg) => (
                  <SelectItem key={seg.value} value={seg.value}>
                    {seg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG (max 5MB)</p>
                  </div>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
