import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<any>(null);
  tokenKey = 'ramen_token';
  private apiUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {
    const t = localStorage.getItem(this.tokenKey);
    if(t) this.setToken(t);
  }

  async login(username: string, password: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{token: string}>(`${this.apiUrl}/auth/login`, { username, password })
    );
    this.setToken(response.token);
    return response.token;
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  setToken(token: string){
    localStorage.setItem(this.tokenKey, token);
    try { this._user$.next(jwtDecode(token)); } catch(e){ this._user$.next(null); }
  }

  logout(){ 
    // Limpiar tokens y datos
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('branding');
    this._user$.next(null);
    
    // FORZAR limpieza del caché del navegador
    // Esto recarga la página con caché deshabilitado
    if (window.location) {
      window.location.href = window.location.origin + '/login?nocache=' + Date.now();
    }
  }

  hasRole(r: string){ 
    const u = this._user$.value; 
    return u?.roles?.includes(r); 
  }

  getCurrentUser() {
    return this._user$.value;
  }

  getAuthToken(){ 
    return localStorage.getItem(this.tokenKey); 
  }

  get user$(){ 
    return this._user$.asObservable(); 
  }
}
