import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ModuleFile {
  path: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
}

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent implements OnInit {
  moduleId: string = '';
  module: any = null;
  files: ModuleFile[] = [];
  currentFile: ModuleFile | null = null;
  fileTree: any[] = [];

  // Templates iniciales según framework
  templates: any = {
    react: {
      'package.json': JSON.stringify({
        name: 'ramen-module',
        version: '1.0.0',
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        }
      }, null, 2),
      'src/App.jsx': `import React from 'react';

export default function App() {
  return (
    <div className="module-container">
      <h1>Mi Módulo Ramen</h1>
      <p>Empieza a desarrollar aquí!</p>
    </div>
  );
}`,
      'src/index.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
      'public/index.html': `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Módulo Ramen</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
    },
    vanilla: {
      'index.html': `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Módulo Ramen</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Mi Módulo Ramen</h1>
    <p>Empieza a desarrollar aquí!</p>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      'app.js': `// Tu código JavaScript aquí
console.log('Módulo Ramen cargado!');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM listo');
});`,
      'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: 2rem;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
}`
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.moduleId = this.route.snapshot.params['id'];
    this.loadModule();
  }

  async loadModule() {
    try {
      const modules = await this.http.get<any[]>('http://localhost:4000/api/modules').toPromise();
      this.module = modules?.find(m => m._id === this.moduleId);
      
      if (!this.module) {
        alert('Módulo no encontrado');
        this.router.navigate(['/admin/modules']);
        return;
      }

      await this.loadFiles();
    } catch(err) {
      console.error('Error loading module:', err);
    }
  }

  async loadFiles() {
    try {
      // Cargar archivos del módulo desde el backend
      const response = await this.http.get<any>(`http://localhost:4000/api/modules/${this.moduleId}/files`).toPromise();
      
      if (response && response.files && response.files.length > 0) {
        this.files = response.files;
      } else {
        // Si no hay archivos, crear template inicial
        this.initializeTemplate();
      }
      
      this.buildFileTree();
    } catch(err) {
      console.error('Error loading files:', err);
      // Si hay error, inicializar template
      this.initializeTemplate();
    }
  }

  initializeTemplate() {
    const framework = this.module.framework || 'vanilla';
    const template = this.templates[framework] || this.templates.vanilla;
    
    this.files = [];
    for (const [path, content] of Object.entries(template)) {
      this.files.push({
        path,
        name: path.split('/').pop() || path,
        type: 'file',
        content: content as string,
        language: this.getLanguage(path)
      });
    }
    
    this.buildFileTree();
  }

  buildFileTree() {
    // Construir árbol de archivos jerárquico
    const tree: any = {};
    
    this.files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = file;
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });
    
    this.fileTree = this.treeToArray(tree);
  }

  treeToArray(tree: any, prefix = ''): any[] {
    const result: any[] = [];
    
    for (const [key, value] of Object.entries(tree)) {
      if ((value as any).path) {
        result.push(value);
      } else {
        result.push({
          name: key,
          path: prefix + key,
          type: 'folder',
          children: this.treeToArray(value, prefix + key + '/')
        });
      }
    }
    
    return result;
  }

  selectFile(file: ModuleFile) {
    if (file.type === 'file') {
      this.currentFile = file;
    }
  }

  newFile() {
    const name = prompt('Nombre del archivo (con extensión):');
    if (!name) return;
    
    const newFile: ModuleFile = {
      path: name,
      name,
      type: 'file',
      content: '',
      language: this.getLanguage(name)
    };
    
    this.files.push(newFile);
    this.buildFileTree();
    this.currentFile = newFile;
  }

  newFolder() {
    const name = prompt('Nombre de la carpeta:');
    if (!name) return;
    
    // Las carpetas se crean automáticamente al crear archivos dentro
    alert(`Carpeta "${name}" creada. Crea archivos dentro usando el formato: ${name}/archivo.js`);
  }

  async saveFile() {
    if (!this.currentFile) return;
    
    try {
      await this.http.post(`http://localhost:4000/api/modules/${this.moduleId}/files`, {
        files: this.files
      }).toPromise();
      
      alert('Archivo guardado!');
    } catch(err) {
      console.error('Error saving file:', err);
      alert('Error al guardar archivo');
    }
  }

  async saveAll() {
    try {
      await this.http.post(`http://localhost:4000/api/modules/${this.moduleId}/files`, {
        files: this.files
      }).toPromise();
      
      alert('Todos los archivos guardados!');
    } catch(err) {
      console.error('Error saving files:', err);
      alert('Error al guardar archivos');
    }
  }

  deleteFile(file: ModuleFile) {
    if (!confirm(`¿Eliminar ${file.name}?`)) return;
    
    const index = this.files.indexOf(file);
    if (index > -1) {
      this.files.splice(index, 1);
      this.buildFileTree();
      
      if (this.currentFile === file) {
        this.currentFile = null;
      }
    }
  }

  getLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: any = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'py': 'python',
      'java': 'java',
      'php': 'php'
    };
    return map[ext || ''] || 'plaintext';
  }

  getFileIcon(file: ModuleFile): string {
    if (file.type === 'folder') return 'folder';
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    const map: any = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'code',
      'tsx': 'code',
      'html': 'html',
      'css': 'style',
      'json': 'data_object',
      'py': 'code',
      'java': 'code'
    };
    return map[ext || ''] || 'description';
  }

  back() {
    this.router.navigate(['/admin/modules']);
  }
}
