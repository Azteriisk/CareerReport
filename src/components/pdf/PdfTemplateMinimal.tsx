import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';
import { PdfAtsMetadata } from './PdfAtsMetadata';

interface Props {
  data: ResumeData;
}

const getLightBackground = (hex: string) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return '#fafafa';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Extremely light tint: 5% of theme color, 95% of #fafafa (250, 250, 250)
  const bgR = Math.round(r * 0.05 + 250 * 0.95);
  const bgG = Math.round(g * 0.05 + 250 * 0.95);
  const bgB = Math.round(b * 0.05 + 250 * 0.95);
  return `rgb(${bgR}, ${bgG}, ${bgB})`;
};

export const PdfTemplateMinimal: React.FC<Props> = ({ data }) => {
  const fontScale = data.metadata?.fontSize || 1;
  const themeColor = data.metadata?.themeColor || '#111827';
  const sidebarBg = getLightBackground(themeColor);
  const marginPt = (data.metadata?.pageMargin || 0.42) * 72;

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'row',
      backgroundColor: '#ffffff',
      fontFamily: 'Helvetica',
    },
    sidebar: {
      width: '30%',
      backgroundColor: sidebarBg,
      paddingTop: marginPt,
      paddingRight: 20,
      paddingBottom: marginPt,
      paddingLeft: 30,
      borderRightWidth: 1,
      borderRightColor: '#eaeaea',
      borderRightStyle: 'solid',
    },
    main: {
      width: '70%',
      paddingTop: marginPt,
      paddingRight: 40,
      paddingBottom: marginPt,
      paddingLeft: 30,
    },
    // Sidebar styles
    imageContainer: {
      width: 100 * fontScale,
      height: 100 * fontScale,
      borderRadius: 50 * fontScale,
      marginBottom: 20,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    name: {
      fontSize: 28 * fontScale,
      fontWeight: 'light',
      color: themeColor,
      marginBottom: 20,
      lineHeight: 1.1,
    },
    contactInfo: {
      marginBottom: 30,
    },
    contactText: {
      fontSize: 10 * fontScale,
      color: '#666666',
      marginBottom: 5,
    },
    sidebarSectionTitle: {
      fontSize: 10 * fontScale,
      fontWeight: 'bold',
      color: themeColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    skillGroup: {
      marginBottom: 10,
    },
    skillGroupName: {
      fontSize: 10 * fontScale,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 2,
    },
    skillGroupKeywords: {
      fontSize: 10 * fontScale,
      color: '#666666',
    },
    // Main column styles
    label: {
      fontSize: 16 * fontScale,
      color: themeColor,
      marginBottom: 20,
    },
    summaryText: {
      fontSize: 11 * fontScale,
      color: '#111827',
      lineHeight: 1.6,
      marginBottom: 30,
    },
    section: {
    },
    sectionTitle: {
      fontSize: 10 * fontScale,
      fontWeight: 'bold',
      color: themeColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 0,
    },
    sectionContent: {
      marginTop: 15,
      marginBottom: 30,
    },
    jobBlock: {
      marginBottom: 20,
    },
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    jobCompany: {
      fontSize: 12 * fontScale,
      fontWeight: 'bold',
      color: '#111827',
    },
    jobDates: {
      fontSize: 10 * fontScale,
      color: '#888888',
    },
    jobPosition: {
      fontSize: 11 * fontScale,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 6,
    },
    jobSummary: {
      fontSize: 10 * fontScale,
      color: '#444444',
      marginBottom: 6,
      lineHeight: 1.4,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    bulletDot: {
      width: 10,
      fontSize: 10 * fontScale,
      color: '#555555',
    },
    bulletText: {
      flex: 1,
      fontSize: 10 * fontScale,
      color: '#555555',
      lineHeight: 1.4,
    },
    eduBlock: {
      marginBottom: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    eduLeft: {
      flex: 1,
      paddingRight: 15,
    },
    eduInstitution: {
      fontSize: 11 * fontScale,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 2,
    },
    eduStudyType: {
      fontSize: 11 * fontScale,
      color: '#444444',
      fontWeight: 'bold',
      marginBottom: 2,
    },
    eduArea: {
      fontSize: 11 * fontScale,
      color: '#666666',
      fontStyle: 'italic',
      fontWeight: 'bold',
    },
    eduDates: {
      fontSize: 10 * fontScale,
      color: '#888888',
    },
    projBlock: {
      marginBottom: 15,
    },
    projHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    projName: {
      fontSize: 11 * fontScale,
      fontWeight: 'bold',
      color: '#111827',
    },
    projUrl: {
      fontSize: 9 * fontScale,
      color: '#666666',
    },
    projDesc: {
      fontSize: 10 * fontScale,
      color: '#444444',
      lineHeight: 1.4,
    },
    refBlock: {
      marginBottom: 15,
    },
    refName: {
      fontSize: 11 * fontScale,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 2,
    },
    refDesc: {
      fontSize: 10 * fontScale,
      color: '#555555',
    },
    certBlock: {
      marginBottom: 15,
    },
    certHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 2,
    },
    certName: {
      fontSize: 11 * fontScale,
      fontWeight: 'bold',
      color: '#111827',
    },
    certDate: {
      fontSize: 10 * fontScale,
      color: '#888888',
    },
    certIssuer: {
      fontSize: 10 * fontScale,
      color: '#555555',
    }
  });

  return (
    <>
      <Page size="LETTER" style={styles.page}>
        
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          {data.basics.image && (
            <View style={styles.imageContainer}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.basics.image} style={styles.image} />
            </View>
          )}

          <Text style={styles.name}>{data.basics.name}</Text>

          <View style={styles.contactInfo}>
            {data.basics.email && <Text style={styles.contactText}>{data.basics.email}</Text>}
            {data.basics.phone && <Text style={styles.contactText}>{data.basics.phone}</Text>}
            {data.basics.location?.city && (
              <Text style={styles.contactText}>
                {data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ''}
              </Text>
            )}
            {data.basics.url && <Text style={styles.contactText}>{data.basics.url}</Text>}
          </View>

          {data.skills.length > 0 && (
            <View>
              <Text style={styles.sidebarSectionTitle}>Skills</Text>
              {data.skills.map((group) => (
                <View key={group.id} style={styles.skillGroup}>
                  <Text style={styles.skillGroupName}>{group.name}</Text>
                  <Text style={styles.skillGroupKeywords}>{group.keywords.join(', ')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right Main Content */}
        <View style={styles.main}>
          <Text style={styles.label}>{data.basics.label}</Text>

          {data.basics.summary && (
            <Text style={styles.summaryText}>{data.basics.summary}</Text>
          )}

          {data.work.length > 0 && (
            <Text style={styles.sectionTitle}>Experience</Text>
          )}
          {data.work.length > 0 && (
            <View style={styles.sectionContent}>
              {data.work.map((job) => (
                <View key={job.id} style={styles.jobBlock} wrap={false}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobCompany}>{job.name}</Text>
                    <Text style={styles.jobDates}>
                      {formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.jobPosition}>{job.position}</Text>
                  {job.summary && <Text style={styles.jobSummary}>{job.summary}</Text>}
                  
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

          {data.education.length > 0 && (
            <Text style={styles.sectionTitle}>Education</Text>
          )}
          {data.education.length > 0 && (
            <View style={styles.sectionContent}>
              {data.education.map((edu) => (
                <View key={edu.id} style={styles.eduBlock} wrap={false}>
                  <View style={styles.eduLeft}>
                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                    <Text style={styles.eduStudyType}>{edu.studyType}</Text>
                    <Text style={styles.eduArea}>{edu.area}</Text>
                  </View>
                  <Text style={styles.eduDates}>
                    {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {data.projects && data.projects.length > 0 && (
            <Text style={styles.sectionTitle}>Projects</Text>
          )}
          {data.projects && data.projects.length > 0 && (
            <View style={styles.sectionContent}>
              {data.projects.map((proj) => (
                <View key={proj.id} style={styles.projBlock} wrap={false}>
                  <View style={styles.projHeader}>
                    <Text style={styles.projName}>{proj.name}</Text>
                    {proj.url && <Text style={styles.projUrl}>{proj.url}</Text>}
                  </View>
                  <Text style={styles.projDesc}>{proj.description}</Text>
                </View>
              ))}
            </View>
          )}

          {data.references && data.references.length > 0 && (
            <Text style={styles.sectionTitle}>References</Text>
          )}
          {data.references && data.references.length > 0 && (
            <View style={styles.sectionContent}>
              {data.references.map((ref) => (
                <View key={ref.id} style={styles.refBlock} wrap={false}>
                  <Text style={styles.refName}>{ref.name}</Text>
                  <Text style={styles.refDesc}>{ref.reference}</Text>
                </View>
              ))}
            </View>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <Text style={styles.sectionTitle}>Certifications</Text>
          )}
          {data.certifications && data.certifications.length > 0 && (
            <View style={styles.sectionContent}>
              {data.certifications.map((cert) => (
                <View key={cert.id} style={styles.certBlock} wrap={false}>
                  <View style={styles.certHeader}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certDate}>{cert.date}</Text>
                  </View>
                  <Text style={styles.certIssuer}>{cert.issuer}</Text>
                </View>
              ))}
            </View>
          )}

        </View>
        <PdfAtsMetadata data={data} />
      </Page>
    </>
  );
};
