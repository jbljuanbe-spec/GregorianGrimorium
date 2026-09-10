# Portal Co-pilot — candidaturas asistidas en Workday

Automatiza el **relleno** de candidaturas en portales **Workday** (Iberdrola, Repsol, Acciona,
Enagás, Santander, BBVA y muchas más comparten el mismo motor). **Modo asistido**: rellena todo
lo que reconoce y **se para antes de enviar** para que revises, resuelvas CAPTCHA/2FA y pulses tú.

> ⚠️ **Se ejecuta en TU máquina, no en la nube.** Necesita acceso a los portales y **tu sesión
> iniciada**. Desde Claude Code en la web esto no funciona (red bloqueada y sin tus logins).

## Instalación (una vez, en tu portátil)

Requisitos: [Node.js](https://nodejs.org) 20+ y Google Chrome instalado.

```bash
cd job-application-kit/portal-copilot
npm install
npx playwright install chromium   # por si no usas tu Chrome del sistema
```

## Uso

**Una vacante concreta:**
```bash
npx tsx src/apply.ts \
  --empresa "Repsol" \
  --url "https://repsol.wd3.myworkdayjobs.com/Repsol/job/....(la req concreta)" \
  --cv "../cv/en/CV_JuanBenitez_RegulatoryAffairs_EN.pdf"
```

**Una cola de vacantes** (copia `jobs.example.json` a `jobs.json` y pon las URLs reales):
```bash
cp jobs.example.json jobs.json     # edita jobs.json con tus vacantes
npx tsx src/apply.ts --queue jobs.json
```

Qué hace en cada vacante:
1. Abre tu Chrome (sesión guardada en `chrome-user-data/`) y va a la vacante.
2. Pulsa *Apply → Apply Manually*.
3. Se para para que **inicies sesión o crees cuenta** si el portal lo pide (solo la 1ª vez por empresa).
4. Sube el CV que le indiques.
5. Recorre los pasos rellenando nombre, contacto, dirección y las preguntas de screening que
   reconoce desde `profile.json`.
6. Al llegar al final, **se para**: revisas, completas lo que falte, resuelves CAPTCHA/2FA y
   **pulsas tú Submit**.

## Configuración

- **`profile.json`** — tus datos para rellenar formularios. Edítalo. Amplía `screeningAnswers`
  con las preguntas típicas que te vayas encontrando (clave = palabra del enunciado).
- **`jobs.json`** — tu cola de vacantes (no se sube a git).
- Envío automático (bajo tu riesgo): añade `--submit`. **No recomendado** (ver abajo).

## Límites honestos (léelos)

- **CAPTCHA y 2FA** requieren tu mano — el co-piloto se para para que los resuelvas. No se saltan
  (va contra los términos y no está implementado).
- **Cada Workday varía** y cambian con el tiempo: algunos campos (dropdowns de país, "how did you
  hear", disclosures) se dejan para ti a propósito. Si un tenant cambia los selectores, hay que
  ajustar `src/workday.ts`.
- **Solo ATS donde aplicas con tu cuenta.** No automatiza LinkedIn (sus términos lo prohíben).
- **Modo asistido = tu reputación protegida.** Enviar en masa auto-rellenado con tu nombre real
  puede dar candidaturas flojas o marcar tu cuenta. El co-piloto te ahorra el 90 % del tecleo, pero
  la decisión de enviar es tuya.

## Estructura

```
portal-copilot/
├── profile.json          # tus datos (editable)
├── jobs.example.json     # plantilla de cola de vacantes
├── src/
│   ├── apply.ts          # runner: abre Chrome, recorre pasos, para antes de enviar
│   └── workday.ts        # conector Workday (selectores data-automation-id compartidos)
└── README.md
```

## Siguiente motor

Cuando Workday esté rodado, el segundo con más cobertura es **Greenhouse** (scaleups: Glovo,
Wallapop…). Se añadiría un `src/greenhouse.ts` con el mismo patrón.
