import { Request } from 'express';
import mongoose from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    email: string;
    role: string;
    branchRole?: string;
    assignedBranches?: mongoose.Types.ObjectId[];
    currentBranch?: mongoose.Types.ObjectId;
    canSwitchBranches?: boolean;
  };
  superadmin?: {
    _id: mongoose.Types.ObjectId;
    email: string;
    role: 'superadmin';
  };
}

export interface JWTPayload {
  userId: string;
  tenantId?: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface SuperadminJWTPayload {
  superadminId: string;
  email: string;
  role: 'superadmin';
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId?: string;
    currentBranch?: string;
    assignedBranches?: string[];
  };
  superadmin?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'superadmin';
  };
  message?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}