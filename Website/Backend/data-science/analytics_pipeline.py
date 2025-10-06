#!/usr/bin/env python3
"""
📊 Advanced Analytics Pipeline for Swaggo
Real-time data processing, batch analytics, and insight generation
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import asyncio
import threading
import queue
import time
from concurrent.futures import ThreadPoolExecutor
import sqlite3
import os
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class UserEvent:
    """User event data structure"""
    user_id: str
    event_type: str
    timestamp: datetime
    metadata: Dict
    session_id: Optional[str] = None
    device_info: Optional[Dict] = None
    geo_info: Optional[Dict] = None

@dataclass
class ContentEvent:
    """Content event data structure"""
    content_id: str
    user_id: str
    event_type: str
    timestamp: datetime
    duration: Optional[float] = None
    metadata: Dict = None

@dataclass
class AnalyticsMetric:
    """Analytics metric data structure"""
    metric_name: str
    metric_value: float
    timestamp: datetime
    dimensions: Dict
    tags: Optional[Dict] = None

class EventBuffer:
    """Thread-safe event buffer for real-time processing"""
    
    def __init__(self, max_size: int = 10000):
        self.buffer = deque(maxlen=max_size)
        self.lock = threading.Lock()
        
    def add_event(self, event: Union[UserEvent, ContentEvent]):
        """Add event to buffer"""
        with self.lock:
            self.buffer.append(event)
    
    def get_events(self, max_events: int = 100) -> List[Union[UserEvent, ContentEvent]]:
        """Get and remove events from buffer"""
        with self.lock:
            events = []
            for _ in range(min(max_events, len(self.buffer))):
                if self.buffer:
                    events.append(self.buffer.popleft())
            return events

class MetricsAggregator:
    """Real-time metrics aggregation engine"""
    
    def __init__(self):
        self.metrics = defaultdict(lambda: defaultdict(float))
        self.counters = defaultdict(lambda: defaultdict(int))
        self.gauges = defaultdict(float)
        self.lock = threading.Lock()
        
    def increment_counter(self, metric_name: str, value: float = 1.0, dimensions: Dict = None):
        """Increment a counter metric"""
        with self.lock:
            key = self._make_key(metric_name, dimensions)
            self.counters[metric_name][key] += value
    
    def set_gauge(self, metric_name: str, value: float, dimensions: Dict = None):
        """Set a gauge metric"""
        with self.lock:
            key = self._make_key(metric_name, dimensions)
            self.gauges[key] = value
    
    def add_to_histogram(self, metric_name: str, value: float, dimensions: Dict = None):
        """Add value to histogram"""
        with self.lock:
            key = self._make_key(metric_name, dimensions)
            if key not in self.metrics[metric_name]:
                self.metrics[metric_name][key] = []
            self.metrics[metric_name][key].append(value)
    
    def get_metrics_summary(self) -> Dict:
        """Get aggregated metrics summary"""
        with self.lock:
            summary = {
                'counters': dict(self.counters),
                'gauges': dict(self.gauges),
                'histograms': {}
            }
            
            # Calculate histogram statistics
            for metric_name, metric_data in self.metrics.items():
                summary['histograms'][metric_name] = {}
                for key, values in metric_data.items():
                    if values:
                        summary['histograms'][metric_name][key] = {
                            'count': len(values),
                            'sum': sum(values),
                            'avg': sum(values) / len(values),
                            'min': min(values),
                            'max': max(values),
                            'p50': np.percentile(values, 50),
                            'p95': np.percentile(values, 95),
                            'p99': np.percentile(values, 99)
                        }
            
            return summary
    
    def _make_key(self, metric_name: str, dimensions: Dict = None) -> str:
        """Create a unique key from metric name and dimensions"""
        if not dimensions:
            return metric_name
        dim_str = ','.join([f"{k}={v}" for k, v in sorted(dimensions.items())])
        return f"{metric_name}[{dim_str}]"

class UserBehaviorAnalyzer:
    """Analyze user behavior patterns"""
    
    def __init__(self):
        self.user_sessions = defaultdict(list)
        self.user_segments = {}
        
    def analyze_user_journey(self, events: List[UserEvent]) -> Dict:
        """Analyze user journey and behavior patterns"""
        user_journeys = defaultdict(list)
        
        # Group events by user and session
        for event in events:
            key = f"{event.user_id}_{event.session_id or 'default'}"
            user_journeys[key].append(event)
        
        # Analyze each journey
        journey_insights = []
        for journey_key, journey_events in user_journeys.items():
            # Sort by timestamp
            journey_events.sort(key=lambda x: x.timestamp)
            
            # Calculate session metrics
            session_duration = (journey_events[-1].timestamp - journey_events[0].timestamp).total_seconds()
            event_types = [event.event_type for event in journey_events]
            unique_events = set(event_types)
            
            # Identify patterns
            pattern = self._identify_behavior_pattern(event_types)
            
            journey_insight = {
                'journey_id': journey_key,
                'user_id': journey_events[0].user_id,
                'session_duration': session_duration,
                'total_events': len(journey_events),
                'unique_event_types': len(unique_events),
                'event_sequence': event_types,
                'behavior_pattern': pattern,
                'engagement_score': self._calculate_engagement_score(journey_events),
                'conversion_funnel_position': self._get_funnel_position(event_types)
            }
            
            journey_insights.append(journey_insight)
        
        return {
            'total_journeys': len(journey_insights),
            'journeys': journey_insights,
            'aggregated_metrics': self._calculate_journey_aggregates(journey_insights)
        }
    
    def _identify_behavior_pattern(self, event_sequence: List[str]) -> str:
        """Identify user behavior pattern from event sequence"""
        # Define behavior patterns
        patterns = {
            'explorer': ['view', 'browse', 'search', 'view', 'browse'],
            'consumer': ['view', 'like', 'share', 'comment'],
            'creator': ['create', 'edit', 'publish', 'share'],
            'social': ['follow', 'like', 'comment', 'share', 'message'],
            'researcher': ['search', 'view', 'save', 'search', 'view'],
            'passive': ['view', 'view', 'view']
        }
        
        # Score patterns against the sequence
        pattern_scores = {}
        for pattern_name, pattern_events in patterns.items():
            score = self._calculate_pattern_similarity(event_sequence, pattern_events)
            pattern_scores[pattern_name] = score
        
        # Return the pattern with highest score
        best_pattern = max(pattern_scores, key=pattern_scores.get)
        return best_pattern if pattern_scores[best_pattern] > 0.3 else 'mixed'
    
    def _calculate_pattern_similarity(self, sequence: List[str], pattern: List[str]) -> float:
        """Calculate similarity between event sequence and pattern"""
        if not sequence or not pattern:
            return 0.0
        
        # Simple matching score
        matches = 0
        for event in sequence:
            if event in pattern:
                matches += 1
        
        return matches / max(len(sequence), len(pattern))
    
    def _calculate_engagement_score(self, events: List[UserEvent]) -> float:
        """Calculate user engagement score (0-100)"""
        if not events:
            return 0.0
        
        # Base score from event count
        base_score = min(len(events) * 5, 40)
        
        # Bonus for diversity
        event_types = set(event.event_type for event in events)
        diversity_bonus = len(event_types) * 3
        
        # Bonus for high-value actions
        high_value_actions = ['create', 'publish', 'share', 'comment', 'follow']
        high_value_count = sum(1 for event in events if event.event_type in high_value_actions)
        high_value_bonus = high_value_count * 8
        
        # Session duration bonus
        if len(events) > 1:
            duration = (events[-1].timestamp - events[0].timestamp).total_seconds() / 60  # minutes
            duration_bonus = min(duration * 0.5, 15)  # Max 15 points for 30+ minutes
        else:
            duration_bonus = 0
        
        total_score = base_score + diversity_bonus + high_value_bonus + duration_bonus
        return min(total_score, 100)
    
    def _get_funnel_position(self, event_sequence: List[str]) -> str:
        """Determine user's position in conversion funnel"""
        funnel_stages = {
            'awareness': ['view', 'browse', 'search'],
            'interest': ['like', 'save', 'follow'],
            'consideration': ['compare', 'research', 'detailed_view'],
            'conversion': ['create', 'publish', 'purchase', 'subscribe'],
            'retention': ['return_visit', 'regular_usage', 'refer']
        }
        
        # Find the highest stage reached
        highest_stage = 'awareness'
        for stage, stage_events in funnel_stages.items():
            if any(event in stage_events for event in event_sequence):
                highest_stage = stage
        
        return highest_stage
    
    def _calculate_journey_aggregates(self, journeys: List[Dict]) -> Dict:
        """Calculate aggregate metrics across all journeys"""
        if not journeys:
            return {}
        
        return {
            'avg_session_duration': np.mean([j['session_duration'] for j in journeys]),
            'avg_events_per_session': np.mean([j['total_events'] for j in journeys]),
            'avg_engagement_score': np.mean([j['engagement_score'] for j in journeys]),
            'pattern_distribution': self._get_pattern_distribution(journeys),
            'funnel_distribution': self._get_funnel_distribution(journeys)
        }
    
    def _get_pattern_distribution(self, journeys: List[Dict]) -> Dict:
        """Get distribution of behavior patterns"""
        patterns = [j['behavior_pattern'] for j in journeys]
        pattern_counts = {}
        for pattern in patterns:
            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
        
        total = len(patterns)
        return {pattern: count/total for pattern, count in pattern_counts.items()}
    
    def _get_funnel_distribution(self, journeys: List[Dict]) -> Dict:
        """Get distribution of funnel positions"""
        positions = [j['conversion_funnel_position'] for j in journeys]
        position_counts = {}
        for position in positions:
            position_counts[position] = position_counts.get(position, 0) + 1
        
        total = len(positions)
        return {position: count/total for position, count in position_counts.items()}

class ContentPerformanceAnalyzer:
    """Analyze content performance and engagement"""
    
    def __init__(self):
        self.content_metrics = defaultdict(lambda: defaultdict(float))
        
    def analyze_content_performance(self, content_events: List[ContentEvent]) -> Dict:
        """Analyze content performance metrics"""
        content_stats = defaultdict(lambda: {
            'views': 0,
            'likes': 0,
            'shares': 0,
            'comments': 0,
            'saves': 0,
            'total_duration': 0.0,
            'unique_viewers': set(),
            'engagement_events': 0,
            'timestamps': []
        })
        
        # Aggregate events by content
        for event in content_events:
            stats = content_stats[event.content_id]
            stats['timestamps'].append(event.timestamp)
            stats['unique_viewers'].add(event.user_id)
            
            if event.event_type == 'view':
                stats['views'] += 1
                if event.duration:
                    stats['total_duration'] += event.duration
            elif event.event_type in ['like', 'share', 'comment', 'save']:
                stats[f"{event.event_type}s"] += 1
                stats['engagement_events'] += 1
        
        # Calculate derived metrics
        performance_analysis = {}
        for content_id, stats in content_stats.items():
            unique_viewers = len(stats['unique_viewers'])
            total_views = stats['views']
            
            # Engagement rate
            engagement_rate = (stats['engagement_events'] / total_views * 100) if total_views > 0 else 0
            
            # Average view duration
            avg_duration = (stats['total_duration'] / total_views) if total_views > 0 else 0
            
            # Viral coefficient (shares per view)
            viral_coefficient = (stats['shares'] / total_views) if total_views > 0 else 0
            
            # Content score (weighted combination of metrics)
            content_score = (
                stats['views'] * 1 +
                stats['likes'] * 2 +
                stats['shares'] * 3 +
                stats['comments'] * 2.5 +
                stats['saves'] * 4 +
                (avg_duration / 60) * 5  # Bonus for longer engagement
            )
            
            # Performance classification
            if engagement_rate > 10:
                performance_class = 'viral'
            elif engagement_rate > 5:
                performance_class = 'high_performing'
            elif engagement_rate > 2:
                performance_class = 'good'
            elif engagement_rate > 0.5:
                performance_class = 'average'
            else:
                performance_class = 'poor'
            
            performance_analysis[content_id] = {
                'content_id': content_id,
                'views': total_views,
                'unique_viewers': unique_viewers,
                'likes': stats['likes'],
                'shares': stats['shares'],
                'comments': stats['comments'],
                'saves': stats['saves'],
                'engagement_rate': round(engagement_rate, 2),
                'avg_view_duration': round(avg_duration, 2),
                'viral_coefficient': round(viral_coefficient, 4),
                'content_score': round(content_score, 2),
                'performance_class': performance_class,
                'first_seen': min(stats['timestamps']) if stats['timestamps'] else None,
                'last_seen': max(stats['timestamps']) if stats['timestamps'] else None
            }
        
        # Sort by content score
        sorted_content = sorted(performance_analysis.values(), key=lambda x: x['content_score'], reverse=True)
        
        return {
            'total_content_pieces': len(sorted_content),
            'content_performance': sorted_content,
            'summary_statistics': self._calculate_content_summary(sorted_content)
        }
    
    def _calculate_content_summary(self, content_list: List[Dict]) -> Dict:
        """Calculate summary statistics for content performance"""
        if not content_list:
            return {}
        
        # Performance class distribution
        class_distribution = {}
        for content in content_list:
            performance_class = content['performance_class']
            class_distribution[performance_class] = class_distribution.get(performance_class, 0) + 1
        
        # Aggregate statistics
        total_views = sum(c['views'] for c in content_list)
        total_engagement = sum(c['likes'] + c['shares'] + c['comments'] + c['saves'] for c in content_list)
        
        return {
            'total_views': total_views,
            'total_engagement_events': total_engagement,
            'avg_engagement_rate': np.mean([c['engagement_rate'] for c in content_list]),
            'avg_content_score': np.mean([c['content_score'] for c in content_list]),
            'performance_class_distribution': class_distribution,
            'top_performer': content_list[0] if content_list else None,
            'engagement_leaders': [c for c in content_list if c['performance_class'] in ['viral', 'high_performing']]
        }

class RealTimeAnalyticsPipeline:
    """Main analytics pipeline orchestrator"""
    
    def __init__(self, db_path: str = "analytics.db"):
        self.db_path = db_path
        self.event_buffer = EventBuffer()
        self.metrics_aggregator = MetricsAggregator()
        self.user_analyzer = UserBehaviorAnalyzer()
        self.content_analyzer = ContentPerformanceAnalyzer()
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Initialize database
        self._init_database()
        
        # Start background processing
        self.running = True
        self.processing_thread = threading.Thread(target=self._process_events_loop, daemon=True)
        self.processing_thread.start()
        
        logger.info("Real-time analytics pipeline initialized")
    
    def _init_database(self):
        """Initialize SQLite database for analytics storage"""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            # User events table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS user_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    session_id TEXT,
                    metadata JSON,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Content events table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS content_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    duration REAL,
                    metadata JSON,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Analytics metrics table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analytics_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_name TEXT NOT NULL,
                    metric_value REAL NOT NULL,
                    dimensions JSON,
                    timestamp DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_user_events_timestamp ON user_events(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_content_events_content_id ON content_events(content_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_content_events_timestamp ON content_events(timestamp)")
            
            conn.commit()
    
    def track_user_event(self, user_id: str, event_type: str, session_id: str = None, metadata: Dict = None):
        """Track a user event"""
        event = UserEvent(
            user_id=user_id,
            event_type=event_type,
            timestamp=datetime.now(),
            metadata=metadata or {},
            session_id=session_id
        )
        
        self.event_buffer.add_event(event)
        
        # Update real-time metrics
        self.metrics_aggregator.increment_counter(f"user_events.{event_type}")
        self.metrics_aggregator.increment_counter("user_events.total")
    
    def track_content_event(self, content_id: str, user_id: str, event_type: str, duration: float = None, metadata: Dict = None):
        """Track a content event"""
        event = ContentEvent(
            content_id=content_id,
            user_id=user_id,
            event_type=event_type,
            timestamp=datetime.now(),
            duration=duration,
            metadata=metadata or {}
        )
        
        self.event_buffer.add_event(event)
        
        # Update real-time metrics
        self.metrics_aggregator.increment_counter(f"content_events.{event_type}")
        self.metrics_aggregator.increment_counter("content_events.total")
        
        if duration:
            self.metrics_aggregator.add_to_histogram("content_duration", duration)
    
    def get_realtime_metrics(self) -> Dict:
        """Get current real-time metrics"""
        return self.metrics_aggregator.get_metrics_summary()
    
    def get_user_behavior_insights(self, lookback_hours: int = 24) -> Dict:
        """Get user behavior insights"""
        cutoff_time = datetime.now() - timedelta(hours=lookback_hours)
        
        # Get recent user events from database
        with sqlite3.connect(self.db_path) as conn:
            query = """
                SELECT user_id, event_type, timestamp, session_id, metadata
                FROM user_events 
                WHERE timestamp >= ? 
                ORDER BY timestamp DESC
            """
            cursor = conn.execute(query, (cutoff_time,))
            rows = cursor.fetchall()
        
        # Convert to UserEvent objects
        events = []
        for row in rows:
            events.append(UserEvent(
                user_id=row[0],
                event_type=row[1],
                timestamp=datetime.fromisoformat(row[2]),
                session_id=row[3],
                metadata=json.loads(row[4]) if row[4] else {}
            ))
        
        return self.user_analyzer.analyze_user_journey(events)
    
    def get_content_performance_insights(self, lookback_hours: int = 24) -> Dict:
        """Get content performance insights"""
        cutoff_time = datetime.now() - timedelta(hours=lookback_hours)
        
        # Get recent content events from database
        with sqlite3.connect(self.db_path) as conn:
            query = """
                SELECT content_id, user_id, event_type, timestamp, duration, metadata
                FROM content_events 
                WHERE timestamp >= ? 
                ORDER BY timestamp DESC
            """
            cursor = conn.execute(query, (cutoff_time,))
            rows = cursor.fetchall()
        
        # Convert to ContentEvent objects
        events = []
        for row in rows:
            events.append(ContentEvent(
                content_id=row[0],
                user_id=row[1],
                event_type=row[2],
                timestamp=datetime.fromisoformat(row[3]),
                duration=row[4],
                metadata=json.loads(row[5]) if row[5] else {}
            ))
        
        return self.content_analyzer.analyze_content_performance(events)
    
    def _process_events_loop(self):
        """Background event processing loop"""
        while self.running:
            try:
                # Get events from buffer
                events = self.event_buffer.get_events(max_events=100)
                
                if events:
                    self._persist_events(events)
                
                # Sleep briefly to prevent CPU spinning
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in event processing loop: {e}")
                time.sleep(5)  # Wait longer on error
    
    def _persist_events(self, events: List[Union[UserEvent, ContentEvent]]):
        """Persist events to database"""
        with sqlite3.connect(self.db_path) as conn:
            for event in events:
                if isinstance(event, UserEvent):
                    conn.execute("""
                        INSERT INTO user_events (user_id, event_type, timestamp, session_id, metadata)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        event.user_id,
                        event.event_type,
                        event.timestamp.isoformat(),
                        event.session_id,
                        json.dumps(event.metadata)
                    ))
                elif isinstance(event, ContentEvent):
                    conn.execute("""
                        INSERT INTO content_events (content_id, user_id, event_type, timestamp, duration, metadata)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        event.content_id,
                        event.user_id,
                        event.event_type,
                        event.timestamp.isoformat(),
                        event.duration,
                        json.dumps(event.metadata) if event.metadata else None
                    ))
            
            conn.commit()
    
    def shutdown(self):
        """Shutdown the analytics pipeline"""
        logger.info("Shutting down analytics pipeline...")
        self.running = False
        if self.processing_thread.is_alive():
            self.processing_thread.join(timeout=5)
        self.executor.shutdown(wait=True)
        logger.info("Analytics pipeline shutdown complete")

# Global pipeline instance
_pipeline_instance = None

def get_analytics_pipeline() -> RealTimeAnalyticsPipeline:
    """Get or create the global analytics pipeline instance"""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = RealTimeAnalyticsPipeline()
    return _pipeline_instance

if __name__ == "__main__":
    # Example usage
    pipeline = RealTimeAnalyticsPipeline()
    
    # Simulate some events
    pipeline.track_user_event("user123", "login", session_id="session456")
    pipeline.track_user_event("user123", "view", session_id="session456", metadata={"page": "dashboard"})
    pipeline.track_content_event("content789", "user123", "view", duration=45.5)
    
    # Wait a bit for processing
    time.sleep(2)
    
    # Get insights
    metrics = pipeline.get_realtime_metrics()
    user_insights = pipeline.get_user_behavior_insights()
    content_insights = pipeline.get_content_performance_insights()
    
    print("Real-time metrics:", json.dumps(metrics, indent=2))
    print("User behavior insights:", json.dumps(user_insights, indent=2, default=str))
    print("Content performance insights:", json.dumps(content_insights, indent=2, default=str))
    
    pipeline.shutdown()