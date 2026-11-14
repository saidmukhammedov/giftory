import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    wishlist: { type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    link: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 300 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isGroupGift: { type: Boolean, default: false },
    // Single reservation. Never sent to clients: see serialize() in routes/wishlists.js
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reservedAt: Date,
    // Group gift running total, updated atomically with $inc
    funded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Item', itemSchema);
