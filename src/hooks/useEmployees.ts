import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, CreateEmployeeInput, EmployeeRole, EmploymentStatus } from '@/types/staff.types';

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

const fetchEmployees = async (options: UseEmployeesOptions = {}): Promise<Employee[]> => {
  const params = new URLSearchParams();
  
  if (options.role) params.append('role', options.role);
  if (options.status) params.append('status', options.status);
  if (options.department) params.append('department', options.department);

  const response = await fetch(`${API_BASE}/employees?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }

  const data: EmployeesResponse = await response.json();
  return data.employees || data as any; // Handle both array and object responses
};

const fetchEmployee = async (id: string): Promise<Employee> => {
  const response = await fetch(`${API_BASE}/employees/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch employee');
  }

  return response.json();
};

const createEmployee = async (employeeData: CreateEmployeeInput): Promise<Employee> => {
  const response = await fetch(`${API_BASE}/employees`, {
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
  const response = await fetch(`${API_BASE}/employees/${id}`, {
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
  const response = await fetch(`${API_BASE}/employees/${id}`, {
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
  return useQuery({
    queryKey: ['employees', options],
    queryFn: () => fetchEmployees(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      const response = await fetch(`${API_BASE}/employees/stats`, {
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