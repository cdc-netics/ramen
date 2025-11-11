import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  user: string;
  action: string;
  resource: string;
  details: string;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  filterLevel: string = 'all';
  filterUser: string = '';
  filterAction: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadLogs();
  }

  async loadLogs() {
    try {
      const token = localStorage.getItem('ramen_token');
      
      // Construir query params según filtros
      let url = 'http://localhost:4000/api/logs?limit=500';
      if (this.filterLevel !== 'all') url += `&level=${this.filterLevel}`;
      if (this.filterUser) url += `&user=${this.filterUser}`;
      if (this.filterAction) url += `&action=${this.filterAction}`;
      
      const data = await this.http.get<LogEntry[]>(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).toPromise();
      
      this.logs = data || [];
      this.filteredLogs = [...this.logs];
      
      console.log(`✅ Cargados ${this.logs.length} logs del sistema`);
    } catch(err) {
      console.error('Error loading logs:', err);
      // Fallback a demo data si falla
      this.loadDemoData();
    }
  }

  loadDemoData() {
    // Demo data como fallback
    this.logs = [
      {
        timestamp: new Date(Date.now() - 300000),
        level: 'success',
        user: 'owner',
        action: 'login',
        resource: 'auth',
        details: 'Inicio de sesión exitoso desde IP 192.168.1.100'
      },
      {
        timestamp: new Date(Date.now() - 600000),
        level: 'info',
        user: 'owner',
        action: 'create',
        resource: 'module',
        details: 'Creó módulo "Bitácora (React)"'
      },
      {
        timestamp: new Date(Date.now() - 900000),
        level: 'info',
        user: 'owner',
        action: 'update',
        resource: 'user',
        details: 'Modificó usuario "admin" - agregó rol Admin'
      },
      {
        timestamp: new Date(Date.now() - 1200000),
        level: 'warning',
        user: 'admin',
        action: 'failed_login',
        resource: 'auth',
        details: 'Intento de login fallido - contraseña incorrecta'
      },
      {
        timestamp: new Date(Date.now() - 1800000),
        level: 'success',
        user: 'owner',
        action: 'delete',
        resource: 'user',
        details: 'Eliminó usuario "test_user"'
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        level: 'info',
        user: 'owner',
        action: 'access',
        resource: 'module',
        details: 'Accedió al módulo "LeakedPasswords"'
      },
      {
        timestamp: new Date(Date.now() - 7200000),
        level: 'error',
        user: 'system',
        action: 'error',
        resource: 'module',
        details: 'Error al cargar módulo "Hallazgos" - timeout de conexión'
      }
    ];
    
    this.filteredLogs = [...this.logs];
  }

  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      const levelMatch = this.filterLevel === 'all' || log.level === this.filterLevel;
      const userMatch = !this.filterUser || log.user.toLowerCase().includes(this.filterUser.toLowerCase());
      const actionMatch = !this.filterAction || log.action.toLowerCase().includes(this.filterAction.toLowerCase());
      
      return levelMatch && userMatch && actionMatch;
    });
  }

  clearFilters() {
    this.filterLevel = 'all';
    this.filterUser = '';
    this.filterAction = '';
    this.applyFilters();
  }

  getLevelIcon(level: string): string {
    const icons: any = {
      'info': 'info',
      'warning': 'warning',
      'error': 'error',
      'success': 'check_circle'
    };
    return icons[level] || 'info';
  }

  getLevelClass(level: string): string {
    return `level-${level}`;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  }

  exportLogs() {
    const csv = this.logsToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ramen-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  private logsToCSV(): string {
    const header = 'Timestamp,Level,User,Action,Resource,Details\n';
    const rows = this.filteredLogs.map(log => 
      `${new Date(log.timestamp).toISOString()},${log.level},${log.user},${log.action},${log.resource},"${log.details}"`
    ).join('\n');
    return header + rows;
  }
}
