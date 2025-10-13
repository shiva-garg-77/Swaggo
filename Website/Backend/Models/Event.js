import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  aggregateId: {
    type: String,
    required: true,
    index: true
  },
  aggregateType: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  correlationId: {
    type: String,
    index: true
  },
  causationId: {
    type: String,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'events'
});

// Indexes for efficient querying
eventSchema.index({ aggregateId: 1, timestamp: 1 });
eventSchema.index({ eventType: 1, timestamp: 1 });
eventSchema.index({ correlationId: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;