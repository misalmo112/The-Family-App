/**
 * Icon mappings for relationship labels
 */
import {
  Person as PersonIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Wc as WcIcon,
  ChildCare as ChildCareIcon,
  Groups as GroupsIcon,
  Elderly as ElderlyIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

export const relationshipIcons = {
  // Direct family
  father: FamilyRestroomIcon,
  mother: FamilyRestroomIcon,
  son: ChildCareIcon,
  daughter: ChildCareIcon,
  
  // Spouse
  husband: WcIcon,
  wife: WcIcon,
  spouse: WcIcon,
  
  // Siblings
  brother: PeopleIcon,
  sister: PeopleIcon,
  
  // Grandparents
  grandfather: ElderlyIcon,
  grandmother: ElderlyIcon,
  grandson: ChildCareIcon,
  granddaughter: ChildCareIcon,
  
  // Extended
  uncle: GroupsIcon,
  aunt: GroupsIcon,
  nephew: ChildCareIcon,
  niece: ChildCareIcon,
  cousin: PeopleIcon,
  
  // In-Laws
  'father-in-law': ElderlyIcon,
  'mother-in-law': ElderlyIcon,
  
  // Default
  default: PersonIcon,
};

/**
 * Get icon component for a relationship label
 * @param {string} label - Relationship label
 * @returns {React.Component}
 */
export function getRelationshipIcon(label) {
  const normalizedLabel = label.toLowerCase();
  return relationshipIcons[normalizedLabel] || relationshipIcons.default;
}

/**
 * Relationship label categories for UI grouping
 */
export const relationshipCategories = {
  direct: {
    title: 'Direct Family',
    labels: ['father', 'mother', 'son', 'daughter'],
    color: 'primary',
  },
  spouse: {
    title: 'Spouse',
    labels: ['husband', 'wife', 'spouse'],
    color: 'secondary',
  },
  siblings: {
    title: 'Siblings',
    labels: ['brother', 'sister'],
    color: 'info',
  },
  grandparents: {
    title: 'Grandparents & Grandchildren',
    labels: ['grandfather', 'grandmother', 'grandson', 'granddaughter'],
    color: 'success',
  },
  extended: {
    title: 'Extended Family',
    labels: ['uncle', 'aunt', 'nephew', 'niece', 'cousin'],
    color: 'warning',
  },
  inlaws: {
    title: 'In-Laws',
    labels: ['father-in-law', 'mother-in-law'],
    color: 'info',
  },
};

/**
 * Get display name for a relationship label
 * @param {string} label - Relationship label
 * @returns {string} Capitalized display name
 */
export function getRelationshipDisplayName(label) {
  const normalizedLabel = label.toLowerCase();
  const displayNames = {
    father: 'Father',
    mother: 'Mother',
    son: 'Son',
    daughter: 'Daughter',
    husband: 'Husband',
    wife: 'Wife',
    spouse: 'Spouse',
    brother: 'Brother',
    sister: 'Sister',
    grandfather: 'Grandfather',
    grandmother: 'Grandmother',
    grandson: 'Grandson',
    granddaughter: 'Granddaughter',
    uncle: 'Uncle',
    aunt: 'Aunt',
    nephew: 'Nephew',
    niece: 'Niece',
    cousin: 'Cousin',
    'father-in-law': 'Father-in-Law',
    'mother-in-law': 'Mother-in-Law',
  };
  
  return displayNames[normalizedLabel] || label.charAt(0).toUpperCase() + label.slice(1);
}
