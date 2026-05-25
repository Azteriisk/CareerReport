import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/resume-schema';

interface Props {
  data: ResumeData;
}

const styles = StyleSheet.create({
  page: {
    padding: 54, // ~0.75 inch margins
    fontFamily: 'Times-Roman', // Built-in serif font
    fontSize: 11,
    lineHeight: 1.5,
    color: '#000000',
  },
  header: {
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 15,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    color: '#111111',
  },
  contactLine: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#555555',
  },
  date: {
    marginBottom: 20,
  },
  recipientInfo: {
    marginBottom: 20,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  signOff: {
    marginTop: 30,
  },
  signOffName: {
    marginTop: 40,
    fontFamily: 'Helvetica-Bold',
  }
});

export const PdfCoverLetterPage: React.FC<Props> = ({ data }) => {
  // Find the active cover letter
  const activeId = data.metadata?.activeCoverLetterId;
  const activeLetter = activeId 
    ? data.coverLetters?.find(c => c.id === activeId)
    : data.coverLetters?.[0];
    
  // Fallback to legacy coverLetter if no coverLetters array exists
  const letterData = activeLetter || data.coverLetter;

  if (!letterData || !letterData.content) {
    return null; // Don't render a page if there is no content
  }

  // Format today's date
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Build contact string
  const contacts = [
    data.basics.email,
    data.basics.phone,
    data.basics.location?.city ? `${data.basics.location.city}${data.basics.location.region ? `, ${data.basics.location.region}` : ''}` : '',
    data.basics.url ? data.basics.url.replace(/^https?:\/\//, '') : ''
  ].filter(Boolean).join('  |  ');

  // Split content into paragraphs
  const paragraphs = letterData.content.split('\n').filter(p => p.trim() !== '');

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{data.basics.name}</Text>
        {contacts && <Text style={styles.contactLine}>{contacts}</Text>}
      </View>

      <View style={styles.date}>
        <Text>{today}</Text>
      </View>

      <View style={styles.recipientInfo}>
        <Text>Hiring Manager</Text>
        {letterData.company && <Text>{letterData.company}</Text>}
        {letterData.jobTitle && <Text>{letterData.jobTitle}</Text>}
      </View>

      {paragraphs.map((para, idx) => (
        <Text key={idx} style={styles.paragraph}>{para}</Text>
      ))}
    </Page>
  );
};
