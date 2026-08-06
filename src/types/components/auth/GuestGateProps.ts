export interface GuestGateProps {
  isOpen: boolean;
  onClose: () => void;
  /** The action user attempted, shown in the prompt */
  action?: string;
}
