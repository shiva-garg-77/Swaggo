import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema({
  // Basic Ad Information
  profileid: {
    type: String,
    required: true,
    ref: 'Profile'
  },
  
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  // Ad Content
  mediaType: {
    type: String,
    enum: ['image', 'video', 'carousel'],
    required: true
  },
  
  mediaUrl: {
    type: String,
    required: true
  },
  
  thumbnailUrl: {
    type: String
  },
  
  // Campaign Details
  campaignType: {
    type: String,
    enum: ['awareness', 'traffic', 'engagement', 'conversions', 'app_installs'],
    default: 'awareness'
  },
  
  targetAudience: {
    ageRange: {
      min: { type: Number, min: 13, max: 65 },
      max: { type: Number, min: 13, max: 65 }
    },
    gender: {
      type: String,
      enum: ['all', 'male', 'female', 'non-binary']
    },
    interests: [String],
    locations: [String],
    languages: [String]
  },
  
  // Budget and Scheduling
  budget: {
    daily: { type: Number, min: 5 },
    total: { type: Number, min: 20 }
  },
  
  bidStrategy: {
    type: String,
    enum: ['lowest_cost', 'cost_cap', 'bid_cap'],
    default: 'lowest_cost'
  },
  
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Status and Performance
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft'
  },
  
  analytics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 }, // Cost per thousand impressions
    cpc: { type: Number, default: 0 }, // Cost per click
    ctr: { type: Number, default: 0 }, // Click-through rate
    conversionRate: { type: Number, default: 0 }
  },
  
  // Ad Placement
  placement: {
    type: String,
    enum: ['feed', 'story', 'sidebar', 'banner', 'interstitial'],
    default: 'feed'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'premium'],
    default: 'medium'
  },
  
  // Review and Approval
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  reviewNotes: String,
  
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  
  reviewedAt: Date,
  
  // VIP Features
  vipFeatures: {
    premiumPlacement: { type: Boolean, default: false },
    advancedTargeting: { type: Boolean, default: false },
    priorityReview: { type: Boolean, default: false },
    customAudience: { type: Boolean, default: false }
  },
  
  // Tracking and URLs
  clickUrl: String,
  trackingPixel: String,
  utmParameters: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  }
  
}, {
  timestamps: true,
  collection: 'advertisements'
});

// Indexes for performance
advertisementSchema.index({ profileid: 1, status: 1 });
advertisementSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
advertisementSchema.index({ reviewStatus: 1 });
advertisementSchema.index({ createdAt: -1 });

// Virtual for CTR calculation
advertisementSchema.virtual('ctrPercentage').get(function() {
  if (this.analytics.impressions === 0) return 0;
  return ((this.analytics.clicks / this.analytics.impressions) * 100).toFixed(2);
});

// Static method to get user's active ads
advertisementSchema.statics.getActiveAds = function(profileid) {
  return this.find({
    profileid,
    status: 'active',
    'schedule.startDate': { $lte: new Date() },
    'schedule.endDate': { $gte: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to get user's expired ads
advertisementSchema.statics.getExpiredAds = function(profileid) {
  return this.find({
    profileid,
    $or: [
      { status: 'completed' },
      { 'schedule.endDate': { $lt: new Date() } }
    ]
  }).sort({ 'schedule.endDate': -1 });
};

// Instance method to update analytics
advertisementSchema.methods.updateAnalytics = function(impressions, clicks, spend) {
  this.analytics.impressions += impressions || 0;
  this.analytics.clicks += clicks || 0;
  this.analytics.spend += spend || 0;
  
  // Recalculate metrics
  if (this.analytics.impressions > 0) {
    this.analytics.ctr = (this.analytics.clicks / this.analytics.impressions) * 100;
    this.analytics.cpm = (this.analytics.spend / this.analytics.impressions) * 1000;
  }
  
  if (this.analytics.clicks > 0) {
    this.analytics.cpc = this.analytics.spend / this.analytics.clicks;
  }
  
  return this.save();
};

// Instance method to check if ad is expired
advertisementSchema.methods.isExpired = function() {
  return new Date() > this.schedule.endDate;
};

// Instance method to check if ad is active
advertisementSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.schedule.startDate && 
         now <= this.schedule.endDate;
};

// Pre-save middleware to validate dates
advertisementSchema.pre('save', function(next) {
  if (this.schedule.endDate <= this.schedule.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Pre-save middleware to auto-update status based on dates
advertisementSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'active') {
    if (now > this.schedule.endDate) {
      this.status = 'completed';
    } else if (now < this.schedule.startDate) {
      this.status = 'pending';
    }
  }
  
  next();
});

export default mongoose.model('Advertisement', advertisementSchema);
