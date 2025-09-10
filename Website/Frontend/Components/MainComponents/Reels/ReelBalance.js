"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Flame, Trophy, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ReelBalance({ walletBalance, watchStreak, theme, isEarningRewards = true }) {
  const [previousBalance, setPreviousBalance] = useState(walletBalance);
  const [showEarning, setShowEarning] = useState(false);

  useEffect(() => {
    if (walletBalance > previousBalance) {
      setShowEarning(true);
      setTimeout(() => setShowEarning(false), 2000);
      setPreviousBalance(walletBalance);
    }
  }, [walletBalance, previousBalance]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg"
    >
      <div className="flex items-center space-x-3">
        {/* Wallet Balance */}
        <div className="flex items-center space-x-1.5">
          <div className="p-1.5 bg-yellow-500 rounded-full">
            <Coins className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="relative">
            <p className="text-white font-semibold text-xs">${walletBalance.toFixed(4)}</p>
            <AnimatePresence>
              {showEarning && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -10 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute -top-3 left-0 flex items-center space-x-1"
                >
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs font-bold">+${(walletBalance - previousBalance).toFixed(4)}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/30"></div>

        {/* Earning Rate */}
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            isEarningRewards 
              ? 'bg-green-400 animate-pulse' 
              : 'bg-orange-400 animate-pulse'
          }`}></div>
          <p className={`text-xs font-medium ${
            isEarningRewards 
              ? 'text-green-400' 
              : 'text-orange-400'
          }`}>
            {isEarningRewards ? '+$0.0010/2min' : 'Recently Watched'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
