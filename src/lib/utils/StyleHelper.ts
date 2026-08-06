import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export class StyleHelper {
  static cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
}
