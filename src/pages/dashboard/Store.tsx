import { useState } from 'react';
import { products, Product } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShoppingCart, Check, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';

const Store = () => {
  const { currentUser, updateUserBalance, addTransaction } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = filter === 'All' 
    ? products 
    : products.filter(p => p.category === filter);

  const handlePurchase = async () => {
    if (!selectedProduct || !currentUser) return;

    if (currentUser.balance < selectedProduct.price) {
      toast.error('Insufficient balance! Please top up your wallet.');
      setSelectedProduct(null);
      return;
    }

    setIsPurchasing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    updateUserBalance(-selectedProduct.price);
    addTransaction({
      userId: currentUser.id,
      type: 'purchase',
      amount: selectedProduct.price,
      status: 'completed',
      date: new Date().toISOString().split('T')[0],
      description: `Purchased ${selectedProduct.name}`
    });
    
    setIsPurchasing(false);
    setSelectedProduct(null);
    
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Purchase successful! You earned {selectedProduct.pv} PV</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Store</h1>
          <p className="text-muted-foreground">Purchase products to earn PV and grow your network</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Balance:</span>
          <span className="font-bold text-foreground">₹{currentUser?.balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={filter === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="border-border overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="aspect-square relative overflow-hidden bg-muted">
              <img 
                src={typeof product.image === 'string' ? product.image : (product.image as { url?: string })?.url || '/placeholder.svg'} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                {product.pv} PV
              </Badge>
            </div>
            <CardContent className="p-4">
              <Badge variant="outline" className="mb-2 text-xs">
                {product.category}
              </Badge>
              <h3 className="font-semibold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-chart-4 text-chart-4" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">(4.8)</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">
                ₹{product.price.toLocaleString()}
              </span>
              <Button 
                size="sm"
                onClick={() => setSelectedProduct(product)}
                className="gap-1"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Purchase</DialogTitle>
            <DialogDescription>
              You're about to purchase this product from your wallet balance.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="flex gap-4 py-4">
              <img 
                src={typeof selectedProduct.image === 'string' ? selectedProduct.image : (selectedProduct.image as { url?: string })?.url || '/placeholder.svg'} 
                alt={selectedProduct.name}
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{selectedProduct.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-bold text-foreground">₹{selectedProduct.price.toLocaleString()}</span>
                  <Badge className="bg-primary text-primary-foreground">+{selectedProduct.pv} PV</Badge>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-accent p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="text-foreground">₹{currentUser?.balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">After Purchase</span>
              <span className="font-medium text-accent-foreground">
                ₹{((currentUser?.balance || 0) - (selectedProduct?.price || 0)).toLocaleString()}
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={isPurchasing}>
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Purchase'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Store;
