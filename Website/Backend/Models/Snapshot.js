import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
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
  version: {
    type: Number,
    required: true
  },
  state: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  lastEventId: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'snapshots'
});

// Indexes for efficient querying
snapshotSchema.index({ aggregateId: 1, version: -1 });
snapshotSchema.index({ aggregateType: 1, timestamp: -1 });

const Snapshot = mongoose.model('Snapshot', snapshotSchema);

export default Snapshot;