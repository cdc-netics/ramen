import { Component, Input, OnInit } from '@angular/core';

declare var anime: any;

@Component({
  selector: 'app-loading-animation',
  template: `
    <div class="loading-overlay" *ngIf="show">
      <div class="loading-content">
        <img 
          *ngIf="animationUrl" 
          [src]="animationUrl" 
          alt="Loading" 
          class="loading-image"
        />
        <div *ngIf="!animationUrl" class="default-ramen">
          <div class="ramen-bowl">
            🍜
          </div>
        </div>
        <p class="loading-text">{{ text }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .loading-content {
      text-align: center;
      animation: fadeInScale 0.5s ease-out;
    }

    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .loading-image {
      max-width: 300px;
      max-height: 300px;
      object-fit: contain;
      filter: drop-shadow(0 10px 30px rgba(0,0,0,0.1));
      animation: float 2s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    .default-ramen {
      .ramen-bowl {
        font-size: 120px;
        animation: bounce 1s ease-in-out infinite;
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-30px); }
    }

    .loading-text {
      margin-top: 24px;
      font-size: 18px;
      font-weight: 600;
      color: #667eea;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class LoadingAnimationComponent implements OnInit {
  @Input() show = false;
  @Input() animationUrl = '';
  @Input() text = 'Cargando...';
  @Input() duration = 2000; // milisegundos

  ngOnInit() {
    if (this.show) {
      this.startAnimation();
    }
  }

  startAnimation() {
    // Anime.js animation
    if (typeof anime !== 'undefined') {
      anime({
        targets: '.loading-overlay',
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
      });

      anime({
        targets: '.loading-image, .ramen-bowl',
        scale: [0.5, 1],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutElastic(1, .5)'
      });

      // Auto-hide después de duration
      setTimeout(() => {
        this.hide();
      }, this.duration);
    }
  }

  hide() {
    if (typeof anime !== 'undefined') {
      anime({
        targets: '.loading-overlay',
        opacity: [1, 0],
        duration: 500,
        easing: 'easeInQuad',
        complete: () => {
          this.show = false;
        }
      });
    } else {
      this.show = false;
    }
  }
}
