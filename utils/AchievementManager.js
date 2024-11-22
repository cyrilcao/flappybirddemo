export class AchievementManager {
  constructor() {
    this.achievements = {
      firstFlight: {
        id: 'firstFlight',
        title: '初次飞行',
        description: '开始你的第一次飞行',
        icon: '🐤',
        unlocked: false
      },
      highFlyer: {
        id: 'highFlyer',
        title: '高空飞手',
        description: '达到10分',
        icon: '🦅',
        unlocked: false
      },
      masterPilot: {
        id: 'masterPilot',
        title: '飞行大师',
        description: '达到50分',
        icon: '👑',
        unlocked: false
      }
    }
    
    this.loadProgress()
  }

  loadProgress() {
    try {
      const saved = wx.getStorageSync('achievements')
      if (saved) {
        Object.keys(saved).forEach(id => {
          if (this.achievements[id]) {
            this.achievements[id].unlocked = saved[id]
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load achievements:', error)
    }
  }

  saveProgress() {
    try {
      const save = {}
      Object.keys(this.achievements).forEach(id => {
        save[id] = this.achievements[id].unlocked
      })
      wx.setStorageSync('achievements', save)
    } catch (error) {
      console.warn('Failed to save achievements:', error)
    }
  }

  checkAchievements(score) {
    const newUnlocks = []
    
    if (!this.achievements.firstFlight.unlocked) {
      this.achievements.firstFlight.unlocked = true
      newUnlocks.push(this.achievements.firstFlight)
    }
    
    if (score >= 10 && !this.achievements.highFlyer.unlocked) {
      this.achievements.highFlyer.unlocked = true
      newUnlocks.push(this.achievements.highFlyer)
    }
    
    if (score >= 50 && !this.achievements.masterPilot.unlocked) {
      this.achievements.masterPilot.unlocked = true
      newUnlocks.push(this.achievements.masterPilot)
    }
    
    if (newUnlocks.length > 0) {
      this.saveProgress()
    }
    
    return newUnlocks
  }
} 