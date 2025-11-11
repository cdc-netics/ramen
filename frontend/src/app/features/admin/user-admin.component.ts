import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

declare var anime: any;

@Component({
  selector: 'app-user-admin',
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.scss']
})
export class UserAdminComponent implements OnInit {
  users: any[] = [];
  showForm = false;
  editingUser: any = null;

  newUser = {
    username: '',
    fullName: '',
    email: '',
    password: '',
    roles: [] as string[],
    status: 'active'
  };

  allRoles = ['Owner', 'Admin', 'User', 'Visor'];

  // Password dialog
  showPasswordDialog = false;
  passwordUser: any = null;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordError = '';
  currentUser: any = null;

  constructor(private http: HttpClient, private router: Router) {
    // Obtener usuario actual del token
    const token = localStorage.getItem('ramen_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser = { username: payload.username, id: payload.sub };
      } catch(e) {
        console.error('Error parsing token:', e);
      }
    }
  }

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.http.get<any[]>('http://localhost:4000/api/users').toPromise() || [];
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  openForm(user?: any) {
    if (user) {
      this.editingUser = user;
      this.newUser = {
        username: user.username,
        fullName: user.fullName,
        email: user.email || '',
        password: '',
        roles: [...user.roles],
        status: user.status || 'active'
      };
    } else {
      this.editingUser = null;
      this.newUser = {
        username: '',
        fullName: '',
        email: '',
        password: '',
        roles: [],
        status: 'active'
      };
    }
    this.showForm = true;
    
    setTimeout(() => {
      anime({
        targets: '.user-form',
        translateX: [-300, 0],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutExpo'
      });
    }, 10);
  }

  closeForm() {
    anime({
      targets: '.user-form',
      translateX: [0, -300],
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInQuad',
      complete: () => {
        this.showForm = false;
        this.editingUser = null;
      }
    });
  }

  toggleRole(role: string) {
    const index = this.newUser.roles.indexOf(role);
    if (index > -1) {
      this.newUser.roles.splice(index, 1);
    } else {
      this.newUser.roles.push(role);
    }
  }

  async saveUser() {
    // Validación básica
    if (!this.newUser.username || !this.newUser.fullName) {
      alert('Username y nombre completo son requeridos');
      return;
    }

    if (!this.editingUser && !this.newUser.password) {
      alert('La contraseña es requerida para nuevos usuarios');
      return;
    }

    if (this.newUser.roles.length === 0) {
      alert('Debe seleccionar al menos un rol');
      return;
    }

    try {
      if (this.editingUser) {
        // Update existing - solo enviar password si se cambió
        const updateData: any = {
          fullName: this.newUser.fullName,
          email: this.newUser.email,
          roles: this.newUser.roles,
          status: this.newUser.status
        };
        
        if (this.newUser.password) {
          updateData.password = this.newUser.password;
        }

        await this.http.put(`http://localhost:4000/api/users/${this.editingUser._id}`, updateData).toPromise();
      } else {
        // Create new
        await this.http.post('http://localhost:4000/api/users', this.newUser).toPromise();
      }
      
      await this.loadUsers();
      this.closeForm();
    } catch (err: any) {
      console.error('Error saving user:', err);
      alert(err.error?.error || 'Error al guardar usuario');
    }
  }

  async deleteUser(user: any) {
    if (user.username === 'owner') {
      alert('No se puede eliminar el usuario Owner');
      return;
    }

    if (!confirm(`¿Eliminar usuario "${user.username}"?\n\nEsta acción no se puede deshacer.`)) return;
    
    try {
      const token = localStorage.getItem('ramen_token');
      await this.http.delete(
        `http://localhost:4000/api/users/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).toPromise();
      await this.loadUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(err.error?.error || 'Error al eliminar usuario');
    }
  }

  getRoleBadgeClass(role: string): string {
    const classes: any = {
      'Owner': 'owner',
      'Admin': 'admin',
      'User': 'user',
      'Visor': 'visor'
    };
    return classes[role] || 'user';
  }

  // ==================== PASSWORD CHANGE ====================
  openPasswordDialog(user: any) {
    this.passwordUser = user;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.passwordError = '';
    this.showPasswordDialog = true;

    setTimeout(() => {
      anime({
        targets: '.password-modal',
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutExpo'
      });
    }, 10);
  }

  closePasswordDialog() {
    anime({
      targets: '.password-modal',
      scale: [1, 0.8],
      opacity: [1, 0],
      duration: 200,
      easing: 'easeInQuad',
      complete: () => {
        this.showPasswordDialog = false;
        this.passwordUser = null;
        this.passwordError = '';
      }
    });
  }

  isChangingOwnPassword(): boolean {
    return this.currentUser && this.passwordUser && this.currentUser.id === this.passwordUser._id;
  }

  isPasswordValid(): boolean {
    if (!this.passwordData.newPassword || !this.passwordData.confirmPassword) return false;
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) return false;
    if (this.passwordData.newPassword.length < 6) return false;
    if (this.isChangingOwnPassword() && !this.passwordData.currentPassword) return false;
    return true;
  }

  getPasswordStrength(): string {
    const pwd = this.passwordData.newPassword;
    if (!pwd) return 'weak';
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthLabel(): string {
    const labels: any = {
      'weak': 'Débil',
      'medium': 'Media',
      'strong': 'Fuerte'
    };
    return labels[this.getPasswordStrength()] || 'Débil';
  }

  async changePassword() {
    this.passwordError = '';

    // Validaciones
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    try {
      const token = localStorage.getItem('ramen_token');
      await this.http.put(
        `http://localhost:4000/api/users/${this.passwordUser._id}/password`,
        {
          currentPassword: this.passwordData.currentPassword,
          newPassword: this.passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      ).toPromise();

      alert('Contraseña actualizada correctamente');
      this.closePasswordDialog();
    } catch (err: any) {
      console.error('Error changing password:', err);
      this.passwordError = err.error?.error || 'Error al cambiar contraseña';
    }
  }

  // ==================== BLOCK/UNBLOCK USER ====================
  async toggleUserBlock(user: any) {
    if (user.username === 'owner') {
      alert('No se puede bloquear el usuario Owner');
      return;
    }

    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const action = newStatus === 'blocked' ? 'bloquear' : 'desbloquear';
    
    if (!confirm(`¿Deseas ${action} al usuario "${user.username}"?`)) return;

    try {
      const token = localStorage.getItem('ramen_token');
      await this.http.put(
        `http://localhost:4000/api/users/${user._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      ).toPromise();

      await this.loadUsers();
    } catch (err: any) {
      console.error('Error toggling user block:', err);
      alert(err.error?.error || `Error al ${action} usuario`);
    }
  }
}
