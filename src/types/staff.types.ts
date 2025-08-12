export type EmployeeRole = 'admin' | 'manager' | 'chef' | 'server' | 'host' | 'cashier' | 'cleaner' | 'delivery';
export type EmploymentStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';
export type ShiftStatus = 'scheduled' | 'started' | 'on_break' | 'completed' | 'missed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';

export interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  position: string;
  status: EmploymentStatus;
  hireDate: string;
  hourlyRate: number;
  weeklyHours: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  permissions: string[];
  avatar?: string;
  dateOfBirth?: string;
  socialSecurityNumber?: string; // Encrypted in backend
  bankDetails?: {
    accountNumber: string; // Encrypted
    routingNumber: string;
    bankName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  _id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number; // minutes
  status: ShiftStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  actualBreakDuration?: number;
  notes?: string;
  hourlyRate: number;
  totalHours?: number;
  totalPay?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  employeeId: string;
  shiftId?: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  status: AttendanceStatus;
  totalHours: number;
  totalBreakTime: number;
  notes?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriod {
  _id: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'processed' | 'paid';
  employees: {
    employeeId: string;
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    totalPay: number;
    regularPay: number;
    overtimePay: number;
    bonuses?: number;
    deductions?: number;
    netPay: number;
  }[];
  totalPayroll: number;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  _id: string;
  employeeId: string;
  reviewPeriod: {
    start: string;
    end: string;
  };
  overall_rating: number;
  categories: {
    name: string;
    rating: number;
    comments?: string;
  }[];
  goals: {
    description: string;
    completed: boolean;
    dueDate?: string;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  comments: string;
  reviewedBy: string;
  reviewDate: string;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  position: string;
  hireDate: string;
  hourlyRate: number;
  weeklyHours: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  dateOfBirth?: string;
}

export interface CreateShiftInput {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  notes?: string;
}

export interface UpdateShiftInput extends Partial<CreateShiftInput> {
  status?: ShiftStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  actualBreakDuration?: number;
}

export interface ClockInOutInput {
  employeeId: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  timestamp?: string;
  notes?: string;
}