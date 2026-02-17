// Simple notification sound utility
class NotificationSound {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  // Initialize audio context
  init() {
    try {
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.enabled = false;
    }
  }

  // Play a simple notification beep
  playNotification() {
    if (!this.enabled) return;

    try {
      this.init();
      
      if (!this.audioContext) return;

      // Create oscillator for beep sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure sound
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz frequency
      oscillator.type = 'sine';

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

      // Play sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Play a more pleasant notification sound
  playMessageNotification() {
    if (!this.enabled) return;

    try {
      this.init();
      
      if (!this.audioContext) return;

      // Create two-tone notification
      this.playTone(600, 0.1, 0.1);
      setTimeout(() => {
        this.playTone(800, 0.1, 0.1);
      }, 150);

    } catch (error) {
      console.warn('Failed to play message notification sound:', error);
    }
  }

  // Helper method to play a single tone
  playTone(frequency, duration, volume) {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play tone:', error);
    }
  }

  // Enable/disable sound
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Check if sound is enabled
  isEnabled() {
    return this.enabled;
  }
}

// Create singleton instance
const notificationSound = new NotificationSound();

export default notificationSound;