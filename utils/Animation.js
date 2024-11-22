export class Animation {
  static async createParticles(ctx, x, y, color, count = 10) {
    const particles = []
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        radius: Math.random() * 3 + 2,
        color,
        velocity: {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8
        },
        alpha: 1
      })
    }

    return {
      update() {
        for (const particle of particles) {
          particle.x += particle.velocity.x
          particle.y += particle.velocity.y
          particle.alpha -= 0.02
        }
        particles = particles.filter(p => p.alpha > 0)
      },
      
      draw(ctx) {
        for (const particle of particles) {
          ctx.save()
          ctx.globalAlpha = particle.alpha
          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      },
      
      isFinished() {
        return particles.length === 0
      }
    }
  }
} 