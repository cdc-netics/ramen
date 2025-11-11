import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class ModuleRegistryService {
  private api = 'http://localhost:4000/api';
  private _modules$ = new BehaviorSubject([]);
  constructor(private http: HttpClient){}
  loadModules(){ this.http.get(this.api + '/modules').subscribe((m:any)=>this._modules$.next(m)); }
  get modules$(){ return this._modules$.asObservable(); }
  register(m:any){ return this.http.post(this.api + '/modules', m); }
}
