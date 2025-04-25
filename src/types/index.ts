// Commonly used types across the application

export type Channel = 
  | 'TV' 
  | 'Radio' 
  | 'Print' 
  | 'Digital' 
  | 'CRM' 
  | 'Promo';

export type MediaType = 'Offline' | 'Online';

export type Country = 'France' | 'UK' | 'Spain' | 'Italy' | 'Germany' | 'Portugal' | 'All Countries';

export type Brand = 'Novotel' | 'Pullman' | 'Ibis' | 'Mercure' | 'Sofitel' | 'All Brands';

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export interface FilterState {
  country: Country;
  brand: Brand;
  dateRange: DateRange;
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