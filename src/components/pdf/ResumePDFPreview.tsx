'use client';

import React, { useEffect, useState } from 'react';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/resume-schema';
import { PdfDocument } from './PdfDocument';

interface Props {
  data: ResumeData;
  template: string;
  includeCoverLetter?: boolean;
}

export default function ResumePDFPreview({ data, template, includeCoverLetter }: Props) {
  const [mounted, setMounted] = useState(false);
  const [debouncedData, setDebouncedData] = useState(data);
  const [debouncedTemplate, setDebouncedTemplate] = useState(template);
  const [debouncedIncludeCoverLetter, setDebouncedIncludeCoverLetter] = useState(includeCoverLetter);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce the heavy PDF generation to stop the iframe from flashing on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedData(data);
      setDebouncedTemplate(template);
      setDebouncedIncludeCoverLetter(includeCoverLetter);
    }, 750);

    return () => clearTimeout(handler);
  }, [data, template, includeCoverLetter]);

  if (!mounted) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading PDF Preview...</div>;
  }

  return (
    <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
      <PdfDocument data={debouncedData} template={debouncedTemplate} includeCoverLetter={debouncedIncludeCoverLetter} />
    </PDFViewer>
  );
}

// Helper function to generate PDF blob programmatically
export const generatePdfBlob = async (data: ResumeData, template: string, includeCoverLetter?: boolean) => {
  const doc = <PdfDocument data={data} template={template} includeCoverLetter={includeCoverLetter} />;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};
