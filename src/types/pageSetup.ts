export interface PageSetup {
  logo?: string; // base64 image
  title: string;
  subtitle: string;
  details: string;
  border: {
    enabled: boolean;
    thickness: number;
    color: string;
    style: 'solid' | 'dashed' | 'double';
  };
  layout: {
    marginSize: number; // percentage (0-20)
    titleBarHeight: number; // pixels
    logoPosition: 'left' | 'center' | 'right';
    logoSize: number; // percentage of title bar height
  };
  footer: string;
}

export const DEFAULT_PAGE_SETUP: PageSetup = {
  title: 'Floor Plan',
  subtitle: '',
  details: '',
  border: {
    enabled: true,
    thickness: 2,
    color: '#000000',
    style: 'solid',
  },
  layout: {
    marginSize: 5, // 5%
    titleBarHeight: 80,
    logoPosition: 'left',
    logoSize: 80, // 80% of title bar height
  },
  footer: '',
};
