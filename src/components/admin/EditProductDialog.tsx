import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { updateProduct } from '@/services/adminService';

interface Product {
  _id: string;
  productName?: string;
  name?: string;
  price: number;
  mrp?: number;
  description: string;
  category?: string;
  segment?: string;
  stockQuantity?: number;
  stockCount?: number;
  cgst?: number;
  sgst?: number;
  hsnCode?: string;
  productDP?: number;
  bv?: number;
  pv?: number;
  discount?: number;
  isFeatured?: boolean;
  isActivationPackage?: boolean;
  isActive?: boolean;
  productImage?: { url: string; public_id?: string };
  image?: { url: string; publicId?: string };
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

const CATEGORIES = ['aquaculture', 'agriculture', 'personal care', 'health care', 'home care', 'luxury goods', 'offer package'];

const EditProductDialog = ({ open, onOpenChange, product, onSuccess }: EditProductDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: '',
    price: '',
    mrp: '',
    productDP: '',
    bv: '',
    pv: '',
    stockQuantity: '',
    discount: '',
    cgst: '',
    sgst: '',
    hsnCode: '',
    isFeatured: false,
    isActivationPackage: false,
    isActive: true,
  });

  useEffect(() => {
    if (product && open) {
      setFormData({
        productName: product.productName || product.name || '',
        description: product.description || '',
        category: product.category || product.segment || '',
        price: String(product.price || ''),
        mrp: String(product.mrp || ''),
        productDP: String(product.productDP || ''),
        bv: String(product.bv || ''),
        pv: String(product.pv || ''),
        stockQuantity: String(product.stockQuantity ?? product.stockCount ?? ''),
        discount: String(product.discount || ''),
        cgst: String(product.cgst || ''),
        sgst: String(product.sgst || ''),
        hsnCode: product.hsnCode || '',
        isFeatured: product.isFeatured || false,
        isActivationPackage: product.isActivationPackage || false,
        isActive: product.isActive !== false,
      });
      setImagePreview(product.productImage?.url || product.image?.url || null);
      setSelectedFile(null);
    }
  }, [product, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!product) return;
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('productName', formData.productName);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('mrp', formData.mrp);
      data.append('productDP', formData.productDP);
      data.append('bv', formData.bv);
      data.append('pv', formData.pv);
      data.append('stockQuantity', formData.stockQuantity);

      if (formData.discount) data.append('discount', formData.discount);
      if (formData.cgst) data.append('cgst', formData.cgst);
      if (formData.sgst) data.append('sgst', formData.sgst);
      if (formData.hsnCode) data.append('hsnCode', formData.hsnCode);

      data.append('isFeatured', String(formData.isFeatured));
      data.append('isActivationPackage', String(formData.isActivationPackage));
      data.append('isActive', String(formData.isActive));

      if (selectedFile) {
        data.append('productImage', selectedFile, selectedFile.name);
      }

      await updateProduct(product._id, data);
      toast.success('Product updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update the product details below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-lg object-cover border" />
            )}
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">Leave empty to keep current image</p>
          </div>

          {/* Name & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input id="productName" name="productName" value={formData.productName} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
            </div>
          </div>

          {/* Category & HSN */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input id="hsnCode" name="hsnCode" value={formData.hsnCode} onChange={handleInputChange} />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input id="mrp" name="mrp" type="number" min="0" value={formData.mrp} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productDP">DP (₹)</Label>
              <Input id="productDP" name="productDP" type="number" min="0" value={formData.productDP} onChange={handleInputChange} />
            </div>
          </div>

          {/* BV, PV, Stock, Discount */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bv">BV</Label>
              <Input id="bv" name="bv" type="number" min="0" value={formData.bv} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pv">PV</Label>
              <Input id="pv" name="pv" type="number" min="0" value={formData.pv} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock</Label>
              <Input id="stockQuantity" name="stockQuantity" type="number" min="0" value={formData.stockQuantity} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input id="discount" name="discount" type="number" min="0" value={formData.discount} onChange={handleInputChange} />
            </div>
          </div>

          {/* Taxation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cgst">CGST (%)</Label>
              <Input id="cgst" name="cgst" type="number" min="0" step="0.01" value={formData.cgst} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sgst">SGST (%)</Label>
              <Input id="sgst" name="sgst" type="number" min="0" step="0.01" value={formData.sgst} onChange={handleInputChange} />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={(v) => setFormData((p) => ({ ...p, isActive: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isFeatured">Featured</Label>
              <Switch id="isFeatured" checked={formData.isFeatured} onCheckedChange={(v) => setFormData((p) => ({ ...p, isFeatured: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActivationPackage">Activation Package</Label>
              <Switch id="isActivationPackage" checked={formData.isActivationPackage} onCheckedChange={(v) => setFormData((p) => ({ ...p, isActivationPackage: v }))} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
