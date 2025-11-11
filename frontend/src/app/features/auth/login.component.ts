import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

declare var anime: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  username = '';
  password = '';
  error = '';
  loading = false;
  hidePassword = true; // Para mostrar/ocultar contraseña
  
  // Branding personalizado
  brandingName = 'Ramen SOC';
  brandingSubtitle = 'Orquestador de Seguridad';
  brandingLoginLogo = 'assets/ramen-logo.svg';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Cargar branding personalizado
    this.loadBranding();
    
    // Capturar token de OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const provider = urlParams.get('provider');
    const error = urlParams.get('error');

    if (error) {
      this.error = decodeURIComponent(error);
      // Limpiar URL
      window.history.replaceState({}, document.title, '/login');
      return;
    }

    if (token) {
      // Login exitoso con OAuth
      console.log(`OAuth login exitoso con ${provider}`);
      localStorage.setItem('token', token);
      
      // Animación de éxito
      anime({
        targets: '.login-card',
        scale: [1, 0.95],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInQuad',
        complete: () => {
          this.router.navigate(['/modules']);
        }
      });
      return;
    }
    
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/modules']);
    }
  }

  ngAfterViewInit() {
    // Animación de entrada con anime.js
    anime.timeline({
      easing: 'easeOutExpo'
    })
    .add({
      targets: '.login-card',
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 800
    })
    .add({
      targets: '.login-logo',
      scale: [0.8, 1],
      rotate: [-10, 0],
      opacity: [0, 1],
      duration: 600
    }, '-=400')
    .add({
      targets: '.login-field',
      translateX: [-30, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 500
    }, '-=300');
  }

  async onSubmit() {
    // FIX: Eliminar espacios en blanco al inicio y final
    this.username = this.username.trim();
    this.password = this.password.trim();
    
    if (!this.username || !this.password) {
      this.error = 'Ingrese usuario y contraseña';
      this.shakeForm();
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('Intentando login con:', this.username);

    try {
      const token = await this.authService.login(this.username, this.password);
      console.log('Login exitoso, token:', token?.substring(0, 20) + '...');
      
      // Mostrar loading animation personalizada
      this.showLoadingAnimation();
    } catch (err: any) {
      console.error('Error en login:', err);
      this.error = err?.error?.msg || 'Credenciales inválidas';
      this.loading = false;
      this.shakeForm();
    }
  }

  showLoadingAnimation() {
    // Obtener configuración de branding
    const branding = JSON.parse(localStorage.getItem('branding') || '{}');
    const loadingAnimationUrl = branding.loadingAnimationUrl || '';

    // Crear overlay de loading - CENTRADO CON FONDO BLANCO SEMI-TRANSPARENTE
    const overlay = document.createElement('div');
    overlay.className = 'custom-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      opacity: 0;
    `;
    
    overlay.innerHTML = `
      <div class="custom-loading-content" style="text-align: center; opacity: 0;">
        ${loadingAnimationUrl ? 
          `<img src="${loadingAnimationUrl}" alt="Loading" class="custom-loading-image" style="max-width: 300px; max-height: 300px; object-fit: contain; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.1));" />` :
          '<div class="default-ramen-loading" style="font-size: 120px;">🍜</div>'
        }
        <p class="custom-loading-text" style="margin-top: 24px; font-size: 18px; font-weight: 600; color: #667eea;">Cargando...</p>
      </div>
    `;
    document.body.appendChild(overlay);

    const content = overlay.querySelector('.custom-loading-content') as HTMLElement;
    const image = overlay.querySelector('.custom-loading-image, .default-ramen-loading') as HTMLElement;

    // ANIMACIÓN CON ANIME.JS - Entrada dramática
    const timeline = anime.timeline({
      easing: 'easeOutExpo'
    });

    // 1. Fade in del overlay
    timeline.add({
      targets: overlay,
      opacity: [0, 1],
      duration: 400
    });

    // 2. Contenido aparece con escala y rotación
    timeline.add({
      targets: content,
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: 600
    }, '-=200');

    // 3. Imagen/emoji pulsa continuamente
    timeline.add({
      targets: image,
      scale: [1, 1.15, 1],
      rotate: [0, 5, -5, 0],
      duration: 1000,
      loop: true,
      easing: 'easeInOutQuad'
    }, '-=400');

    // Después de 2 segundos, desvanecer GRADUALMENTE a transparencia total
    setTimeout(() => {
      // Detener la animación del loop
      anime.remove(image);
      
      // Timeline de salida - desvanecimiento gradual
      const fadeOut = anime.timeline({
        easing: 'easeInQuad'
      });

      // 1. Contenido se hace pequeño y transparente
      fadeOut.add({
        targets: content,
        opacity: [1, 0],
        scale: [1, 0.8],
        duration: 400
      });

      // 2. Overlay se desvanece completamente
      fadeOut.add({
        targets: overlay,
        opacity: [1, 0],
        duration: 500,
        complete: () => {
          overlay.remove();
          this.router.navigate(['/modules']);
        }
      }, '-=200');
    }, 2000);
  }

  loginWithMicrosoft() {
    this.loading = true;
    this.error = '';
    
    // TODO: Configurar Azure AD en backend y obtener CLIENT_ID
    // Por ahora, redirigir a endpoint de configuración
    alert('⚙️ OAuth Microsoft: Configurar Azure AD\n\n' +
          '1. Crear App Registration en Azure Portal\n' +
          '2. Configurar Redirect URI: http://localhost:4000/api/auth/microsoft/callback\n' +
          '3. Agregar CLIENT_ID y CLIENT_SECRET al backend\n' +
          '4. Reiniciar servidor\n\n' +
          'Ver documentación en README.md');
    
    this.loading = false;
    
    // Cuando esté configurado, descomentar:
    // window.location.href = 'http://localhost:4000/api/auth/microsoft';
  }

  loginWithGoogle() {
    this.loading = true;
    this.error = '';
    
    // TODO: Configurar Google OAuth en backend y obtener CLIENT_ID
    // Por ahora, redirigir a endpoint de configuración
    alert('⚙️ OAuth Google: Configurar Google Cloud Console\n\n' +
          '1. Crear proyecto en Google Cloud Console\n' +
          '2. Habilitar Google+ API\n' +
          '3. Crear OAuth 2.0 Client ID\n' +
          '4. Configurar Redirect URI: http://localhost:4000/api/auth/google/callback\n' +
          '5. Agregar CLIENT_ID y CLIENT_SECRET al backend\n' +
          '6. Reiniciar servidor\n\n' +
          'Ver documentación en README.md');
    
    this.loading = false;
    
    // Cuando esté configurado, descomentar:
    // window.location.href = 'http://localhost:4000/api/auth/google';
  }

  private shakeForm() {
    anime({
      targets: '.login-card',
      translateX: [
        { value: -10, duration: 100 },
        { value: 10, duration: 100 },
        { value: -10, duration: 100 },
        { value: 10, duration: 100 },
        { value: 0, duration: 100 }
      ],
      easing: 'easeInOutSine'
    });
  }

  loadBranding() {
    try {
      const branding = JSON.parse(localStorage.getItem('branding') || '{}');
      if (branding.appName) {
        this.brandingName = branding.appName;
      }
      if (branding.loginLogoUrl) {
        this.brandingLoginLogo = branding.loginLogoUrl;
      }
    } catch (err) {
      console.log('Using default branding');
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
