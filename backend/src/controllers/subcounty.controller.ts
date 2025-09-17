import { Request, Response } from 'express';
import Subcounty from '../models/Subcounty';

export const getSubcounties = async (req: Request, res: Response) => {
  try {
    const subcounties = await Subcounty.find();
    res.status(200).json({ success: true, data: subcounties });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getSubcounty = async (req: Request, res: Response) => {
  try {
    const subcounty = await Subcounty.findById(req.params.id);
    if (!subcounty) {
      return res.status(404).json({ success: false, error: 'Subcounty not found' });
    }
    res.status(200).json({ success: true, data: subcounty });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const createSubcounty = async (req: Request, res: Response) => {
  try {
    const subcounty = await Subcounty.create(req.body);
    res.status(201).json({ success: true, data: subcounty });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const updateSubcounty = async (req: Request, res: Response) => {
  try {
    const subcounty = await Subcounty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subcounty) {
      return res.status(404).json({ success: false, error: 'Subcounty not found' });
    }
    res.status(200).json({ success: true, data: subcounty });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const deleteSubcounty = async (req: Request, res: Response) => {
  try {
    const subcounty = await Subcounty.findById(req.params.id);
    if (!subcounty) {
      return res.status(404).json({ success: false, error: 'Subcounty not found' });
    }
    await subcounty.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};