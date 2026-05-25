import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';
import { PdfAtsMetadata } from './PdfAtsMetadata';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf', fontWeight: 700 },
  ]
});

interface Props {
  data: ResumeData;
}

const getLightBackground = (hex: string) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return '#f8fafc';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const bgR = Math.round(r * 0.08 + 248 * 0.92);
  const bgG = Math.round(g * 0.08 + 250 * 0.92);
  const bgB = Math.round(b * 0.08 + 252 * 0.92);
  return `rgb(${bgR}, ${bgG}, ${bgB})`;
};

export const PdfTemplateModernSplit: React.FC<Props> = ({ data }) => {
  const themeColor = data.metadata?.themeColor || '#6366f1';
  const fontScale = data.metadata?.fontSize || 1;
  const lightBg = getLightBackground(themeColor);

  const marginPtTB = (data.metadata?.pageMargin || 0.42) * 72;
  const marginPtLR = (data.metadata?.pageMarginLR ?? data.metadata?.pageMargin ?? 0.42) * 72;

  const styles: any = {
    page: {
      flexDirection: 'row',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter',
    },
    main: {
      width: '65%',
      paddingTop: marginPtTB,
      paddingBottom: marginPtTB,
      paddingLeft: marginPtLR,
      paddingRight: 40,
    },
    sidebar: {
      width: '35%',
      paddingTop: marginPtTB,
      paddingBottom: marginPtTB,
      paddingLeft: 40,
      paddingRight: marginPtLR,
      backgroundColor: lightBg, // This guarantees the full column has the background!
      borderLeftWidth: 1,
      borderLeftColor: '#e2e8f0',
      borderLeftStyle: 'solid',
    },
    // Main column styles
    name: {
      fontSize: 32 * fontScale,
      fontWeight: 700,
      color: '#0f172a',
      marginBottom: 5,
      fontFamily: 'Plus Jakarta Sans',
    },
    label: {
      fontSize: 16 * fontScale,
      color: themeColor,
      marginBottom: 30,
      fontFamily: 'Plus Jakarta Sans',
    },
    sectionTitle: {
      fontSize: 16 * fontScale,
      color: '#0f172a',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontFamily: 'Plus Jakarta Sans',
    },
    sectionTitleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 0,
      marginTop: 20,
    },
    sectionContent: {
      marginTop: 15,
    },
    sectionTitleLine: {
      width: 30,
      height: 2,
      backgroundColor: themeColor,
      marginRight: 10,
    },
    summaryText: {
      fontSize: 11 * fontScale,
      color: '#475569',
      lineHeight: 1.5,
      marginBottom: 10,
      fontFamily: 'Inter',
    },
    jobBlock: {
      marginBottom: 15,
    },
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    jobPosition: {
      fontSize: 12 * fontScale,
      fontWeight: 600,
      color: '#1e293b',
      fontFamily: 'Plus Jakarta Sans',
    },
    jobDates: {
      fontSize: 10 * fontScale,
      color: themeColor,
      fontFamily: 'Inter',
    },
    jobCompany: {
      fontSize: 11 * fontScale,
      color: themeColor,
      marginBottom: 6,
      fontFamily: 'Inter',
    },
    jobSummary: {
      fontSize: 10 * fontScale,
      color: '#475569',
      lineHeight: 1.4,
      marginBottom: 6,
      fontFamily: 'Inter',
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 3,
      paddingLeft: 10,
    },
    bulletDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: themeColor,
      marginRight: 6,
      marginTop: 4,
    },
    bulletText: {
      fontSize: 10 * fontScale,
      color: '#475569',
      lineHeight: 1.4,
      flex: 1,
      fontFamily: 'Inter',
    },
    eduBlock: {
      marginBottom: 12,
    },
    eduHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    eduStudyType: {
      fontSize: 11 * fontScale,
      fontWeight: 600,
      color: '#0f172a',
      fontFamily: 'Plus Jakarta Sans',
    },
    eduArea: {
      fontSize: 10 * fontScale,
      color: themeColor,
      fontFamily: 'Inter',
    },
    eduInstitution: {
      fontSize: 10 * fontScale,
      color: '#475569',
      fontFamily: 'Inter',
    },

    // Sidebar styles
    imageContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginBottom: 20,
      alignSelf: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 60,
      borderWidth: 2.88,
      borderColor: '#ffffff',
    },
    contactBlock: {
      marginBottom: 30,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    contactIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: themeColor,
      color: 'white',
      fontSize: 10 * fontScale,
      textAlign: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    contactIconText: {
      color: 'white',
      fontSize: 10 * fontScale,
      fontFamily: 'Inter',
    },
    contactText: {
      fontSize: 9 * fontScale,
      color: '#475569',
      flex: 1,
      fontFamily: 'Inter',
    },
    skillCategory: {
      fontSize: 11 * fontScale,
      fontWeight: 600,
      color: '#1e293b',
      marginBottom: 6,
      marginTop: 15,
      fontFamily: 'Plus Jakarta Sans',
    },
    skillsWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillBadge: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: themeColor,
      borderStyle: 'solid',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 6,
      marginBottom: 6,
    },
    skillBadgeText: {
      fontSize: 9 * fontScale,
      color: themeColor,
      fontWeight: 'bold',
      fontFamily: 'Inter',
    },
  };

  return (
    <>
      <Page size="LETTER" style={styles.page}>
        
        {/* Left Column */}
        <View style={styles.main}>
          <Text style={styles.name}>{data.basics.name}</Text>
          <Text style={styles.label}>{data.basics.label}</Text>

          {data.basics.summary && (
            <Text style={styles.summaryText}>{data.basics.summary}</Text>
          )}

          {data.work.length > 0 && (
            <View style={styles.sectionTitleWrapper}>
              <View style={styles.sectionTitleLine} />
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
          )}
          {data.work.length > 0 && (
            <View style={styles.sectionContent}>
              {data.work.map((job) => (
                <View key={job.id} style={styles.jobBlock} wrap={false}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobPosition}>{job.position}</Text>
                    <Text style={styles.jobDates}>
                      {formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.jobCompany}>{job.name}</Text>
                  {job.summary && <Text style={styles.jobSummary}>{job.summary}</Text>}
                  
                  {job.highlights && job.highlights.length > 0 && (
                    <View>
                      {job.highlights.map((item, i) => {
                        if (item.trim() === '') return null;
                        return (
                          <View key={i} style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
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
            <View style={styles.sectionTitleWrapper}>
              <View style={styles.sectionTitleLine} />
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
          )}
          {data.education.length > 0 && (
            <View style={styles.sectionContent}>
              {data.education.map((edu) => (
                <View key={edu.id} style={styles.eduBlock} wrap={false}>
                  <View style={styles.eduHeader}>
                    <Text style={styles.eduStudyType}>{edu.studyType}</Text>
                    <Text style={styles.jobDates}>
                      {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.eduArea}>{edu.area}</Text>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right Sidebar */}
        <View style={styles.sidebar}>
          {data.basics.image && (
            <View style={styles.imageContainer}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.basics.image} style={styles.image} />
              <View style={styles.imageBorder} />
            </View>
          )}

          <View style={styles.contactBlock}>
            {data.basics.email && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}><Text style={styles.contactIconText}>@</Text></View>
                <Text style={styles.contactText}>{data.basics.email}</Text>
              </View>
            )}
            {data.basics.phone && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}><Text style={styles.contactIconText}>#</Text></View>
                <Text style={styles.contactText}>{data.basics.phone}</Text>
              </View>
            )}
            {data.basics.location?.city && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}><Text style={styles.contactIconText}>P</Text></View>
                <Text style={styles.contactText}>
                  {data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ''}
                </Text>
              </View>
            )}
            {data.basics.url && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}><Text style={styles.contactIconText}>W</Text></View>
                <Text style={styles.contactText}>{data.basics.url.replace(/^https?:\/\//, '')}</Text>
              </View>
            )}
          </View>

          {data.skills && data.skills.length > 0 && (
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
          )}
          {data.skills && data.skills.length > 0 && (
            <View style={styles.sectionContent}>
              {data.skills.map((skillGroup, idx) => (
                <View key={idx} wrap={false}>
                  <Text style={styles.skillCategory}>{skillGroup.name}</Text>
                  <View style={styles.skillsWrapper}>
                    {skillGroup.keywords.map((kw, i) => (
                      <View key={i} style={styles.skillBadge}>
                        <Text style={styles.skillBadgeText}>{kw}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Invisible Machine-Readable ATS Payload */}
        <PdfAtsMetadata data={data} />
      </Page>
    </>
  );
};
