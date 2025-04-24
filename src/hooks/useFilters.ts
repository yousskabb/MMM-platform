// This is a mock implementation of the useFilters hook
export const useFilters = () => {
  return {
    filters: {
      date: 'last30days',
      campaign: 'all',
      channel: 'all',
    },
    setFilters: () => {
      // Mock implementation
    },
  };
}; 