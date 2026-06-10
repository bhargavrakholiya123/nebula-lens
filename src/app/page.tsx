import ArchitectureCanvas from '../components/canvas/ArchitectureCanvas';
import ProductTour from '@/components/ui/ProductTour';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';

export default function Home() {
  return (
    <main>
      <ArchitectureCanvas />
      <ProductTour />
      <KeyboardShortcuts />
    </main>
  );
}