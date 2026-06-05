'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200 dark:border-slate-800"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? '🌙' : '☀️'}
    </Button>
  );
}