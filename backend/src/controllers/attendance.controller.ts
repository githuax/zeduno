import { Request, Response, NextFunction } from 'express';

// Mock data for now - in a real app this would come from a database
let attendance: any[] = [];

export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, employeeId } = req.query;
    
    let filteredAttendance = attendance;
    
    if (date) {
      filteredAttendance = attendance.filter(att => att.date === date);
    }
    
    if (employeeId) {
      filteredAttendance = filteredAttendance.filter(att => att.employeeId === employeeId);
    }

    res.json(filteredAttendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    next(error);
  }
};

export const createAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, date, clockIn, clockOut, breakStart, breakEnd, notes } = req.body;
    
    if (!employeeId || !date || !clockIn) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID, date, and clock in time are required' 
      });
    }

    // Check if attendance already exists for this employee on this date
    const existingAttendance = attendance.find(att => 
      att.employeeId === employeeId && att.date === date
    );

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance record already exists for this employee on this date' 
      });
    }

    const newAttendance = {
      _id: `attendance_${Date.now()}`,
      employeeId,
      date,
      clockIn: `${date}T${clockIn}:00.000Z`,
      clockOut: clockOut ? `${date}T${clockOut}:00.000Z` : null,
      breakStart: breakStart ? `${date}T${breakStart}:00.000Z` : null,
      breakEnd: breakEnd ? `${date}T${breakEnd}:00.000Z` : null,
      totalBreakTime: 0, // Calculate this based on break times
      status: determineAttendanceStatus(clockIn, clockOut),
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calculate total break time
    if (breakStart && breakEnd) {
      const start = new Date(`${date}T${breakStart}:00.000Z`);
      const end = new Date(`${date}T${breakEnd}:00.000Z`);
      newAttendance.totalBreakTime = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60)); // hours
    }

    attendance.push(newAttendance);

    res.status(201).json(newAttendance);
  } catch (error) {
    console.error('Create attendance error:', error);
    next(error);
  }
};

export const clockIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, timestamp } = req.body;
    
    if (!employeeId || !timestamp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and timestamp are required' 
      });
    }

    const date = timestamp.split('T')[0];
    
    // Check if already clocked in today
    const existingAttendance = attendance.find(att => 
      att.employeeId === employeeId && att.date === date
    );

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already clocked in today' 
      });
    }

    const newAttendance = {
      _id: `attendance_${Date.now()}`,
      employeeId,
      date,
      clockIn: timestamp,
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      totalBreakTime: 0,
      status: determineAttendanceStatus(timestamp.split('T')[1].substring(0, 5), null),
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    attendance.push(newAttendance);

    res.json(newAttendance);
  } catch (error) {
    console.error('Clock in error:', error);
    next(error);
  }
};

export const clockOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, timestamp } = req.body;
    
    if (!employeeId || !timestamp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and timestamp are required' 
      });
    }

    const date = timestamp.split('T')[0];
    
    const attendanceIndex = attendance.findIndex(att => 
      att.employeeId === employeeId && att.date === date
    );

    if (attendanceIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'No clock in record found for today' 
      });
    }

    if (attendance[attendanceIndex].clockOut) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already clocked out today' 
      });
    }

    attendance[attendanceIndex].clockOut = timestamp;
    attendance[attendanceIndex].updatedAt = new Date();

    res.json(attendance[attendanceIndex]);
  } catch (error) {
    console.error('Clock out error:', error);
    next(error);
  }
};

export const breakStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, timestamp } = req.body;
    
    if (!employeeId || !timestamp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and timestamp are required' 
      });
    }

    const date = timestamp.split('T')[0];
    
    const attendanceIndex = attendance.findIndex(att => 
      att.employeeId === employeeId && att.date === date
    );

    if (attendanceIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'No clock in record found for today' 
      });
    }

    if (attendance[attendanceIndex].breakStart && !attendance[attendanceIndex].breakEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'Break already started' 
      });
    }

    attendance[attendanceIndex].breakStart = timestamp;
    attendance[attendanceIndex].updatedAt = new Date();

    res.json(attendance[attendanceIndex]);
  } catch (error) {
    console.error('Break start error:', error);
    next(error);
  }
};

export const breakEnd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, timestamp } = req.body;
    
    if (!employeeId || !timestamp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and timestamp are required' 
      });
    }

    const date = timestamp.split('T')[0];
    
    const attendanceIndex = attendance.findIndex(att => 
      att.employeeId === employeeId && att.date === date
    );

    if (attendanceIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'No clock in record found for today' 
      });
    }

    if (!attendance[attendanceIndex].breakStart) {
      return res.status(400).json({ 
        success: false, 
        message: 'No break started' 
      });
    }

    if (attendance[attendanceIndex].breakEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'Break already ended' 
      });
    }

    attendance[attendanceIndex].breakEnd = timestamp;
    
    // Calculate break time
    const breakStartTime = new Date(attendance[attendanceIndex].breakStart);
    const breakEndTime = new Date(timestamp);
    const breakDuration = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60 * 60); // hours
    attendance[attendanceIndex].totalBreakTime += breakDuration;
    
    attendance[attendanceIndex].updatedAt = new Date();

    res.json(attendance[attendanceIndex]);
  } catch (error) {
    console.error('Break end error:', error);
    next(error);
  }
};

// Helper function to determine attendance status
function determineAttendanceStatus(clockInTime: string, clockOutTime: string | null): string {
  if (!clockInTime) return 'absent';
  
  const clockInHour = parseInt(clockInTime.split(':')[0]);
  const clockInMinute = parseInt(clockInTime.split(':')[1]);
  
  // Consider 9:00 AM as standard start time
  if (clockInHour > 9 || (clockInHour === 9 && clockInMinute > 0)) {
    return 'late';
  }
  
  // If clocked out early (before 5:00 PM) and it's not end of day
  if (clockOutTime) {
    const clockOutHour = parseInt(clockOutTime.split(':')[0]);
    if (clockOutHour < 17) {
      return 'early_leave';
    }
  }
  
  return 'present';
}