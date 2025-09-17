import { Request, Response } from 'express';
import Ward from '../models/Ward';

export const getWards = async (req: Request, res: Response) => {
  try {
    const wards = await Ward.find().populate('subcounty');
    res.status(200).json({ success: true, data: wards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getWard = async (req: Request, res: Response) => {
  try {
    const ward = await Ward.findById(req.params.id).populate('subcounty');
    if (!ward) {
      return res.status(404).json({ success: false, error: 'Ward not found' });
    }
    res.status(200).json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const createWard = async (req: Request, res: Response) => {
  try {
    const ward = await Ward.create(req.body);
    res.status(201).json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const updateWard = async (req: Request, res: Response) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ward) {
      return res.status(404).json({ success: false, error: 'Ward not found' });
    }
    res.status(200).json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const deleteWard = async (req: Request, res: Response) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({ success: false, error: 'Ward not found' });
    }
    await ward.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getWardsBySubcounty = async (req: Request, res: Response) => {
    try {
        const wards = await Ward.find({ subcounty: req.params.subcountyId });
        res.status(200).json({ success: true, data: wards });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};