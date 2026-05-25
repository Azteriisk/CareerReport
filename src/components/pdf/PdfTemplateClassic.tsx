import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';
import { PdfAtsMetadata } from './PdfAtsMetadata';

interface Props {
  data: ResumeData;
}

export const PdfTemplateClassic: React.FC<Props> = ({ data }) => {
  const fontScale = data.metadata?.fontSize || 1;

  const marginPtTB = (data.metadata?.pageMargin || 0.42) * 72;
  const marginPtLR = (data.metadata?.pageMarginLR ?? data.metadata?.pageMargin ?? 0.42) * 72;

  const styles: any = {
    page: {
      paddingTop: marginPtTB,
      paddingBottom: marginPtTB,
      paddingLeft: marginPtLR,
      paddingRight: marginPtLR,
      backgroundColor: '#ffffff',
      fontFamily: 'Helvetica',
    },
    header: {
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#000000',
      borderBottomStyle: 'solid',
      paddingBottom: 15,
      marginBottom: 20,
    },
    name: {
      fontSize: 24 * fontScale,
      fontWeight: 'bold',
      fontFamily: 'Times-Roman',
      color: '#000000',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    contactInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
    },
    contactText: {
      fontSize: 10 * fontScale,
      fontFamily: 'Times-Roman',
      color: '#000000',
    },
    section: {
    },
    sectionTitle: {
      fontSize: 12 * fontScale,
      fontWeight: 'bold',
      fontFamily: 'Times-Roman',
      color: '#000000',
      borderBottomWidth: 1,
      borderBottomColor: '#cccccc',
      borderBottomStyle: 'solid',
      paddingBottom: 3,
      marginBottom: 0,
      textTransform: 'uppercase',
    },
    sectionContent: {
      marginTop: 10,
      marginBottom: 15,
    },
    summaryText: {
      fontSize: 10 * fontScale,
      fontFamily: 'Times-Roman',
      color: '#000000',
      lineHeight: 1.5,
    },
    itemBlock: {
      marginBottom: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 11 * fontScale,
      fontWeight: 'bold',
      fontFamily: 'Times-Roman',
      color: '#000000',
    },
    itemDates: {
      fontSize: 10 * fontScale,
      fontFamily: 'Times-Roman',
      color: '#000000',
    },
    itemSubtitle: {
      fontSize: 10 * fontScale,
      fontStyle: 'italic',
      fontFamily: 'Times-Roman',
      color: '#000000',
      marginBottom: 4,
    },
    itemDescription: {
      fontSize: 10 * fontScale,
      fontFamily: 'Times-Roman',
      color: '#000000',
      lineHeight: 1.4,
      marginBottom: 4,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 2,
      paddingLeft: 10,
    },
    bulletDot: {
      width: 4,
      fontSize: 10 * fontScale,
      fontFamily: 'Times-Roman',
      color: '#000000',
      marginRight: 4,
    },
    bulletText: {
      fontSize: 10 * fontScale,
      fontFamily: 'Times-Roman',
      color: '#000000',
      lineHeight: 1.4,
      flex: 1,
    },
    skillsText: {
      fontSize: 10 * fontScale,
      fontFamily: 'Times-Roman',
      color: '#000000',
      lineHeight: 1.5,
      marginBottom: 4,
    },
  };

  return (
    <>
      <Page size="LETTER" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.basics.name}</Text>
          <View style={styles.contactInfo}>
            {data.basics.email && <Text style={styles.contactText}>{data.basics.email}</Text>}
            {data.basics.phone && <Text style={styles.contactText}>| {data.basics.phone}</Text>}
            {data.basics.location?.city && (
              <Text style={styles.contactText}>
                | {data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ''}
              </Text>
            )}
            {data.basics.url && <Text style={styles.contactText}>| {data.basics.url.replace(/^https?:\/\//, '')}</Text>}
          </View>
        </View>

        {/* Summary */}
        {data.basics.summary && (
          <Text style={styles.sectionTitle}>Professional Summary</Text>
        )}
        {data.basics.summary && (
          <View style={styles.sectionContent}>
            <Text style={styles.summaryText}>{data.basics.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.work.length > 0 && (
          <Text style={styles.sectionTitle}>Experience</Text>
        )}
        {data.work.length > 0 && (
          <View style={styles.sectionContent}>
            {data.work.map((job) => (
              <View key={job.id} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{job.position}</Text>
                  <Text style={styles.itemDates}>
                    {formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>{job.name}</Text>
                {job.summary && <Text style={styles.itemDescription}>{job.summary}</Text>}
                
                {job.highlights && job.highlights.length > 0 && (
                  <View>
                    {job.highlights.map((item, i) => {
                      if (item.trim() === '') return null;
                      return (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <Text style={styles.sectionTitle}>Education</Text>
        )}
        {data.education.length > 0 && (
          <View style={styles.sectionContent}>
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.institution}</Text>
                  <Text style={styles.itemDates}>
                    {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.studyType} in {edu.area}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <Text style={styles.sectionTitle}>Skills</Text>
        )}
        {data.skills.length > 0 && (
          <View style={styles.sectionContent}>
            {data.skills.map((skillGroup, idx) => (
              <Text key={idx} style={styles.skillsText} wrap={false}>
                <Text style={{ fontWeight: 'bold' }}>{skillGroup.name}: </Text>
                {skillGroup.keywords.join(', ')}
              </Text>
            ))}
          </View>
        )}

        {/* Invisible Machine-Readable ATS Payload */}
        <PdfAtsMetadata data={data} />
      </Page>
    </>
  );
};
