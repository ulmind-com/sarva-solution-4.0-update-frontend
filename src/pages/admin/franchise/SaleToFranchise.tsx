import { useState } from 'react';
import FranchiseVerification, { type VerifiedFranchise } from '@/components/admin/sales/FranchiseVerification';
import ProductLookup, { type CartItem } from '@/components/admin/sales/ProductLookup';
import BillCart from '@/components/admin/sales/BillCart';

const SaleToFranchise = () => {
  const [verifiedFranchise, setVerifiedFranchise] = useState<VerifiedFranchise | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const handleFranchiseVerified = (franchise: VerifiedFranchise) => {
    setVerifiedFranchise(franchise);
  };

  const handleClearFranchise = () => {
    setVerifiedFranchise(null);
    setCart([]);
  };

  const handleAddToCart = (item: CartItem) => {
    const existingIndex = cart.findIndex((c) => c.productId === item.productId);
    
    if (existingIndex >= 0) {
      // Update quantity if product already in cart
      const newQuantity = cart[existingIndex].quantity + item.quantity;
      if (newQuantity > item.maxStock) {
        return; // Stock validation already handled in ProductLookup
      }
      setCart(
        cart.map((c, i) =>
          i === existingIndex ? { ...c, quantity: newQuantity } : c
        )
      );
    } else {
      setCart([...cart, item]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSaleComplete = () => {
    setVerifiedFranchise(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sale to Franchise</h1>
        <p className="text-muted-foreground">Process sales and generate invoices for franchise partners</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column - Verification & Product Lookup */}
        <div className="lg:col-span-3 space-y-6">
          <FranchiseVerification
            verifiedFranchise={verifiedFranchise}
            onVerified={handleFranchiseVerified}
            onClear={handleClearFranchise}
          />

          <ProductLookup
            onAddToCart={handleAddToCart}
            isDisabled={!verifiedFranchise}
          />
        </div>

        {/* Right Column - Bill Cart */}
        <div className="lg:col-span-2">
          <BillCart
            cart={cart}
            franchise={verifiedFranchise}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onSaleComplete={handleSaleComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default SaleToFranchise;
