import { useState, useEffect, useCallback } from 'react';
import { startTimer, endTimer } from '@/utils/performance.js';

/**
 * Progressive loading hook that loads data in stages for better UX
 * @param {Object} config - Configuration object
 * @param {Array} config.stages - Array of loading stages with priorities
 * @param {Function} config.onStageComplete - Callback when a stage completes
 * @param {boolean} config.enabled - Whether progressive loading is enabled
 */
const useProgressiveLoading = ({ stages = [], onStageComplete, enabled = true }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [completedStages, setCompletedStages] = useState(new Set());
  const [currentStage, setCurrentStage] = useState(0);
  const [overallLoading, setOverallLoading] = useState(true);

  // Initialize loading states
  useEffect(() => {
    if (!enabled || stages.length === 0) return;

    const initialStates = {};
    stages.forEach(stage => {
      initialStates[stage.key] = true;
    });
    setLoadingStates(initialStates);
  }, [stages, enabled]);

  // Execute loading stages progressively
  const executeStages = useCallback(async () => {
    if (!enabled || stages.length === 0) {
      setOverallLoading(false);
      return;
    }

    startTimer('progressive-loading');

    // Sort stages by priority (lower number = higher priority)
    const sortedStages = [...stages].sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (let i = 0; i < sortedStages.length; i++) {
      const stage = sortedStages[i];
      setCurrentStage(i);

      try {
        startTimer(`stage-${stage.key}`);
        
        // Execute stage loader
        if (stage.loader && typeof stage.loader === 'function') {
          await stage.loader();
        }

        // Mark stage as complete
        setLoadingStates(prev => ({ ...prev, [stage.key]: false }));
        setCompletedStages(prev => new Set([...prev, stage.key]));
        
        endTimer(`stage-${stage.key}`);
        
        // Call stage completion callback
        if (onStageComplete) {
          onStageComplete(stage.key, i + 1, sortedStages.length);
        }

        // Add small delay between stages for better perceived performance
        if (i < sortedStages.length - 1 && stage.delay) {
          await new Promise(resolve => setTimeout(resolve, stage.delay));
        }

      } catch (error) {
        console.error(`❌ Stage ${stage.key} failed:`, error);
        setLoadingStates(prev => ({ ...prev, [stage.key]: false }));
        
        // Continue with next stage even if current fails
        if (!stage.critical) {
          continue;
        } else {
          // Stop if critical stage fails
          break;
        }
      }
    }

    setOverallLoading(false);
    endTimer('progressive-loading');
  }, [stages, enabled, onStageComplete]);

  // Reset loading states
  const reset = useCallback(() => {
    const initialStates = {};
    stages.forEach(stage => {
      initialStates[stage.key] = true;
    });
    setLoadingStates(initialStates);
    setCompletedStages(new Set());
    setCurrentStage(0);
    setOverallLoading(true);
  }, [stages]);

  // Check if specific stage is loading
  const isStageLoading = useCallback((stageKey) => {
    return loadingStates[stageKey] || false;
  }, [loadingStates]);

  // Check if specific stage is complete
  const isStageComplete = useCallback((stageKey) => {
    return completedStages.has(stageKey);
  }, [completedStages]);

  // Get loading progress percentage
  const getProgress = useCallback(() => {
    if (stages.length === 0) return 100;
    return Math.round((completedStages.size / stages.length) * 100);
  }, [stages.length, completedStages.size]);

  return {
    // State
    loadingStates,
    overallLoading,
    currentStage,
    completedStages: Array.from(completedStages),
    
    // Methods
    executeStages,
    reset,
    isStageLoading,
    isStageComplete,
    getProgress,
    
    // Computed
    isComplete: completedStages.size === stages.length,
    hasStarted: completedStages.size > 0,
  };
};

export default useProgressiveLoading;