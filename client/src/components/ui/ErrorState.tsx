import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 text-red-300"><AlertTriangle size={48} /></div>
      <h3 className="text-lg font-medium text-ink-900 mb-1">{title}</h3>
      {message && <p className="text-sm text-ink-500 mb-4 max-w-sm">{message}</p>}
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}
