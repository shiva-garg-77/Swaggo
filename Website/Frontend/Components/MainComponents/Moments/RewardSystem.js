"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Flame, Trophy, Gift } from 'lucide-react';

// Placeholder reward system. Integrate with your blockchain backend via GraphQL/REST.
export default function RewardSystem({ currentMoment, walletBalance, setWalletBalance, watchStreak, setWatchStreak, watchTimeRef }) {
  // Local animation state for coin burst
  const coinBurst = {
    initial: { opacity: 0, y: 10, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.9 },
    transition: { duration: 0.3 }
  };

  // Simulate reward accrual when user watches for 2 minutes uniquely (placeholder logic)
  // Replace with on-chain verification + unique watch check from backend
  const handleSimulateReward = () => {
    // Only reward once per moment in this placeholder
    if (watchTimeRef.current[currentMoment.id] >= 120 && !watchTimeRef.current[`rewarded_${currentMoment.id}`]) {
      const newBalance = Number((walletBalance + 0.001).toFixed(6));
      setWalletBalance(newBalance);
      setWatchStreak(watchStreak + 1);
      watchTimeRef.current[`rewarded_${currentMoment.id}`] = true;
    }
  };

  return (
    <div className="absolute top-4 left-4 z-20">
      <div className="flex items-center space-x-3 bg-black/40 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
        <Coins className="w-5 h-5 text-yellow-300" />
        <div className="text-sm">
          <div className="font-semibold">Wallet</div>
          <div className="text-white/80">${walletBalance.toFixed(6)}</div>
        </div>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <Flame className="w-5 h-5 text-orange-400" />
        <div className="text-sm">
          <div className="font-semibold">Streak</div>
          <div className="text-white/80">{watchStreak} days</div>
        </div>
        <button
          onClick={handleSimulateReward}
          className="ml-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold hover:from-yellow-400 hover:to-orange-400 transition-all"
        >
          Simulate +$0.001
        </button>
      </div>

      {/* Floating coins when balance increases (placeholder trigger via simulate) */}
      <AnimatePresence>
        {/* Could show a transient coin burst when rewarded; hook into actual reward event */}
      </AnimatePresence>
    </div>
  );
}

