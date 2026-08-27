import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

const categories = [
  'health care',
  'aquaculture',
  'agriculture',
  'personal care',
  'home care',
  'luxury goods',
  'offer package',
];

const AddProduct = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    mrp: '',
    category: '',
    stockQuantity: '',
    productDP: '',   // Dealer Price
    bv: '',          // Business Volume
    pv: '',          // Point Value
    cgst: '',
    sgst: '',
    hsnCode: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      description: '',
      price: '',
      mrp: '',
      category: '',
      stockQuantity: '',
      productDP: '',
      bv: '',
      pv: '',
      cgst: '',
      sgst: '',
      hsnCode: '',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields including new ones
    if (!formData.productName || !formData.description || !formData.price || !formData.mrp || !formData.category || !formData.stockQuantity || !formData.productDP || !formData.bv || !formData.pv) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a product image');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Text fields
      submitData.append('productName', formData.productName);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      if (formData.hsnCode) submitData.append('hsnCode', formData.hsnCode);
      
      // Numeric fields (required)
      submitData.append('price', formData.price);
      submitData.append('mrp', formData.mrp);
      submitData.append('stockQuantity', formData.stockQuantity);
      
      // NEW: Business fields (required)
      submitData.append('productDP', formData.productDP);
      submitData.append('bv', formData.bv);
      submitData.append('pv', formData.pv);
      
      // Tax fields (optional)
      if (formData.cgst) submitData.append('cgst', formData.cgst);
      if (formData.sgst) submitData.append('sgst', formData.sgst);
      
      // Binary file
      submitData.append('productImage', imageFile, imageFile.name);

      await api.post('/api/v1/admin/product/create', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Product created successfully');
      resetForm();
      navigate('/admin/products/list');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product in your inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </CardTitle>
              <CardDescription>Enter the basic product information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input
                  id="hsnCode"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleInputChange}
                  placeholder="e.g., 1234"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Business */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Business</CardTitle>
              <CardDescription>Set product pricing, dealer price, and business volume</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mrp">MRP (₹) *</Label>
                  <Input
                    id="mrp"
                    name="mrp"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    placeholder="Maximum retail price"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price (₹) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Selling price"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productDP">Dealer Price (₹) *</Label>
                  <Input
                    id="productDP"
                    name="productDP"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.productDP}
                    onChange={handleInputChange}
                    placeholder="DP"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bv">Business Volume (BV) *</Label>
                  <Input
                    id="bv"
                    name="bv"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bv}
                    onChange={handleInputChange}
                    placeholder="BV"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pv">Point Value (PV) *</Label>
                  <Input
                    id="pv"
                    name="pv"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pv}
                    onChange={handleInputChange}
                    placeholder="PV"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Initial Stock *</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  placeholder="Quantity in stock"
                  required
                />
              </div>

              {/* Taxation Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-medium text-foreground">Taxation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cgst">CGST (%)</Label>
                    <Input
                      id="cgst"
                      name="cgst"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cgst}
                      onChange={handleInputChange}
                      placeholder="e.g., 9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sgst">SGST (%)</Label>
                    <Input
                      id="sgst"
                      name="sgst"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.sgst}
                      onChange={handleInputChange}
                      placeholder="e.g., 9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Image *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors">
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload image</span>
                      <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                  {imageFile && !imagePreview && (
                    <p className="text-sm text-muted-foreground mt-2">Selected: {imageFile.name}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
