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

Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_m07NSg.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_d0nNSg.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_TknNSg.ttf', fontWeight: 700 },
  ]
});

interface Props {
  data: ResumeData;
}

export const PdfTemplateModern: React.FC<Props> = ({ data }) => {
  const themeColor = data.metadata?.themeColor || '#3b82f6';
  const fontScale = data.metadata?.fontSize || 1;

  const getLightBackground = (hex: string) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return '#f8fafc';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const bgR = Math.round(r * 0.1 + 255 * 0.9);
    const bgG = Math.round(g * 0.1 + 255 * 0.9);
    const bgB = Math.round(b * 0.1 + 255 * 0.9);
    return `rgb(${bgR}, ${bgG}, ${bgB})`;
  };

  const bubbleBg = getLightBackground(themeColor);

  // Exact 0.72 scale translation from HTML preview pixels (850px) to PDF points (612pt)
  const marginPtTB = (data.metadata?.pageMargin || 0.42) * 69.12;
  const marginPtLR = (data.metadata?.pageMarginLR ?? data.metadata?.pageMargin ?? 0.42) * 69.12;

  const styles: any = {
    page: {
      paddingTop: marginPtTB - 14.4, // Subtract 14.4pt (20px) to visually align the top margin with the HTML preview and reclaim space
      paddingBottom: marginPtTB - 10.8, // Subtract 10.8pt (15px) to reclaim space
      paddingLeft: marginPtLR,
      paddingRight: marginPtLR,
      backgroundColor: '#ffffff',
      fontFamily: 'Inter',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: themeColor,
      borderBottomStyle: 'solid',
      paddingBottom: 14.4,
      marginBottom: 14.4,
    },
    imageContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      marginRight: 14.4,
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
      borderRadius: 36,
      borderWidth: 2.16,
      borderColor: themeColor,
    },
    headerContent: {
      flex: 1,
      paddingTop: 3.6,
    },
    name: {
      fontSize: 28.8 * fontScale,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 600, // Change from 'bold' (700) to 600 (semi-bold) to matches preview typography
      color: '#1e293b',
      marginBottom: 3.6,
    },
    label: {
      fontSize: 13.8 * fontScale,
      color: themeColor,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 500,
      marginBottom: 0,
    },
    contactInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 7.2,
    },
    contactText: {
      fontSize: 9.5 * fontScale,
      color: '#64748b',
      marginRight: 10.8,
      fontFamily: 'Inter',
    },
    contactLink: {
      fontSize: 9.5 * fontScale,
      color: themeColor,
      textDecoration: 'none',
      marginRight: 10.8,
      fontFamily: 'Inter',
    },
    section: {
    },
    sectionTitleWrapper: {
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      borderBottomStyle: 'solid',
      paddingBottom: 3.6,
      marginBottom: 0,
    },
    sectionContent: {
      marginTop: 10.8,
      marginBottom: 14.4,
    },
    sectionTitle: {
      fontSize: 13.8 * fontScale,
      color: '#1e293b',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 600, // Change from 'bold' (700) to 600 (semi-bold) to matches globals.css
    },
    summaryText: {
      fontSize: 10.9 * fontScale,
      color: '#475569',
      lineHeight: 1.6,
      fontFamily: 'Inter',
    },
    itemBlock: {
      marginBottom: 25.2,
    },
    eduItemBlock: {
      marginBottom: 10.8,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 1.44,
    },
    itemTitle: {
      fontSize: 12.1 * fontScale,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 600,
      color: '#1e293b',
    },
    itemDates: {
      fontSize: 9.8 * fontScale,
      color: '#64748b',
      fontFamily: 'Inter',
    },
    itemSubtitle: {
      fontSize: 11.5 * fontScale,
      fontWeight: 600,
      color: themeColor,
      marginTop: 1.44,
      marginBottom: 5.76,
      fontFamily: 'Inter',
    },
    eduItemSubtitle: {
      fontSize: 11.5 * fontScale,
      fontWeight: 600,
      color: themeColor,
      marginTop: 1.44,
      fontFamily: 'Inter',
    },
    itemDescription: {
      fontSize: 10.9 * fontScale,
      color: '#475569',
      lineHeight: 1.2,
      marginBottom: 3.6,
      fontFamily: 'Inter',
    },
    eduItemDescription: {
      fontSize: 10.9 * fontScale,
      color: '#475569',
      lineHeight: 1.2,
      marginTop: 1.44,
      fontFamily: 'Inter',
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 3.6,
      paddingLeft: 14.4,
    },
    bulletDot: {
      width: 3.5,
      height: 3.5,
      borderRadius: 1.75,
      backgroundColor: '#475569',
      marginRight: 6.8,
      marginTop: 4.5,
    },
    bulletText: {
      fontSize: 10.4 * fontScale,
      color: '#475569',
      lineHeight: 1.4,
      flex: 1,
      fontFamily: 'Inter',
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillGroup: {
      marginBottom: 10.8,
      paddingRight: 10.8,
    },
    skillGroupName: {
      fontSize: 10.9 * fontScale,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 600,
      color: '#1e293b',
      marginBottom: 3.6,
    },
    skillTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillTag: {
      backgroundColor: bubbleBg,
      paddingHorizontal: 5.76,
      paddingVertical: 2.16,
      borderRadius: 2.88,
      marginRight: 3.6,
      marginBottom: 3.6,
    },
    skillTagText: {
      fontSize: 9.8 * fontScale,
      color: themeColor,
      fontWeight: 500,
      fontFamily: 'Inter',
    },
    projectsGridRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    projItemBlock: {
      marginBottom: 10.8,
      paddingRight: 10.8,
    },
    projectHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 1.44,
    },
    projectTitle: {
      fontSize: 12.1 * fontScale,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 600, // Soften from 'bold' (700) to 600 (semi-bold)
      color: '#1e293b',
      marginRight: 8.64,
    },
    projectLink: {
      fontSize: 9.8 * fontScale,
      color: themeColor,
      textDecoration: 'none',
      fontFamily: 'Inter',
    },
    referencesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    referenceItem: {
      marginBottom: 10.8,
      paddingRight: 10.8,
    },
    referenceName: {
      fontSize: 12.1 * fontScale,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 600, // Soften from 'bold' (700) to 600 (semi-bold)
      color: '#1e293b',
      marginBottom: 3.6,
    },
    referenceText: {
      fontSize: 10.9 * fontScale,
      color: '#475569',
      lineHeight: 1.2,
      fontFamily: 'Inter',
    },
    certificationsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    certItemBlock: {
      marginBottom: 10.8,
      paddingRight: 10.8,
    },
  };

  return (
    <>
      <Page size="LETTER" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          {data.basics.image && (
            <View style={styles.imageContainer}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.basics.image} style={styles.image} />
              <View style={styles.imageBorder} />
            </View>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.name}>{data.basics.name}</Text>
            <Text style={styles.label}>{data.basics.label}</Text>
            <View style={styles.contactInfo}>
              {data.basics.email && <Text style={styles.contactText}>{data.basics.email}</Text>}
              {data.basics.phone && <Text style={styles.contactText}>{data.basics.phone}</Text>}
              {data.basics.location?.city && (
                <Text style={styles.contactText}>
                  {data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ''}
                </Text>
              )}
              {data.basics.url && <Text style={styles.contactLink}>{data.basics.url.replace(/^https?:\/\//, '')}</Text>}
            </View>
          </View>
        </View>

        {/* Summary */}
        {data.basics.summary && (
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
        )}
        {data.basics.summary && (
          <View style={styles.sectionContent}>
            <Text style={styles.summaryText}>{data.basics.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.work.length > 0 && (
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>
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

        {/* Education */}
        {data.education.length > 0 && (
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>Education</Text>
          </View>
        )}
        {data.education.length > 0 && (
          <View style={styles.sectionContent}>
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.eduItemBlock} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.studyType}</Text>
                  <Text style={styles.itemDates}>
                    {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                  </Text>
                </View>
                <Text style={styles.eduItemSubtitle}>{edu.area}</Text>
                <Text style={styles.eduItemDescription}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
        )}
        {data.skills.length > 0 && (() => {
          const cols = data.metadata?.layout?.skills || 3;
          return (
            <View style={styles.sectionContent}>
              {Array.from({ length: Math.ceil(data.skills.length / cols) }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.skillsGrid} wrap={false}>
                  {data.skills.slice(rowIndex * cols, rowIndex * cols + cols).map((skillGroup, idx) => (
                    <View key={idx} style={{ ...styles.skillGroup, width: `${100 / cols}%` }}>
                      <Text style={styles.skillGroupName}>{skillGroup.name}</Text>
                      <View style={styles.skillTags}>
                        {skillGroup.keywords.map((kw, i) => (
                          <View key={i} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{kw}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })()}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>Portfolio Projects</Text>
          </View>
        )}
        {data.projects && data.projects.length > 0 && (() => {
          const projects = data.projects;
          const cols = data.metadata?.layout?.projects || 1;
          return (
            <View style={styles.sectionContent}>
              {Array.from({ length: Math.ceil(projects.length / cols) }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.projectsGridRow} wrap={false}>
                  {projects.slice(rowIndex * cols, rowIndex * cols + cols).map((proj, idx) => (
                    <View key={idx} style={{ ...styles.projItemBlock, width: `${100 / cols}%` }} wrap={false}>
                      <View style={styles.projectHeader}>
                        <Text style={styles.projectTitle}>{proj.name}</Text>
                        {proj.url && <Text style={styles.projectLink}>{proj.url}</Text>}
                      </View>
                      <Text style={styles.itemDescription}>{proj.description}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })()}

        {/* References */}
        {data.references && data.references.length > 0 && (
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>References</Text>
          </View>
        )}
        {data.references && data.references.length > 0 && (() => {
          const references = data.references;
          const cols = data.metadata?.layout?.references || 2;
          return (
            <View style={styles.sectionContent}>
              {Array.from({ length: Math.ceil(references.length / cols) }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.referencesGrid} wrap={false}>
                  {references.slice(rowIndex * cols, rowIndex * cols + cols).map((ref, idx) => (
                    <View key={idx} style={{ ...styles.referenceItem, width: `${100 / cols}%` }}>
                      <Text style={styles.referenceName}>{ref.name}</Text>
                      <Text style={styles.referenceText}>{ref.reference}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })()}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>Certifications</Text>
          </View>
        )}
        {data.certifications && data.certifications.length > 0 && (() => {
          const certifications = data.certifications;
          const cols = data.metadata?.layout?.certifications || 1;
          return (
            <View style={styles.sectionContent}>
              {Array.from({ length: Math.ceil(certifications.length / cols) }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.certificationsGrid} wrap={false}>
                  {certifications.slice(rowIndex * cols, rowIndex * cols + cols).map((cert, idx) => (
                    <View key={idx} style={{ ...styles.certItemBlock, width: `${100 / cols}%` }} wrap={false}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>{cert.name}</Text>
                        <Text style={styles.itemDates}>{cert.date}</Text>
                      </View>
                      <Text style={styles.itemDescription}>{cert.issuer}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })()}

        {/* Invisible Machine-Readable ATS Payload */}
        <PdfAtsMetadata data={data} />
      </Page>
    </>
  );
};
