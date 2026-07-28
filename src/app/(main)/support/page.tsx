import React from 'react';
import { Metadata } from 'next';
import SupportContent from './SupportContent';

export const metadata: Metadata = {
  title: 'Support AcadMusic',
  description: 'Support the development of AcadMusic',
};

export default function SupportPage() {
  return <SupportContent />;
}
