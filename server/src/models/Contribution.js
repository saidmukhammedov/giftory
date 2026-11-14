import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('Contribution', contributionSchema);
