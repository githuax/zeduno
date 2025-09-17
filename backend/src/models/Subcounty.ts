import mongoose, { Document, Schema } from 'mongoose';

export interface ISubcounty extends Document {
  name: string;
}

const SubcountySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model<ISubcounty>('Subcounty', SubcountySchema);