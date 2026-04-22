export interface Driver {
  id: number;
  name: string;
  licenseNumber?: string;
  phoneNumber?: string;
  isActive: boolean;
}

export interface Mechanic {
  id: number;
  name: string;
  speciality?: string;
  phoneNumber?: string;
  isActive: boolean;
}
