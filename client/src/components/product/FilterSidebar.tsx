import { SlidersHorizontal } from 'lucide-react';
import { Select } from '@/components/ui/FormFields';
import type { Category } from '@/types';

interface FilterSidebarProps {
  categories: Category[];
  filters: { category?: string; minPrice?: string; maxPrice?: string; ratings?: string; availability?: string };
  sort: string;
  onChange: (patch: Record<string, string>) => void;
  onClear: () => void;
}

export function FilterSidebar({ categories, filters, sort, onChange, onClear }: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-ink-900 flex items-center gap-2">
          <SlidersHorizontal size={16} /> Filters
        </h3>
        <button onClick={onClear} className="text-sm text-brand-600 hover:text-brand-700">Clear all</button>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 mb-2 block">Category</label>
        <Select value={filters.category || ''} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 mb-2 block">Price range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="w-1/2 rounded-full border border-ink-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className="w-1/2 rounded-full border border-ink-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 mb-2 block">Rating</label>
        <Select value={filters.ratings || ''} onChange={(e) => onChange({ ratings: e.target.value })}>
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
          <option value="2">2+ stars</option>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 mb-2 block">Availability</label>
        <Select value={filters.availability || ''} onChange={(e) => onChange({ availability: e.target.value })}>
          <option value="">All</option>
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
        </Select>
      </div>
    </div>
  );
}

export function MobileFilters({ open, onClose, ...props }: FilterSidebarProps & { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto animate-slideUp">
        <FilterSidebar {...props} />
        <button onClick={onClose} className="mt-6 w-full py-2.5 bg-brand-600 text-white rounded-full text-sm font-medium">
          Show results
        </button>
      </div>
    </div>
  );
}
