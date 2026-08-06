export interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number } | null;
  mobileHeader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
