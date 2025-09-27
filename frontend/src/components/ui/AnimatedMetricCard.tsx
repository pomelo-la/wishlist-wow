'use client';

import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { LucideIcon } from 'lucide-react';

interface AnimatedMetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}

export default function AnimatedMetricCard({
  title,
  value,
  previousValue,
  suffix = '',
  prefix = '',
  icon: Icon,
  color,
  delay = 0,
  trend,
  trendValue
}: AnimatedMetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
      }}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && trendValue && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3 }}
            className={`flex items-center text-sm font-medium ${getTrendColor()}`}
          >
            <span className="mr-1">{getTrendIcon()}</span>
            {trendValue}%
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="text-3xl font-bold text-gray-900"
        >
          {prefix}
          <CountUp
            start={previousValue || 0}
            end={value}
            duration={2}
            delay={delay}
            preserveValue
          />
          {suffix}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
          className="text-sm font-medium text-gray-600"
        >
          {title}
        </motion.p>
      </div>
    </motion.div>
  );
}