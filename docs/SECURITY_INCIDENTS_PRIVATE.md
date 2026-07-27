# Incidentes de seguridad — Privado

> **ESTE ARCHIVO ES PRIVADO. No debe compartirse ni incluirse en commits públicos.**

## Incidente 001: Exposición de códigos de recuperación de Hostinger

- **Fecha**: 26 de julio de 2026
- **Archivo**: `hostinger-recovery-codes.txt`
- **Hallazgo**: El archivo con códigos de recuperación de Hostinger se encontraba en el directorio de trabajo del proyecto, dentro del paquete documental compartido.
- **Acción tomada**:
  - El archivo fue movido fuera del árbol del repositorio a `C:\Users\rbori\AppData\Local\Temp\opencode\` (ubicación temporal segura).
  - Se agregaron patrones de exclusión a `.gitignore` para recovery codes.
  - Se ejecutó escaneo de secretos en el worktree — sin hallazgos adicionales.
  - No se agregó al índice de Git en ningún momento.
- **Acción externa requerida**: El propietario de la cuenta Hostinger debe **regenerar los códigos de recuperación** desde el panel de Hostinger, ya que estuvieron contenidos en un paquete compartido.
