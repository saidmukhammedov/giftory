import crypto from 'node:crypto';
import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    occasion: { type: String, trim: true, maxlength: 40 },
    eventDate: Date,
    note: { type: String, trim: true, maxlength: 300 },
    slug: { type: String, unique: true, default: () => crypto.randomBytes(6).toString('base64url') },
  },
  { timestamps: true }
);

export default mongoose.model('Wishlist', wishlistSchema);
