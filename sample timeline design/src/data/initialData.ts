import { Category, TimelineEvent, TimelineConfig, Quarter } from '../types';

// Initial date range for timeline
const currentYear = new Date().getFullYear();
const startDate = new Date(currentYear, 5, 1); // June 1st
const endDate = new Date(currentYear, 10, 30); // November 30th

export const timelineConfig: TimelineConfig = {
  startDate,
  endDate,
  today: new Date(),
};

// Define quarters
export const quarters: Quarter[] = [
  {
    name: 'Q1 Review',
    date: new Date(currentYear, 5, 15), // June 15th
  },
  {
    name: 'Q2 Review',
    date: new Date(currentYear, 6, 15), // July 15th
  },
  {
    name: 'Q3 Review',
    date: new Date(currentYear, 8, 15), // September 15th
  },
  {
    name: 'Q4 Review',
    date: new Date(currentYear, 9, 15), // October 15th
  },
];

// Initial categories
export const initialCategories: Category[] = [
  {
    id: 'key-milestones',
    name: 'Key Milestones',
    color: '#38bdf8', // sky-400
  },
  {
    id: 'workshops',
    name: 'Workshops',
    color: '#f87171', // red-400
  },
  {
    id: 'small-migrations',
    name: 'Small Migrations',
    color: '#a78bfa', // violet-400
  },
  {
    id: 'digital-migration',
    name: 'Digital Migration',
    color: '#10b981', // emerald-500
  },
  {
    id: 'asset-migration',
    name: 'Asset Migration',
    color: '#f59e0b', // amber-500
  },
];

// Initial events
export const initialEvents: TimelineEvent[] = [
  {
    id: '1',
    title: 'Impact Analysis',
    categoryId: 'key-milestones',
    startDate: new Date(currentYear, 5, 10), // June 10
    endDate: new Date(currentYear, 6, 25), // July 25
    color: '#10b981', // emerald-500
    isImportant: true,
  },
  {
    id: '2',
    title: 'Identity Stockholders',
    categoryId: 'key-milestones',
    startDate: new Date(currentYear, 5, 5), // June 5
    endDate: new Date(currentYear, 5, 25), // June 25
    color: '#10b981', // emerald-500
    isImportant: true,
  },
  {
    id: '3',
    title: 'Planning Deep Dives',
    categoryId: 'key-milestones',
    startDate: new Date(currentYear, 8, 1), // September 1
    endDate: new Date(currentYear, 8, 20), // September 20
    color: '#10b981', // emerald-500
    isImportant: true,
  },
  {
    id: '4',
    title: 'Migration Plan',
    categoryId: 'key-milestones',
    startDate: new Date(currentYear, 9, 15), // October 15
    endDate: new Date(currentYear, 9, 30), // October 30
    isImportant: true,
  },
  {
    id: '5',
    title: 'Migration',
    categoryId: 'key-milestones',
    startDate: new Date(currentYear, 8, 25), // September 25
    endDate: new Date(currentYear, 9, 25), // October 25
    color: '#10b981', // emerald-500
  },
  {
    id: '6',
    title: 'Small Migration Workshops',
    categoryId: 'workshops',
    startDate: new Date(currentYear, 5, 10), // June 10
    endDate: new Date(currentYear, 6, 30), // July 30
    color: '#a78bfa', // violet-400
  },
  {
    id: '7',
    title: 'Digital Migration Workshops',
    categoryId: 'workshops',
    startDate: new Date(currentYear, 7, 5), // August 5
    endDate: new Date(currentYear, 8, 15), // September 15
    color: '#3b82f6', // blue-500
  },
  {
    id: '8',
    title: 'Asset Migration Workshops',
    categoryId: 'workshops',
    startDate: new Date(currentYear, 8, 10), // September 10
    endDate: new Date(currentYear, 9, 30), // October 30
    color: '#f87171', // red-400
  },
  {
    id: '9',
    title: 'Communication',
    categoryId: 'small-migrations',
    startDate: new Date(currentYear, 5, 5), // June 5
    endDate: new Date(currentYear, 6, 25), // July 25
    color: '#92400e', // amber-900
    isImportant: true,
  },
  {
    id: '10',
    title: 'Notification',
    categoryId: 'small-migrations',
    startDate: new Date(currentYear, 7, 1), // August 1
    endDate: new Date(currentYear, 7, 10), // August 10
    isImportant: true,
  },
  {
    id: '11',
    title: 'Migration',
    categoryId: 'small-migrations',
    startDate: new Date(currentYear, 7, 15), // August 15
    endDate: new Date(currentYear, 8, 20), // September 20
    color: '#f59e0b', // amber-500
    isImportant: true,
  },
  {
    id: '12',
    title: 'Go Live!',
    categoryId: 'small-migrations',
    startDate: new Date(currentYear, 8, 25), // September 25
    endDate: new Date(currentYear, 8, 25), // September 25
  },
  // Digital migration events
  {
    id: '13',
    title: 'Communication',
    categoryId: 'digital-migration',
    startDate: new Date(currentYear, 7, 1), // August 1
    endDate: new Date(currentYear, 7, 25), // August 25
    color: '#f87171', // red-400
    isImportant: true,
  },
  {
    id: '14',
    title: 'Reminder',
    categoryId: 'digital-migration',
    startDate: new Date(currentYear, 8, 5), // September 5
    endDate: new Date(currentYear, 8, 5), // September 5
  },
  {
    id: '15',
    title: 'Notification',
    categoryId: 'digital-migration',
    startDate: new Date(currentYear, 8, 10), // September 10
    endDate: new Date(currentYear, 8, 10), // September 10
    isImportant: true,
  },
  {
    id: '16',
    title: 'Migration',
    categoryId: 'digital-migration',
    startDate: new Date(currentYear, 8, 15), // September 15
    endDate: new Date(currentYear, 9, 15), // October 15
    color: '#3b82f6', // blue-500
    isImportant: true,
  },
  {
    id: '17',
    title: 'Go Live!',
    categoryId: 'digital-migration',
    startDate: new Date(currentYear, 9, 20), // October 20
    endDate: new Date(currentYear, 9, 20), // October 20
  },
  // Asset migration events
  {
    id: '18',
    title: 'Communication',
    categoryId: 'asset-migration',
    startDate: new Date(currentYear, 8, 1), // September 1
    endDate: new Date(currentYear, 8, 25), // September 25
    color: '#f87171', // red-400
    isImportant: true,
  },
  {
    id: '19',
    title: 'Reminder',
    categoryId: 'asset-migration',
    startDate: new Date(currentYear, 9, 5), // October 5
    endDate: new Date(currentYear, 9, 5), // October 5
  },
  {
    id: '20',
    title: 'Notification',
    categoryId: 'asset-migration',
    startDate: new Date(currentYear, 9, 10), // October 10
    endDate: new Date(currentYear, 9, 10), // October 10
    isImportant: true,
  },
  {
    id: '21',
    title: 'Migration',
    categoryId: 'asset-migration',
    startDate: new Date(currentYear, 9, 15), // October 15
    endDate: new Date(currentYear, 9, 30), // October 30
    color: '#38bdf8', // sky-400
    isImportant: true,
  },
  {
    id: '22',
    title: 'Go Live!',
    categoryId: 'asset-migration',
    startDate: new Date(currentYear, 9, 30), // October 30
    endDate: new Date(currentYear, 9, 30), // October 30
  },
];