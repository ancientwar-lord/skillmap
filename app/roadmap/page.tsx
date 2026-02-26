'use client';

import Roadmap from '@/components/Roadmap';

const DUMMY_ROADMAPS = [
  {
    $id: '1',
    title: 'Frontend Developer Path 2024',
    isPublic: true,
  },
  {
    $id: '2',
    title: 'Advanced Backend Systems',
    isPublic: false,
  },
  {
    $id: '3',
    title: 'Data Science Fundamentals',
    isPublic: true,
  },
  {
    $id: '4',
    title: 'Mobile App Mastery (React Native)',
    isPublic: false,
  },
];
const DUMMY_ROADMAP_DATA = [
  {
    taskId: 't1',
    title: 'Fundamentals',
    tag: 'Start Here',
    subtasks: [
      { $id: 's1', title: 'Install Node.js & Git', completed: true },
      { $id: 's2', title: 'VS Code Setup', completed: true },
    ],
  },
  {
    taskId: 't2',
    title: 'HTML & CSS',
    tag: 'Basics',
    subtasks: [
      { $id: 's3', title: 'Semantic HTML', completed: true },
      { $id: 's4', title: 'Flexbox & Grid', completed: true },
    ],
  },
  {
    taskId: 't3',
    title: 'JavaScript Logic',
    tag: 'Core',
    subtasks: [
      { $id: 's5', title: 'Variables & Data Types', completed: true },
      { $id: 's6', title: 'DOM Manipulation', completed: false },
    ],
  },
  {
    taskId: 't4',
    title: 'React Basics',
    tag: 'Framework',
    subtasks: [
      { $id: 's7', title: 'Components & Props', completed: false },
      { $id: 's8', title: 'useState Hook', completed: false },
    ],
  },
  {
    taskId: 't5',
    title: 'Advanced React',
    tag: 'Deep Dive',
    subtasks: [
      { $id: 's9', title: 'Context API', completed: false },
      { $id: 's10', title: 'Custom Hooks', completed: false },
    ],
  },
  {
    taskId: 't6',
    title: 'Backend Integration',
    tag: 'API',
    subtasks: [{ $id: 's11', title: 'Fetch & Axios', completed: false }],
  },
  {
    taskId: 't7',
    title: 'Deployment',
    tag: 'Final',
    subtasks: [
      { $id: 's12', title: 'Vercel / Netlify', completed: false },
      { $id: 's13', title: 'CI/CD Pipelines', completed: false },
    ],
  },
];
export default function RoadmapPage() {
  return (
    <div className={`min-h-screen bg-gray-50`}>
      <div className="container mx-auto px-4 py-12">
        <Roadmap
          title="Frontend Developer Path 2024"
          description="This roadmap covers the essential skills and technologies needed to become a frontend developer in 2024."
          roadmapData={DUMMY_ROADMAP_DATA}
        />
      </div>
    </div>
  );
}