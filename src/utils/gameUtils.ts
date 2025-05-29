// src/utils/gameUtils.ts

export function calculateTrustBasedDelay(
  trustLevel: number,
  minDelayAtHighTrust: number,
  maxDelayAtLowTrust: number,
  randomJitterRange: number = 0
): number {
  const normalizedTrust = Math.max(0, Math.min(100, trustLevel)) / 100; // Ensure trust is between 0 and 100
  const delayRange = maxDelayAtLowTrust - minDelayAtHighTrust;
  
  // Higher trust leads to shorter delays (closer to minDelayAtHighTrust)
  let calculatedDelay = maxDelayAtLowTrust - (normalizedTrust * delayRange);
  
  if (randomJitterRange > 0) {
    // Add a random jitter, ensuring it doesn't push delay outside defined min/max
    const jitter = (Math.random() - 0.5) * randomJitterRange;
    calculatedDelay += jitter;
  }
  
  // Clamp the delay to be within the min/max bounds
  return Math.max(minDelayAtHighTrust, Math.min(calculatedDelay, maxDelayAtLowTrust));
}
