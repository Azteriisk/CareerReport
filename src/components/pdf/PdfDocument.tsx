import React from 'react';
import { ResumeData } from '@/lib/resume-schema';
import { PdfTemplateModernSplit } from './PdfTemplateModernSplit';
import { PdfTemplateModern } from './PdfTemplateModern';
import { PdfTemplateClassic } from './PdfTemplateClassic';
import { PdfTemplateMinimal } from './PdfTemplateMinimal';

import { Document } from '@react-pdf/renderer';
import { PdfCoverLetterPage } from './PdfCoverLetterPage';

interface Props {
  data: ResumeData;
  template: string;
  includeCoverLetter?: boolean;
}

export const PdfDocument: React.FC<Props> = ({ data, template, includeCoverLetter }) => {
  // Determine which template to render
  const renderTemplate = () => {
    switch (template) {
      case 'modern-split':
        return <PdfTemplateModernSplit data={data} />;
      case 'modern':
        return <PdfTemplateModern data={data} />;
      case 'classic':
        return <PdfTemplateClassic data={data} />;
      case 'minimal':
        return <PdfTemplateMinimal data={data} />;
      default:
        return <PdfTemplateModernSplit data={data} />;
    }
  };

  // If includeCoverLetter is true, the template MUST NOT return its own <Document> tag.
  // Wait, if it does return <Document>, we can't wrap it.
  // Actually, wait, let's just use a React Fragment if we can't wrap it? No, react-pdf needs a single <Document> at the root.
  // Let's modify all templates to NOT return <Document>, and put <Document> here!
  return (
    <Document>
      {includeCoverLetter && <PdfCoverLetterPage data={data} />}
      {renderTemplate()}
    </Document>
  );
};
