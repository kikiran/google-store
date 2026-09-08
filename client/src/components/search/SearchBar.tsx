import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import clsx from 'clsx';

interface SearchBarProps {
  autoFocus?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  onNavigate?: () => void;
}

export default function SearchBar({ autoFocus, size = 'md', className, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      const res = await api.get('/search/suggestions', { params: { q: query } });
      return res.data.data as string[];
    },
    enabled: query.length >= 2 && focused,
    staleTime: 30_000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onNavigate?.();
      setFocused(false);
    }
  };

  const handleSelect = (value: string) => {
    setQuery(value);
    navigate(`/search?q=${encodeURIComponent(value)}`);
    onNavigate?.();
    setFocused(false);
  };

  return (
    <div className={clsx('relative', className)}>
      <form onSubmit={handleSubmit} role="search" className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <Search size={size === 'sm' ? 16 : 18} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          autoFocus={autoFocus}
          placeholder="Search Nova Store..."
          role="combobox"
          aria-expanded={focused && (suggestions?.length ?? 0) > 0}
          aria-label="Search products"
          className={clsx(
            'w-full rounded-full bg-ink-50 border border-transparent focus:bg-white focus:border-ink-300 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 transition-all pl-10 pr-4',
            size === 'sm' ? 'py-2 text-sm' : 'py-2.5 text-sm',
          )}
        />
      </form>

      {focused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-ink-100 py-3 animate-fadeIn z-50">
          {suggestions && suggestions.length > 0 ? (
            <ul role="listbox">
              {suggestions.map((s) => (
                <li
                  key={s}
                  role="option"
                  onMouseDown={() => handleSelect(s)}
                  className="px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 cursor-pointer"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2">
              <p className="text-xs text-ink-400 mb-2">Popular</p>
              <div className="flex gap-2 flex-wrap">
                {['Phones', 'Watches', 'Earbuds'].map((tag) => (
                  <button
                    key={tag}
                    onMouseDown={() => handleSelect(tag)}
                    className="px-3 py-1 bg-ink-50 rounded-full text-xs text-ink-600 hover:bg-ink-100"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
