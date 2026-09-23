
import React from 'react';
import { TaskType } from './types';
import { RoomIcon, AngleIcon, ShadeIcon, CountertopIcon } from './components/icons';

export const TASK_DETAILS: Record<TaskType, { name: string; description: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; iconBgColor: string; }> = {
  [TaskType.RoomStaging]: {
    name: 'Room Staging',
    description: 'Create a lifestyle photo with realistic room settings and ambient lighting',
    icon: RoomIcon,
    iconBgColor: 'bg-red-100',
  },
  [TaskType.CatalogAngle]: {
    name: 'Catalog Angle Generator',
    description: 'Generate multiple product angles for comprehensive e-commerce listings',
    icon: AngleIcon,
    iconBgColor: 'bg-blue-100',
  },
  [TaskType.ShadeFinish]: {
    name: 'Shade Finish Render',
    description: 'Transform materials and finishes while maintaining product authenticity',
    icon: ShadeIcon,
    iconBgColor: 'bg-purple-100',
  },
  [TaskType.Countertop]: {
    name: 'Countertop Replacement',
    description: 'Replace surfaces and backgrounds with premium alternatives',
    icon: CountertopIcon,
    iconBgColor: 'bg-green-100',
  },
};

export const ROOM_TYPES = ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Outdoor Patio', 'Minimalist Studio'];
export const STYLES = ['Modern', 'Minimalist', 'Bohemian', 'Industrial', 'Farmhouse', 'Scandinavian'];
export const LIGHTING = ['Natural Daylight', 'Soft Studio Light', 'Warm Ambient Light', 'Dramatic Contrast', 'Cinematic'];

export const CATALOG_ANGLES = [
  { name: 'Front View', type: 'photographic' },
  { name: 'Left Profile View', type: 'photographic' },
  { name: 'Right Profile View', type: 'photographic' },
  { name: 'Back View', type: 'photographic' },
  { name: 'Top-Down View', type: 'photographic' },
  { name: '45° Angled View', type: 'photographic' },
  { name: 'Low Angle View', type: 'photographic' },
  { name: 'Close-up Detail', type: 'photographic' },
  { name: 'Room Setup', type: 'staging' },
  { name: 'Left Side (Orthographic)', type: 'orthographic' },
  { name: 'Right Side (Orthographic)', type: 'orthographic' },
  { name: '360° Interactive View', type: '360' },
  { name: 'Custom Angle', type: 'custom' },
];

export const QUALITY_LEVELS = ['Full HD', '2K', '4K'];


export const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '3:4', '1.91:1'];