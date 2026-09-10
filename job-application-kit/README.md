# Job Application Kit — Juan Benítez López

Skill de **Claude Code** para buscar empleo y preparar candidaturas, personalizada al perfil de
Juan y al mercado español. Adaptación del framework MIT
[MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search), integrada con el
buscador de ofertas de este mismo repositorio (`../standalone`, radar de 100 empresas).

## Qué hace

- Mantiene un **perfil maestro** verificado y **8 versiones de CV** (ES/EN/IT) listas.
- **Busca** ofertas reales y las prioriza por encaje (`/buscar`).
- Convierte cada oferta en un **paquete de candidatura** (`/aplicar`): CV correcto + carta
  adaptada + respuestas al formulario, o un email de candidatura espontánea.
- Lleva el **seguimiento** de candidaturas (`/seguimiento`) y prepara **entrevistas**
  (`/entrevista`).

## Qué NO hace (por diseño)

- No rellena formularios de portales ni usa credenciales/sesiones de LinkedIn, InfoJobs, Workday…
- No inventa experiencia, cifras ni direcciones de email.
- No envía nada sin el OK explícito de Juan, caso por caso.

## Cómo usarlo

Abre Claude Code en este directorio (`job-application-kit/`). Se cargará `CLAUDE.md` (perfil,
reglas y política de envío). Luego, por ejemplo:

```
/buscar energía desarrollo de negocio España
/aplicar https://iberdrola.wd3.myworkdayjobs.com/.../<vacante>
/espontanea Cámara de Comercio Italiana en España
/seguimiento
```

## Estructura

```
job-application-kit/
├── CLAUDE.md                  # Perfil + reglas + política de envío (léelo primero)
├── perfil/
│   ├── perfil-maestro.md      # Fuente única de verdad (hechos verificados)
│   └── mapa-cv.md             # Qué CV usar según la oferta
├── cv/{es,en,it}/             # Los 8 CV en DOCX/PDF
├── empresas/empresas-objetivo.md  # 100 empresas + vía (portal/email), energía priorizada
├── plantillas/                # Cartas ES/EN/IT + email espontáneo
├── seguimiento/candidaturas.csv   # Tracker
└── .claude/commands/          # /buscar /aplicar /carta /espontanea /seguimiento /entrevista
```

## Envío de emails (opcional)

`/espontanea` puede dejar borradores en el Gmail de Juan si el conector de Gmail está conectado en
la sesión. Si no, entrega el email redactado para copiar y pegar. Siempre a buzón oficial
verificado y con OK previo.
