import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, CreateEmployeeInput, EmployeeRole, EmploymentStatus } from '@/types/staff.types';
import { useTenantContext } from '@/hooks/useTenant';

const API_BASE = '/api';

interface UseEmployeesOptions {
  role?: EmployeeRole;
  status?: EmploymentStatus;
  department?: string;
}

interface EmployeesResponse {
  employees: Employee[];
  total: number;
}

const fetchEmployees = async (options: UseEmployeesOptions = {}, tenantId?: string): Promise<Employee[]> => {
  const params = new URLSearchParams();
  
  if (options.role) params.append('role', options.role);
  if (options.status) params.append('status', options.status);
  if (options.department) params.append('department', options.department);
  
  // Add tenant filtering - this is the key fix!
  if (tenantId) {
    params.append('tenantId', tenantId);
  }

  const response = await fetch(`${API_BASE}/users?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }

  const data = await response.json();
  const users = data.data || data.employees || data;
  
  // Transform User data to Employee format
  return users.map((user: any) => ({
    _id: user._id,
    employeeId: user._id.slice(-6).toUpperCase(), // Generate employee ID from _id
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || 'Not provided',
    role: mapUserRoleToEmployeeRole(user.role),
    department: getDepartmentFromRole(user.role),
    position: getPositionFromRole(user.role),
    status: user.isActive ? 'active' : 'inactive',
    hireDate: user.createdAt,
    hourlyRate: getDefaultHourlyRate(user.role),
    weeklyHours: getDefaultWeeklyHours(user.role),
    address: {
      street: 'Not provided',
      city: 'Not provided',
      state: 'Not provided',
      zipCode: 'Not provided'
    },
    emergencyContact: {
      name: 'Not provided',
      relationship: 'Not provided',
      phone: 'Not provided'
    },
    permissions: user.permissions || [],
    avatar: user.avatar,
    dateOfBirth: user.dateOfBirth,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));
};

// Helper functions to map User roles to Employee roles and provide default values
const mapUserRoleToEmployeeRole = (userRole: string): EmployeeRole => {
  const roleMap: Record<string, EmployeeRole> = {
    'admin': 'admin',
    'manager': 'manager',
    'staff': 'server',
    'customer': 'server'
  };
  return roleMap[userRole] || 'server';
};

const getDepartmentFromRole = (role: string): string => {
  const deptMap: Record<string, string> = {
    'admin': 'Administration',
    'manager': 'Management',
    'staff': 'Service',
    'customer': 'Service'
  };
  return deptMap[role] || 'Service';
};

const getPositionFromRole = (role: string): string => {
  const posMap: Record<string, string> = {
    'admin': 'Administrator',
    'manager': 'Manager',
    'staff': 'Server',
    'customer': 'Customer Service'
  };
  return posMap[role] || 'Server';
};

const getDefaultHourlyRate = (role: string): number => {
  const rateMap: Record<string, number> = {
    'admin': 25,
    'manager': 20,
    'staff': 15,
    'customer': 15
  };
  return rateMap[role] || 15;
};

const getDefaultWeeklyHours = (role: string): number => {
  const hoursMap: Record<string, number> = {
    'admin': 40,
    'manager': 40,
    'staff': 35,
    'customer': 20
  };
  return hoursMap[role] || 35;
};

const fetchEmployee = async (id: string): Promise<Employee> => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch employee');
  }

  const data = await response.json();
  const user = data.data || data;
  
  // Transform User data to Employee format
  return {
    _id: user._id,
    employeeId: user._id.slice(-6).toUpperCase(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || 'Not provided',
    role: mapUserRoleToEmployeeRole(user.role),
    department: getDepartmentFromRole(user.role),
    position: getPositionFromRole(user.role),
    status: user.isActive ? 'active' : 'inactive',
    hireDate: user.createdAt,
    hourlyRate: getDefaultHourlyRate(user.role),
    weeklyHours: getDefaultWeeklyHours(user.role),
    address: {
      street: 'Not provided',
      city: 'Not provided',
      state: 'Not provided',
      zipCode: 'Not provided'
    },
    emergencyContact: {
      name: 'Not provided',
      relationship: 'Not provided',
      phone: 'Not provided'
    },
    permissions: user.permissions || [],
    avatar: user.avatar,
    dateOfBirth: user.dateOfBirth,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const createEmployee = async (employeeData: CreateEmployeeInput): Promise<Employee> => {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(employeeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create employee');
  }

  return response.json();
};

const updateEmployee = async ({ id, data }: { id: string; data: Partial<Employee> }): Promise<Employee> => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update employee');
  }

  return response.json();
};

const deleteEmployee = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete employee');
  }
};

export const useEmployees = (options: UseEmployeesOptions = {}) => {
  const { data: tenantContext } = useTenantContext();
  const tenantId = tenantContext?.tenant?.id;

  return useQuery({
    queryKey: ['employees', options, tenantId],
    queryFn: () => fetchEmployees(options, tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!tenantId, // Only run query when we have a tenant ID
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => fetchEmployee(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmployee,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', data._id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// Employee stats hook
export const useEmployeeStats = () => {
  return useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee stats');
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
