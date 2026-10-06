import mongoose, { Schema } from 'mongoose';
const contactSchema = new Schema({
  name: { type: String, required: true, maxlength: 100, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, required: true, maxlength: 200, trim: true },
  message: { type: String, required: true, minlength: 10, maxlength: 2000, trim: true },
  status: { type: String, enum: ['new', 'handled'], default: 'new' },
  handledAt: Date,
  expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 86400000) },
}, { timestamps: true });
contactSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
contactSchema.index({ status: 1, createdAt: -1 });
export const ContactSubmission = mongoose.model('ContactSubmission', contactSchema);
const newsletterSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  consentedAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
  unsubscribeTokenHash: { type: String, select: false },
  unsubscribedAt: Date,
}, { timestamps: true });
newsletterSchema.index({ unsubscribeTokenHash: 1 }, { sparse: true });
export const NewsletterSubscription = mongoose.model('NewsletterSubscription', newsletterSchema);
