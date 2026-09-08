import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem('nova_promo_dismissed') !== 'true');
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-ink-900 text-white text-sm">
      <div className="container-nova flex items-center justify-between py-2.5">
        <span>Free standard delivery on every order — Explore offers <span className="ml-1">→</span></span>
        <button
          onClick={() => {
            localStorage.setItem('nova_promo_dismissed', 'true');
            setVisible(false);
          }}
          className="p-1 hover:bg-ink-700 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
