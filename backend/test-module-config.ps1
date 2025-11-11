# Test Module Config API
# PowerShell script para probar todas las rutas de configuración de módulos

$BASE_URL = "http://localhost:4000"
$MODULE_ID = "bitacora-soc"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  TEST: Module Config API" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login para obtener token
Write-Host "[1/12] Login (owner)" -ForegroundColor Yellow
try {
  $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"owner","password":"admin123"}'
  $TOKEN = $loginResponse.token
  Write-Host "  ✅ Token obtenido: $($TOKEN.Substring(0,20))..." -ForegroundColor Green
} catch {
  Write-Host "  ❌ Error en login: $_" -ForegroundColor Red
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $TOKEN"
  "Content-Type" = "application/json"
}

Write-Host ""

# 2. GET configuración del módulo
Write-Host "[2/12] GET /api/module-config/$MODULE_ID (configuración completa)" -ForegroundColor Yellow
try {
  $config = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID" -Method Get -Headers $headers
  Write-Host "  ✅ Configuración obtenida" -ForegroundColor Green
  Write-Host "  📦 Módulo: $($config.moduleName)" -ForegroundColor Cyan
  Write-Host "  📋 Templates: $($config.config.templates.Count)" -ForegroundColor Cyan
  Write-Host "  📃 Listas: $($config.config.lists.Keys.Count)" -ForegroundColor Cyan
  Write-Host "  📜 Políticas: $($config.config.policies.Count)" -ForegroundColor Cyan
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 3. GET listar plantillas
Write-Host "[3/12] GET /api/module-config/$MODULE_ID/templates (listar plantillas)" -ForegroundColor Yellow
try {
  $templates = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/templates" -Method Get -Headers $headers
  Write-Host "  ✅ Plantillas obtenidas: $($templates.templates.Count)" -ForegroundColor Green
  foreach ($template in $templates.templates) {
    Write-Host "  📄 $($template._id): $($template.name)" -ForegroundColor Cyan
    Write-Host "     Campos: $($template.fields.Count) | Categoría: $($template.category)" -ForegroundColor Gray
  }
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 4. GET plantilla específica
Write-Host "[4/12] GET /api/module-config/$MODULE_ID/templates/tpl-incident-report" -ForegroundColor Yellow
try {
  $template = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/templates/tpl-incident-report" -Method Get -Headers $headers
  Write-Host "  ✅ Plantilla obtenida: $($template.name)" -ForegroundColor Green
  Write-Host "  📋 Descripción: $($template.description)" -ForegroundColor Cyan
  Write-Host "  🔒 Campos bloqueados (adminOnly):" -ForegroundColor Yellow
  foreach ($field in $template.fields) {
    if ($field.adminOnly) {
      Write-Host "     • $($field.label) ($($field.id)) = $($field.defaultValue)" -ForegroundColor Red
    }
  }
  Write-Host "  ✏️ Campos editables:" -ForegroundColor Green
  foreach ($field in $template.fields) {
    if (-not $field.adminOnly) {
      Write-Host "     • $($field.label) ($($field.id))" -ForegroundColor Green
    }
  }
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 5. GET lista de severidades
Write-Host "[5/12] GET /api/module-config/$MODULE_ID/lists/severities" -ForegroundColor Yellow
try {
  $severities = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/lists/severities" -Method Get -Headers $headers
  Write-Host "  ✅ Lista obtenida: $($severities.items.Count) items" -ForegroundColor Green
  foreach ($item in $severities.items) {
    Write-Host "  🎨 $($item.value): $($item.label) [SLA: $($item.slaResponse)]" -ForegroundColor Cyan
  }
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 6. GET lista de tipos de incidente
Write-Host "[6/12] GET /api/module-config/$MODULE_ID/lists/incidentTypes" -ForegroundColor Yellow
try {
  $types = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/lists/incidentTypes" -Method Get -Headers $headers
  Write-Host "  ✅ Lista obtenida: $($types.items.Count) items" -ForegroundColor Green
  $types.items | ForEach-Object { Write-Host "  📦 $($_.value): $($_.label)" -ForegroundColor Cyan }
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 7. GET lista de contactos
Write-Host "[7/12] GET /api/module-config/$MODULE_ID/lists/contacts" -ForegroundColor Yellow
try {
  $contacts = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/lists/contacts" -Method Get -Headers $headers
  Write-Host "  ✅ Lista obtenida: $($contacts.items.Count) items" -ForegroundColor Green
  foreach ($contact in $contacts.items) {
    Write-Host "  👤 $($contact.role): $($contact.name) - $($contact.email)" -ForegroundColor Cyan
  }
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 8. GET políticas
Write-Host "[8/12] GET /api/module-config/$MODULE_ID/policies" -ForegroundColor Yellow
try {
  $policies = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/policies" -Method Get -Headers $headers
  Write-Host "  ✅ Políticas obtenidas: $($policies.policies.Count)" -ForegroundColor Green
  foreach ($policy in $policies.policies) {
    Write-Host "  📜 $($policy.id): $($policy.title) [v$($policy.version)]" -ForegroundColor Cyan
  }
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 9. GET SLAs
Write-Host "[9/12] GET /api/module-config/$MODULE_ID/slas" -ForegroundColor Yellow
try {
  $slas = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/slas" -Method Get -Headers $headers
  Write-Host "  ✅ SLAs obtenidos" -ForegroundColor Green
  Write-Host "  ⏱️ Tiempos de respuesta:" -ForegroundColor Cyan
  foreach ($key in $slas.slas.responseTime.Keys) {
    Write-Host "     $key : $($slas.slas.responseTime[$key])" -ForegroundColor Gray
  }
  Write-Host "  ⏲️ Tiempos de resolución:" -ForegroundColor Cyan
  foreach ($key in $slas.slas.resolutionTime.Keys) {
    Write-Host "     $key : $($slas.slas.resolutionTime[$key])" -ForegroundColor Gray
  }
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 10. POST crear nueva plantilla
Write-Host "[10/12] POST /api/module-config/$MODULE_ID/templates (crear plantilla)" -ForegroundColor Yellow
try {
  $newTemplate = @{
    name = "Reporte de Vulnerabilidad"
    description = "Plantilla para reportar vulnerabilidades detectadas"
    category = "security"
    fields = @(
      @{
        id = "vuln_id"
        label = "ID Vulnerabilidad"
        type = "text"
        editable = $true
        required = $true
      },
      @{
        id = "cvss_score"
        label = "CVSS Score"
        type = "number"
        editable = $true
        required = $true
        validation = @{
          min = 0
          max = 10
        }
      },
      @{
        id = "remediation_sla"
        label = "SLA de Remediación"
        type = "text"
        editable = $false
        adminOnly = $true
        defaultValue = "30 días"
      }
    )
  } | ConvertTo-Json -Depth 10

  $created = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/templates" -Method Post -Headers $headers -Body $newTemplate
  Write-Host "  ✅ Plantilla creada: $($created.name) [ID: $($created._id)]" -ForegroundColor Green
  $TEMPLATE_ID = $created._id
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
  $TEMPLATE_ID = $null
}

Write-Host ""

# 11. PUT actualizar lista
Write-Host "[11/12] PUT /api/module-config/$MODULE_ID/lists/severities (actualizar)" -ForegroundColor Yellow
try {
  $updatedList = @{
    items = @(
      @{ value = "critical"; label = "Crítico"; color = "#d32f2f"; slaResponse = "1 hora" },
      @{ value = "high"; label = "Alto"; color = "#f57c00"; slaResponse = "4 horas" },
      @{ value = "medium"; label = "Medio"; color = "#fbc02d"; slaResponse = "1 día" },
      @{ value = "low"; label = "Bajo"; color = "#388e3c"; slaResponse = "3 días" },
      @{ value = "info"; label = "Informativo"; color = "#1976d2"; slaResponse = "7 días" }
    )
  } | ConvertTo-Json -Depth 10

  $updated = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/lists/severities" -Method Put -Headers $headers -Body $updatedList
  Write-Host "  ✅ Lista actualizada: $($updated.items.Count) items" -ForegroundColor Green
} catch {
  Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# 12. DELETE eliminar plantilla (si se creó)
if ($TEMPLATE_ID) {
  Write-Host "[12/12] DELETE /api/module-config/$MODULE_ID/templates/$TEMPLATE_ID" -ForegroundColor Yellow
  try {
    $deleted = Invoke-RestMethod -Uri "$BASE_URL/api/module-config/$MODULE_ID/templates/$TEMPLATE_ID" -Method Delete -Headers $headers
    Write-Host "  ✅ Plantilla eliminada: $($deleted.templateId)" -ForegroundColor Green
  } catch {
    Write-Host "  ⚠️ Solo Owner puede eliminar plantillas (esperado si eres Admin)" -ForegroundColor Yellow
  }
} else {
  Write-Host "[12/12] DELETE plantilla - Omitido (no se creó plantilla)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  ✅ TESTS COMPLETADOS" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
