import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileValue<T> {
  value: T;
  source: string;
  verified: boolean;
  lastUpdated: Date;
}

const createProfileValueSchema = (type: any, defaultValue: any) => {
  return new Schema({
    value: { type, default: defaultValue },
    source: { type: String, default: 'manual' },
    verified: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  }, { _id: false });
};

export interface IUserProfile extends Document {
  personal: {
    fullName: IProfileValue<string>;
    preferredName: IProfileValue<string>;
    email: IProfileValue<string>;
    phone: IProfileValue<string>;
    alternatePhone: IProfileValue<string>;
    dateOfBirth: IProfileValue<string>;
    currentCity: IProfileValue<string>;
    state: IProfileValue<string>;
    country: IProfileValue<string>;
    postalCode: IProfileValue<string>;
    fullAddress: IProfileValue<string>;
  };
  professional: {
    currentStatus: IProfileValue<string>; // student, employed, unemployed
    yearsOfExperience: IProfileValue<number>;
    noticePeriod: IProfileValue<string>;
    currentSalary: IProfileValue<string>;
    expectedSalary: IProfileValue<string>;
    preferredRoles: IProfileValue<string[]>;
    preferredLocations: IProfileValue<string[]>;
    remotePreference: IProfileValue<string>; // remote, hybrid, onsite, any
    relocationPreference: IProfileValue<boolean>;
  };
  education: {
    degree: IProfileValue<string>;
    specialization: IProfileValue<string>;
    university: IProfileValue<string>;
    startDate: IProfileValue<string>;
    endDate: IProfileValue<string>;
    graduationYear: IProfileValue<number>;
    cgpa: IProfileValue<number>;
    percentage: IProfileValue<number>;
    classXII: IProfileValue<number>;
    classX: IProfileValue<number>;
  };
  links: {
    linkedin: IProfileValue<string>;
    github: IProfileValue<string>;
    portfolio: IProfileValue<string>;
    personalWebsite: IProfileValue<string>;
  };
  workAuthorization: {
    country: IProfileValue<string>;
    authorizationStatus: IProfileValue<string>; // authorized, needs_sponsorship, student_visa
    sponsorshipRequirement: IProfileValue<boolean>;
  };
  skills: IProfileValue<string[]>;
  projects: IProfileValue<Array<{
    title: string;
    description: string;
    skillsUsed: string[];
    link?: string;
  }>>;
  experience: IProfileValue<Array<{
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description: string;
  }>>;
  certifications: IProfileValue<Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
  }>>;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  personal: {
    fullName: createProfileValueSchema(String, ''),
    preferredName: createProfileValueSchema(String, ''),
    email: createProfileValueSchema(String, ''),
    phone: createProfileValueSchema(String, ''),
    alternatePhone: createProfileValueSchema(String, ''),
    dateOfBirth: createProfileValueSchema(String, ''),
    currentCity: createProfileValueSchema(String, ''),
    state: createProfileValueSchema(String, ''),
    country: createProfileValueSchema(String, ''),
    postalCode: createProfileValueSchema(String, ''),
    fullAddress: createProfileValueSchema(String, '')
  },
  professional: {
    currentStatus: createProfileValueSchema(String, 'student'),
    yearsOfExperience: createProfileValueSchema(Number, 0),
    noticePeriod: createProfileValueSchema(String, ''),
    currentSalary: createProfileValueSchema(String, ''),
    expectedSalary: createProfileValueSchema(String, ''),
    preferredRoles: createProfileValueSchema([String], []),
    preferredLocations: createProfileValueSchema([String], []),
    remotePreference: createProfileValueSchema(String, 'any'),
    relocationPreference: createProfileValueSchema(Boolean, false)
  },
  education: {
    degree: createProfileValueSchema(String, ''),
    specialization: createProfileValueSchema(String, ''),
    university: createProfileValueSchema(String, ''),
    startDate: createProfileValueSchema(String, ''),
    endDate: createProfileValueSchema(String, ''),
    graduationYear: createProfileValueSchema(Number, 0),
    cgpa: createProfileValueSchema(Number, 0),
    percentage: createProfileValueSchema(Number, 0),
    classXII: createProfileValueSchema(Number, 0),
    classX: createProfileValueSchema(Number, 0)
  },
  links: {
    linkedin: createProfileValueSchema(String, ''),
    github: createProfileValueSchema(String, ''),
    portfolio: createProfileValueSchema(String, ''),
    personalWebsite: createProfileValueSchema(String, '')
  },
  workAuthorization: {
    country: createProfileValueSchema(String, 'India'),
    authorizationStatus: createProfileValueSchema(String, 'authorized'),
    sponsorshipRequirement: createProfileValueSchema(Boolean, false)
  },
  skills: createProfileValueSchema([String], []),
  projects: createProfileValueSchema([new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    skillsUsed: [String],
    link: String
  }, { _id: false })], []),
  experience: createProfileValueSchema([new Schema({
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: String,
    startDate: String,
    endDate: String,
    isCurrent: { type: Boolean, default: false },
    description: String
  }, { _id: false })], []),
  certifications: createProfileValueSchema([new Schema({
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: String,
    expiryDate: String,
    credentialId: String
  }, { _id: false })], []),
  isOnboarded: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
