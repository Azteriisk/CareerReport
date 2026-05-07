import { ResumeData } from "./resume-schema";

export const defaultResume: ResumeData = {
  metadata: {
    layout: {
      work: 1,
      education: 1,
      skills: 3,
      projects: 1,
      references: 2,
      certifications: 1
    },
    themeColor: '#3b82f6'
  },
  basics: {
    name: "Jane Doe",
    label: "Senior Software Engineer",
    image: "/placeholder-headshot.png",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    url: "janedoe.dev",
    summary: "A passionate software engineer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, and Cloud architecture.",
    location: {
      address: "123 Main St",
      postalCode: "12345",
      city: "San Francisco",
      countryCode: "US",
      region: "California",
    },
    profiles: [
      {
        network: "LinkedIn",
        username: "janedoe",
        url: "https://linkedin.com/in/janedoe",
      },
      {
        network: "GitHub",
        username: "janedoe",
        url: "https://github.com/janedoe",
      }
    ],
  },
  work: [
    {
      id: "1",
      name: "Tech Corp",
      position: "Senior Frontend Developer",
      url: "https://techcorp.com",
      startDate: "2021-01",
      endDate: "Present",
      summary: "Led the frontend team in developing the new flagship product.",
      highlights: [
        "Improved application performance by 40%",
        "Mentored 3 junior developers",
        "Implemented micro-frontend architecture"
      ],
    },
    {
      id: "2",
      name: "StartUp Inc",
      position: "Full Stack Developer",
      url: "https://startupinc.com",
      startDate: "2018-06",
      endDate: "2020-12",
      summary: "Developed RESTful APIs and interactive UI components.",
      highlights: [
        "Built CI/CD pipelines using GitHub Actions",
        "Integrated Stripe for payment processing",
      ],
    }
  ],
  education: [
    {
      id: "1",
      institution: "University of Technology",
      url: "https://university.edu",
      area: "Computer Science",
      studyType: "Bachelor",
      startDate: "2014-09",
      endDate: "2018-05",
      score: "3.8 GPA",
      courses: [
        "Data Structures and Algorithms",
        "Web Development",
        "Database Systems"
      ],
    }
  ],
  skills: [
    {
      id: "1",
      name: "Frontend",
      level: "Master",
      keywords: ["HTML", "CSS", "JavaScript", "React", "Next.js"]
    },
    {
      id: "2",
      name: "Backend",
      level: "Intermediate",
      keywords: ["Node.js", "Express", "PostgreSQL", "MongoDB"]
    }
  ],
  references: [],
  projects: []
};
