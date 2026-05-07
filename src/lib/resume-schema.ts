export interface ResumeData {
  metadata?: {
    layout?: {
      work?: number;
      education?: number;
      skills?: number;
      projects?: number;
      references?: number;
      certifications?: number;
    };
    themeColor?: string;
    fontFamily?: string;
    minimalSidebarColor?: string;
  };
  basics: {
    name: string;
    label: string;
    image: string;
    email: string;
    phone: string;
    url: string;
    summary: string;
    location: {
      address: string;
      postalCode: string;
      city: string;
      countryCode: string;
      region: string;
    };
    profiles: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work: Array<{
    id: string;
    name: string;
    position: string;
    url: string;
    startDate: string;
    endDate: string;
    summary: string;
    highlights: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    url: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    score: string;
    courses: string[];
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: string;
    keywords: string[];
  }>;
  references?: Array<{
    id: string;
    name: string;
    reference: string;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
  }>;
}
