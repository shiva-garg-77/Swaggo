import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reportid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  reporterprofileid: {
    type: String,
    required: true,
    index: true
  },
  reportedpostid: {
    type: String,
    index: true
  },
  reportedprofileid: {
    type: String,
    index: true
  },
  reportedstoryid: {
    type: String,
    index: true
  },
  reportType: {
    type: String,
    enum: ['post', 'profile', 'story', 'comment'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'false_info',
      'intellectual_property',
      'self_harm',
      'other'
    ]
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: String
  },
  reviewedAt: {
    type: Date
  },
  resolution: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
ReportSchema.index({ reporterprofileid: 1, createdAt: -1 });
ReportSchema.index({ reportedpostid: 1, status: 1 });
ReportSchema.index({ reportedprofileid: 1, status: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportType: 1, status: 1 });

// Update timestamp on save
ReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Report = mongoose.model('Report', ReportSchema);

export default Report;
