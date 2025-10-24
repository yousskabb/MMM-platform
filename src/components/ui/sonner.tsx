// Mock implementation of sonner toast
export const toast = {
  success: (title: string, options?: { description?: string }) => {
    console.log('Toast Success:', title, options?.description);
  },
  error: (title: string, options?: { description?: string }) => {
    console.log('Toast Error:', title, options?.description);
  },
  info: (title: string, options?: { description?: string }) => {
    console.log('Toast Info:', title, options?.description);
  },
  warning: (title: string, options?: { description?: string }) => {
    console.log('Toast Warning:', title, options?.description);
  }
}; 