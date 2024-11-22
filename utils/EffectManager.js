export class EffectManager {
  constructor(canvas) {
    this.canvas = canvas
    this.effects = []
    this.effectsPool = {
      particles: [],
      popups: []
    }
    this.maxPoolSize = 100
  }

  getFromPool(type, createFn) {
    const pool = this.effectsPool[type]
    return pool.length > 0 ? pool.pop() : createFn()
  }

  returnToPool(type, obj) {
    const pool = this.effectsPool[type]
    if (pool.length < this.maxPoolSize) {
      pool.push(obj)
    }
  }

  addScorePopup(x, y, text) {
    const popup = {
      x,
      y,
      text,
      alpha: 1,
      scale: 1,
      update() {
        this.y -= 2
        this.alpha -= 0.02
        this.scale += 0.03
        return this.alpha > 0
      },
      draw(ctx) {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.font = `${20 * this.scale}px Arial`
        ctx.fillStyle = '#FFD700'
        ctx.textAlign = 'center'
        ctx.fillText(this.text, this.x, this.y)
        ctx.restore()
      }
    }
    this.effects.push(popup)
  }

  addParticles(x, y, options) {
    const { count = 10, color = '#FFD700', speed = 2 } = options
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        update() {
          this.x += this.vx
          this.y += this.vy
          this.alpha -= 0.02
          return this.alpha > 0
        },
        draw(ctx) {
          ctx.save()
          ctx.globalAlpha = this.alpha
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
      this.effects.push(particle)
    }
  }

  update() {
    this.effects = this.effects.filter(effect => effect.update())
  }

  draw(ctx) {
    ctx.save()
    
    for (const effect of this.effects) {
      if (effect.draw) {
        effect.draw(ctx)
      }
    }
    
    ctx.restore()
  }

  clear() {
    this.effects.forEach(effect => {
      if (effect.type) {
        this.returnToPool(effect.type, effect)
      }
    })
    this.effects = []
  }

  addLevelUpEffect() {
    const flash = {
      alpha: 0.6,
      duration: 500,
      startTime: Date.now(),
      update() {
        const elapsed = Date.now() - this.startTime
        this.alpha = 0.6 * (1 - elapsed / this.duration)
        return elapsed < this.duration
      },
      draw(ctx) {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.restore()
      }
    }
    this.effects.push(flash)
  }

  addAchievementEffect(text, icon) {
    const achievement = {
      y: this.canvas.height * 0.3,
      alpha: 0,
      scale: 0.5,
      phase: 'in',
      update() {
        switch(this.phase) {
          case 'in':
            this.alpha += 0.05
            this.scale += 0.05
            if (this.alpha >= 1) {
              this.phase = 'show'
              this.timer = Date.now()
            }
            break
          case 'show':
            if (Date.now() - this.timer > 2000) {
              this.phase = 'out'
            }
            break
          case 'out':
            this.alpha -= 0.05
            break
        }
        return this.alpha > 0
      },
      draw(ctx) {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.translate(ctx.canvas.width/2, this.y)
        ctx.scale(this.scale, this.scale)
        
        const x = -150
        const y = -40
        const width = 300
        const height = 80
        const radius = 10
        
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()
        
        ctx.font = '30px Arial'
        ctx.fillStyle = '#FFD700'
        ctx.fillText(icon, -120, 10)
        
        ctx.font = '20px Arial'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(text, -80, 10)
        
        ctx.restore()
      }
    }
    this.effects.push(achievement)
  }

  addScreenShake(intensity = 5, duration = 200) {
    const shakeEffect = {
      intensity,
      duration,
      startTime: Date.now(),
      active: true,
      offset: { x: 0, y: 0 },
      update() {
        const elapsed = Date.now() - this.startTime
        if (elapsed >= this.duration) {
          this.active = false
          this.offset = { x: 0, y: 0 }
          return false
        }
        
        const progress = elapsed / this.duration
        const decay = 1 - progress
        const currentIntensity = this.intensity * decay
        
        this.offset = {
          x: (Math.random() * 2 - 1) * currentIntensity,
          y: (Math.random() * 2 - 1) * currentIntensity
        }
        
        return true
      },
      draw(ctx) {
        if (this.active && this.offset) {
          ctx.translate(this.offset.x, this.offset.y)
        }
      }
    }
    
    this.effects.push(shakeEffect)
  }

  addExplosion(x, y) {
    this.addParticles(x, y, {
      count: 20,
      color: '#FF4444',
      speed: 4
    })
    
    this.addParticles(x, y, {
      count: 15,
      color: '#FFD700',
      speed: 3
    })
    
    const smoke = {
      x,
      y,
      radius: 2,
      alpha: 0.8,
      expansion: 1.05,
      update() {
        this.radius *= this.expansion
        this.alpha *= 0.95
        return this.alpha > 0.1
      },
      draw(ctx) {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.fillStyle = '#888888'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
    this.effects.push(smoke)
  }

  drawDifficultyLevel(ctx, level) {
    ctx.save()
    
    ctx.font = '20px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    const text = `难度: ${level}`
    const padding = 8
    const metrics = ctx.measureText(text)
    const bgWidth = metrics.width + padding * 2
    const bgHeight = 24 + padding * 2
    
    const x = 10
    const y = 10
    const radius = 4
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + bgWidth - radius, y)
    ctx.arcTo(x + bgWidth, y, x + bgWidth, y + radius, radius)
    ctx.lineTo(x + bgWidth, y + bgHeight - radius)
    ctx.arcTo(x + bgWidth, y + bgHeight, x + bgWidth - radius, y + bgHeight, radius)
    ctx.lineTo(x + radius, y + bgHeight)
    ctx.arcTo(x, y + bgHeight, x, y + bgHeight - radius, radius)
    ctx.lineTo(x, y + radius)
    ctx.arcTo(x, y, x + radius, y, radius)
    ctx.closePath()
    ctx.fill()
    
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(text, x + padding, y + padding)
    
    ctx.restore()
  }
} 