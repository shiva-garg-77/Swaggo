"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Trophy, 
  Gift, 
  Star, 
  Zap,
  Crown,
  Sparkles,
  Target,
  Award,
  Calendar
} from 'lucide-react';

export default function StreakSystem({ watchStreak, setWatchStreak, walletBalance, setWalletBalance, theme }) {
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showBonusAnimation, setShowBonusAnimation] = useState(false);
  const [dailyGoalProgress, setDailyGoalProgress] = useState(3); // out of 10
  const [weeklyStreak, setWeeklyStreak] = useState(5);
  const [achievements, setAchievements] = useState([
    { id: 1, title: 'First Steps', description: 'Watch your first moment', unlocked: true, icon: <Star className="w-5 h-5" /> },
    { id: 2, title: 'Getting Started', description: 'Watch 10 moments', unlocked: true, icon: <Target className="w-5 h-5" /> },
    { id: 3, title: 'Streak Master', description: 'Maintain 7-day streak', unlocked: watchStreak >= 7, icon: <Flame className="w-5 h-5" /> },
    { id: 4, title: 'Dedicated Viewer', description: 'Watch 50 moments', unlocked: false, icon: <Trophy className="w-5 h-5" /> },
    { id: 5, title: 'Community Hero', description: 'Get 100 likes on comments', unlocked: false, icon: <Crown className="w-5 h-5" /> }
  ]);

  const streakMilestones = [
    { days: 3, reward: 0.005, title: 'Getting Warmed Up!', icon: <Flame className="w-8 h-8" /> },
    { days: 7, reward: 0.01, title: 'Week Warrior!', icon: <Trophy className="w-8 h-8" /> },
    { days: 14, reward: 0.025, title: 'Fortnight Fighter!', icon: <Star className="w-8 h-8" /> },
    { days: 30, reward: 0.05, title: 'Monthly Master!', icon: <Crown className="w-8 h-8" /> },
    { days: 100, reward: 0.1, title: 'Century Champion!', icon: <Award className="w-8 h-8" /> }
  ];

  const triggerStreakBonus = () => {
    const milestone = streakMilestones.find(m => m.days === watchStreak);
    if (milestone) {
      setWalletBalance(prev => Number((prev + milestone.reward).toFixed(6)));
      setShowBonusAnimation(true);
      setTimeout(() => setShowBonusAnimation(false), 3000);
    }
  };

  useEffect(() => {
    if (watchStreak > 0 && watchStreak % 7 === 0) {
      triggerStreakBonus();
    }
  }, [watchStreak]);

  const getStreakColor = (streak) => {
    if (streak >= 30) return 'from-purple-500 to-pink-500';
    if (streak >= 14) return 'from-blue-500 to-cyan-500';
    if (streak >= 7) return 'from-orange-500 to-red-500';
    if (streak >= 3) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  const getNextMilestone = () => {
    return streakMilestones.find(m => m.days > watchStreak) || streakMilestones[streakMilestones.length - 1];
  };

  return (
    <>
      {/* Streak Display Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowStreakModal(true)}
        className={`fixed bottom-20 left-4 z-30 flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r ${getStreakColor(watchStreak)} text-white shadow-lg backdrop-blur-md hover:shadow-xl transition-all duration-300`}
      >
        <Flame className="w-6 h-6" />
        <div className="text-sm font-bold">
          <div>{watchStreak} Day Streak</div>
          <div className="text-xs opacity-80">Daily: {dailyGoalProgress}/10</div>
        </div>
      </motion.button>

      {/* Bonus Animation */}
      <AnimatePresence>
        {showBonusAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center"
              >
                <Trophy className="w-16 h-16 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white text-center"
              >
                <h3 className="text-3xl font-bold mb-2">Streak Bonus!</h3>
                <p className="text-xl">+$0.01 Earned!</p>
                <div className="flex justify-center space-x-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + i * 0.1 }}
                    >
                      <Sparkles className="w-6 h-6 text-yellow-300" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStreakModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`w-full max-w-lg ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-6 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full bg-gradient-to-r ${getStreakColor(watchStreak)}`}>
                      <Flame className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {watchStreak} Day Streak!
                      </h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Keep watching to earn more rewards
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Daily Progress */}
                <div className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Today's Progress
                    </h4>
                    <div className="flex items-center space-x-1 text-sm text-green-500">
                      <Calendar className="w-4 h-4" />
                      <span>{dailyGoalProgress}/10 moments</span>
                    </div>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(dailyGoalProgress / 10) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                    />
                  </div>
                  <p className={`text-xs mt-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {10 - dailyGoalProgress} more moments to complete your daily goal
                  </p>
                </div>

                {/* Next Milestone */}
                <div className={`p-4 rounded-xl border-2 border-dashed ${
                  theme === 'dark' 
                    ? 'border-purple-500/50 bg-purple-500/5' 
                    : 'border-purple-300/50 bg-purple-50/50'
                }`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      {getNextMilestone().icon}
                      <h4 className={`ml-2 font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Next Milestone
                      </h4>
                    </div>
                    <p className={`text-sm mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {getNextMilestone().days} days - {getNextMilestone().title}
                    </p>
                    <p className="text-lg font-bold text-green-500">
                      Reward: +${getNextMilestone().reward}
                    </p>
                    <div className={`w-full bg-gray-200 rounded-full h-2 mt-3 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(watchStreak / getNextMilestone().days) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      />
                    </div>
                    <p className={`text-xs mt-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {getNextMilestone().days - watchStreak} more days to unlock
                    </p>
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <h4 className={`font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Achievements
                  </h4>
                  <div className="space-y-3">
                    {achievements.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: achievement.id * 0.1 }}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          achievement.unlocked
                            ? theme === 'dark'
                              ? 'bg-green-500/10 border border-green-500/20'
                              : 'bg-green-50 border border-green-200'
                            : theme === 'dark'
                              ? 'bg-gray-800/50 border border-gray-700'
                              : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${
                          achievement.unlocked
                            ? 'bg-green-500 text-white'
                            : theme === 'dark'
                              ? 'bg-gray-700 text-gray-400'
                              : 'bg-gray-200 text-gray-400'
                        }`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className={`font-medium ${
                            achievement.unlocked
                              ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {achievement.title}
                          </h5>
                          <p className={`text-xs ${
                            achievement.unlocked
                              ? theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                              : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.unlocked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          >
                            <Zap className="w-5 h-5 text-yellow-500" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Streak Rewards History */}
                <div>
                  <h4 className={`font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Streak Milestones
                  </h4>
                  <div className="space-y-3">
                    {streakMilestones.map((milestone, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          watchStreak >= milestone.days
                            ? theme === 'dark'
                              ? 'bg-yellow-500/10 border border-yellow-500/20'
                              : 'bg-yellow-50 border border-yellow-200'
                            : theme === 'dark'
                              ? 'bg-gray-800/50 border border-gray-700'
                              : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            watchStreak >= milestone.days
                              ? 'bg-yellow-500 text-white'
                              : theme === 'dark'
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-gray-200 text-gray-400'
                          }`}>
                            {milestone.icon}
                          </div>
                          <div>
                            <h5 className={`font-medium text-sm ${
                              watchStreak >= milestone.days
                                ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {milestone.days} Days - {milestone.title}
                            </h5>
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${
                          watchStreak >= milestone.days
                            ? 'text-green-500'
                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          +${milestone.reward}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
