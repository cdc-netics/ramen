import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

declare var anime: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = {
    totalModules: 0,
    totalUsers: 0,
    activeModules: 0,
    onlineUsers: 0
  };

  recentActivity: any[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
    this.animateCards();
  }

  async loadStats() {
    try {
      const data = await this.http.get<any>('http://localhost:4000/api/stats').toPromise();
      this.stats = {
        totalModules: data.totalModules || 0,
        totalUsers: data.totalUsers || 0,
        activeModules: data.activeModules || 0,
        onlineUsers: data.onlineUsers || 0
      };
      this.recentActivity = data.recentActivity || [];
    } catch(err) {
      console.error('Error loading stats:', err);
    }
  }

  animateCards() {
    anime({
      targets: '.stat-card',
      translateY: [30, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 600,
      easing: 'easeOutExpo'
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
