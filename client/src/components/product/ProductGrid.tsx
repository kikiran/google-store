import ProductCard from '@/components/product/ProductCard';
import type { ProductSummary } from '@/types';

export default function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
