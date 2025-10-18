// Storage Quota Monitoring Module
// Proactively monitors IndexedDB storage usage and warns users before quota is exceeded

/**
 * Storage quota thresholds (percentages)
 */
const QUOTA_THRESHOLDS = {
  WARNING: 80,   // Show warning at 80% usage
  CRITICAL: 90,  // Show critical warning at 90% usage
  DANGER: 95     // Show urgent warning at 95% usage
};

/**
 * Check current storage quota usage
 * @returns {Promise<Object|null>} Storage info {usage, quota, percentUsed, level} or null if not supported
 */
export async function checkStorageQuota() {
  // Check if Storage API is available
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn('[Storage Monitor] Storage API not available');
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;

    if (quota === 0) {
      return null; // Quota information not available
    }

    const percentUsed = (usage / quota) * 100;
    const level = getQuotaLevel(percentUsed);

    return {
      usage,           // Bytes used
      quota,           // Total bytes available
      percentUsed,     // Percentage used (0-100)
      level,           // 'safe', 'warning', 'critical', 'danger'
      usageMB: (usage / (1024 * 1024)).toFixed(2),
      quotaMB: (quota / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('[Storage Monitor] Error checking quota:', error);
    return null;
  }
}

/**
 * Determine quota warning level based on percentage used
 * @param {number} percentUsed - Percentage of quota used
 * @returns {string} Warning level: 'safe', 'warning', 'critical', 'danger'
 */
function getQuotaLevel(percentUsed) {
  if (percentUsed >= QUOTA_THRESHOLDS.DANGER) {
    return 'danger';
  } else if (percentUsed >= QUOTA_THRESHOLDS.CRITICAL) {
    return 'critical';
  } else if (percentUsed >= QUOTA_THRESHOLDS.WARNING) {
    return 'warning';
  }
  return 'safe';
}

/**
 * Get user-friendly storage status message
 * @param {Object} quotaInfo - Result from checkStorageQuota()
 * @returns {string} Status message
 */
export function getStorageStatusMessage(quotaInfo) {
  if (!quotaInfo) {
    return 'Storage usage information not available';
  }

  const { usageMB, quotaMB, percentUsed, level } = quotaInfo;

  switch (level) {
    case 'danger':
      return `⚠️ Storage critically full (${percentUsed.toFixed(1)}%)! Using ${usageMB}MB of ${quotaMB}MB. Delete old data immediately to prevent save failures.`;
    case 'critical':
      return `⚠️ Storage almost full (${percentUsed.toFixed(1)}%). Using ${usageMB}MB of ${quotaMB}MB. Consider deleting old conversations or prompts.`;
    case 'warning':
      return `Storage usage high (${percentUsed.toFixed(1)}%). Using ${usageMB}MB of ${quotaMB}MB.`;
    case 'safe':
    default:
      return `Storage: ${usageMB}MB / ${quotaMB}MB (${percentUsed.toFixed(1)}%)`;
  }
}

/**
 * Check if storage operation should be allowed based on quota
 * @param {number} estimatedSize - Estimated size of operation in bytes (optional)
 * @returns {Promise<Object>} {allowed: boolean, reason: string, quotaInfo: Object}
 */
export async function canPerformStorageOperation(estimatedSize = 0) {
  const quotaInfo = await checkStorageQuota();

  if (!quotaInfo) {
    // If quota info not available, allow operation (fail gracefully)
    return {
      allowed: true,
      reason: 'Quota information not available, proceeding',
      quotaInfo: null
    };
  }

  // Check if we're at danger level
  if (quotaInfo.level === 'danger') {
    return {
      allowed: false,
      reason: `Storage critically full (${quotaInfo.percentUsed.toFixed(1)}%). Delete old data before saving.`,
      quotaInfo
    };
  }

  // Check if operation would push us over quota
  if (estimatedSize > 0) {
    const projectedUsage = quotaInfo.usage + estimatedSize;
    const projectedPercent = (projectedUsage / quotaInfo.quota) * 100;

    if (projectedPercent >= 100) {
      return {
        allowed: false,
        reason: `Operation would exceed storage quota. Free up space before saving.`,
        quotaInfo
      };
    }
  }

  return {
    allowed: true,
    reason: 'Storage available',
    quotaInfo
  };
}

/**
 * Show storage warning notification to user
 * @param {Object} quotaInfo - Result from checkStorageQuota()
 */
export function showStorageWarning(quotaInfo) {
  if (!quotaInfo || quotaInfo.level === 'safe') {
    return; // No warning needed
  }

  const message = getStorageStatusMessage(quotaInfo);

  // Use chrome.notifications if available
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/icon128.png',
      title: 'Storage Warning',
      message: message,
      priority: quotaInfo.level === 'danger' ? 2 : 1
    }).catch(() => {
      // Fallback to console if notifications fail
      console.warn(`[Storage Monitor] ${message}`);
    });
  } else {
    console.warn(`[Storage Monitor] ${message}`);
  }
}

/**
 * Estimate size of an object in bytes (rough estimate)
 * @param {Object} obj - Object to estimate size of
 * @returns {number} Estimated size in bytes
 */
export function estimateObjectSize(obj) {
  try {
    const jsonString = JSON.stringify(obj);
    // Each character in JavaScript is 2 bytes (UTF-16)
    return jsonString.length * 2;
  } catch (error) {
    console.error('[Storage Monitor] Error estimating object size:', error);
    return 0;
  }
}

/**
 * Monitor storage quota and show warnings if needed
 * Should be called periodically or after large storage operations
 * @returns {Promise<Object|null>} Current quota info
 */
export async function monitorStorageQuota() {
  const quotaInfo = await checkStorageQuota();

  if (quotaInfo && quotaInfo.level !== 'safe') {
    showStorageWarning(quotaInfo);
  }

  return quotaInfo;
}
