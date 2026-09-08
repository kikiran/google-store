import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

interface AddToCartButtonProps {
  variantId: number;
  className?: string;
}

export function AddToCartButton({ variantId, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(variantId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (added) {
    return (
      <Button variant="secondary" fullWidth className={className} disabled>
        <Check size={16} className="mr-2" />
        Added
      </Button>
    );
  }

  return (
    <Button fullWidth onClick={handleAdd} className={className}>
      Add to cart
    </Button>
  );
}
