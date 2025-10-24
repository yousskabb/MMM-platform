// Commonly used types across the application

// Dynamic types based on Excel data
export type MediaType = 'Offline' | 'Online';

export type Country = 'France';

export type Brand = 'Dior';

export interface FilterState {
  country: Country;
  brand: Brand;
  selectedYear: number;
}

export interface ChannelData {
  channel: Channel;
  mediaType: MediaType;
  color: string;
  lightColor: string;
  investment: number;
  roi: number;
  revenue: number;
  contribution: number;
  yoyGrowth: number;
}

export interface MonthlyChannelData extends ChannelData {
  month: string;
  value: number;
}

export interface SimulationData {
  channel: Channel;
  currentBudget: number;
  newBudget: number;
  expectedROI: number;
}

export interface SynergyData {
  channel1: Channel;
  channel2: Channel;
  correlation: number;
}

export interface YearComparisonData {
  channel: Channel;
  year1Budget: number;
  year2Budget: number;
  variation: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Add new interfaces for year-based filtering
export interface YearlyData {
  year: number;
  channelData: ChannelData[];
  monthlyData: MonthlyChannelData[];
  contributions: WeeklyData[];
  investments: WeeklyData[];
  variables: string[];
}

export interface WeeklyData {
  date: Date;
  [variable: string]: number | Date;
}