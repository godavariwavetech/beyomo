export interface BookingPackageGroup {
  key: string | number | null;
  packageId?: number | null;
  title: string;
  qty?: number;
  unitPrice?: number;
  price: number;
  items: any[];
  combined?: boolean;
}

export function groupBookingPackages(packages?: any[], services?: any[]): BookingPackageGroup[];
