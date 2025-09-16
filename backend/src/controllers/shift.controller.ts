import { Request, Response, NextFunction } from 'express';

// Mock data for now - in a real app this would come from a database
const shifts: any[] = [];

export const getShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let filteredShifts = shifts;
    
    if (startDate && endDate) {
      filteredShifts = shifts.filter(shift => 
        shift.date >= startDate && shift.date <= endDate
      );
    }
    
    if (employeeId) {
      filteredShifts = filteredShifts.filter(shift => shift.employeeId === employeeId);
    }

    res.json(filteredShifts);
  } catch (error) {
    console.error('Get shifts error:', error);
    next(error);
  }
};

export const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, date, startTime, endTime, breakDuration, notes } = req.body;
    
    if (!employeeId || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID, date, start time, and end time are required' 
      });
    }

    const newShift = {
      _id: `shift_${Date.now()}`,
      employeeId,
      date,
      startTime,
      endTime,
      breakDuration: breakDuration || 30,
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    shifts.push(newShift);

    res.status(201).json(newShift);
  } catch (error) {
    console.error('Create shift error:', error);
    next(error);
  }
};

export const updateShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const shiftIndex = shifts.findIndex(shift => shift._id === id);
    if (shiftIndex === -1) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    shifts[shiftIndex] = { 
      ...shifts[shiftIndex], 
      ...updates, 
      updatedAt: new Date() 
    };

    res.json(shifts[shiftIndex]);
  } catch (error) {
    console.error('Update shift error:', error);
    next(error);
  }
};

export const deleteShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const shiftIndex = shifts.findIndex(shift => shift._id === id);
    if (shiftIndex === -1) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    shifts.splice(shiftIndex, 1);

    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Delete shift error:', error);
    next(error);
  }
};