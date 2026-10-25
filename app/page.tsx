export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/connect';
import UserProfile from '@/models/UserProfile';
import SystemSetting from '@/models/SystemSetting';

// Known prepopulated skills from the user rule guidelines
const SEED_SKILLS = [
  'Python', 'SQL', 'Power BI', 'Advanced Excel', 'Pandas', 'NumPy', 'Java', 'JavaScript', 
  'HTML', 'CSS', 'React', 'Node.js', 'Express.js', 'Flask', 'Streamlit', 'OpenCV', 
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Git', 'Docker', 'Linux', 'Power Query', 
  'DAX', 'Data Modeling', 'Star Schema', 'CTEs', 'Window Functions', 'Joins', 
  'LLM APIs', 'LangChain', 'ChromaDB'
];

const SEED_PROJECTS = [
  {
    title: 'AI-driven Traffic Violation Detection',
    description: 'Real-time video analysis system to flag traffic infractions and identify license plates automatically.',
    skillsUsed: ['Python', 'OpenCV', 'TensorFlow', 'PyTorch']
  },
  {
    title: 'Cold Email Generator',
    description: 'Generative AI agent to parse job openings and draft highly personalized recruitment introduction drafts.',
    skillsUsed: ['Python', 'LLM APIs', 'LangChain', 'Streamlit']
  },
  {
    title: 'Gurgaon Housing Market Analysis',
    description: 'Exploratory data analysis and price prediction analytics on real estate listings.',
    skillsUsed: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Streamlit']
  },
  {
    title: 'Credit Card Financial Dashboard',
    description: 'Interactive dashboard highlighting transactions, credit behavior, and risk analytics.',
    skillsUsed: ['Power BI', 'SQL', 'Power Query', 'DAX', 'Data Modeling']
  }
];

async function seedInitialProfile() {
  await dbConnect();
  
  // 1. Check if user profile already exists
  let profile = await UserProfile.findOne();
  if (!profile) {
    profile = await UserProfile.create({
      personal: {
        fullName: { value: 'Krishna Tanwar', source: 'seed', verified: true, lastUpdated: new Date() },
        preferredName: { value: 'Krishna', source: 'seed', verified: true, lastUpdated: new Date() },
        email: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        phone: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        alternatePhone: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        dateOfBirth: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        currentCity: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        state: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        country: { value: 'India', source: 'seed', verified: true, lastUpdated: new Date() },
        postalCode: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        fullAddress: { value: '', source: 'manual', verified: false, lastUpdated: new Date() }
      },
      professional: {
        currentStatus: { value: 'student', source: 'seed', verified: true, lastUpdated: new Date() },
        yearsOfExperience: { value: 0, source: 'seed', verified: true, lastUpdated: new Date() },
        noticePeriod: { value: 'immediate', source: 'seed', verified: true, lastUpdated: new Date() },
        currentSalary: { value: '0', source: 'seed', verified: true, lastUpdated: new Date() },
        expectedSalary: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        preferredRoles: { 
          value: [
            'Data Analyst', 'BI Analyst', 'Business Intelligence Analyst', 
            'Power BI Developer', 'Junior Data Analyst', 'Data Analyst Intern'
          ], 
          source: 'seed', 
          verified: true, 
          lastUpdated: new Date() 
        },
        preferredLocations: { value: ['Bangalore', 'Gurgaon', 'Noida', 'Remote'], source: 'seed', verified: true, lastUpdated: new Date() },
        remotePreference: { value: 'any', source: 'seed', verified: true, lastUpdated: new Date() },
        relocationPreference: { value: true, source: 'seed', verified: true, lastUpdated: new Date() }
      },
      education: {
        degree: { value: 'B.Tech', source: 'seed', verified: true, lastUpdated: new Date() },
        specialization: { value: 'Computer Science and Engineering (AI, ML and IoT)', source: 'seed', verified: true, lastUpdated: new Date() },
        university: { value: 'GLA University, Mathura', source: 'seed', verified: true, lastUpdated: new Date() },
        startDate: { value: '2023-08-01', source: 'seed', verified: true, lastUpdated: new Date() },
        endDate: { value: '2027-06-30', source: 'seed', verified: true, lastUpdated: new Date() },
        graduationYear: { value: 2027, source: 'seed', verified: true, lastUpdated: new Date() },
        cgpa: { value: 8.3, source: 'seed', verified: true, lastUpdated: new Date() },
        percentage: { value: 83.0, source: 'seed', verified: true, lastUpdated: new Date() },
        classXII: { value: 93.2, source: 'seed', verified: true, lastUpdated: new Date() },
        classX: { value: 95.0, source: 'seed', verified: true, lastUpdated: new Date() }
      },
      links: {
        linkedin: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        github: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        portfolio: { value: '', source: 'manual', verified: false, lastUpdated: new Date() },
        personalWebsite: { value: '', source: 'manual', verified: false, lastUpdated: new Date() }
      },
      workAuthorization: {
        country: { value: 'India', source: 'seed', verified: true, lastUpdated: new Date() },
        authorizationStatus: { value: 'authorized', source: 'seed', verified: true, lastUpdated: new Date() },
        sponsorshipRequirement: { value: false, source: 'seed', verified: true, lastUpdated: new Date() }
      },
      skills: { value: SEED_SKILLS, source: 'seed', verified: true, lastUpdated: new Date() },
      projects: { value: SEED_PROJECTS, source: 'seed', verified: true, lastUpdated: new Date() },
      experience: { value: [], source: 'seed', verified: true, lastUpdated: new Date() },
      certifications: { value: [], source: 'seed', verified: true, lastUpdated: new Date() },
      isOnboarded: false
    });
  }

  // 2. Seed default system settings if missing
  const defaultSettings = [
    { key: 'application_policy', value: 'Always Review Before Submit' },
    { key: 'match_threshold', value: 60 },
    { key: 'browser_mode', value: 'Headed' },
    { key: 'ai_provider', value: 'Gemini' },
    { key: 'screenshot_policy', value: { failure: true, pause: true, preSubmit: true, postSubmit: true } },
    { key: 'resume_selection_policy', value: 'Automatic' },
    { key: 'duplicate_protection', value: true }
  ];

  for (const setting of defaultSettings) {
    const exists = await SystemSetting.findOne({ key: setting.key });
    if (!exists) {
      await SystemSetting.create(setting);
    }
  }

  return profile;
}

export default async function IndexPage() {
  const profile = await seedInitialProfile();
  
  if (profile.isOnboarded) {
    redirect('/dashboard');
  } else {
    redirect('/onboarding');
  }
}
