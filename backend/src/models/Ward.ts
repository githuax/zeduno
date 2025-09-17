import mongoose, { Document, Schema } from 'mongoose';

export interface IWard extends Document {
  name: string;
  subcounty: mongoose.Types.ObjectId;
}

const WardSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subcounty: {
      type: Schema.Types.ObjectId,
      ref: 'Subcounty', 
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model<IWard>('Ward', WardSchema);