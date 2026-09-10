# Empresas objetivo — radar y método de candidatura

Fuente: radar de 100 empresas de `standalone/public/targetCompanies.js` (este repo).
Columna **Vía** = cómo se aplica realmente:

- **Portal** — ATS/portal corporativo (Workday, Greenhouse, propio). No se automatiza:
  `/aplicar` prepara CV + carta + respuestas y Juan sube el formulario.
- **Email?** — puede admitir candidatura espontánea por email **solo si** existe un buzón
  oficial publicado. Debe verificarse por caso antes de usar (`/espontanea` lo comprueba).
  Nunca se envía a direcciones adivinadas.

> Realidad: casi todas las grandes (IBEX-35, multinacionales) aplican **solo por portal**.
> El email es viable sobre todo en asociaciones, cámaras, organismos y empresas pequeñas.

---

## 🔋 PRIORIDAD — Energía («las obvias»)

Todas vía **portal Workday/corporativo**. Ninguna admite CV por email; se preparan paquetes
listos para aplicar. CV recomendado: **1 · Desarrollo de Negocio** (o **4 · Instituciones** para
roles de regulación/asuntos públicos, **2** para energía-defensa/industria).

| Empresa | Sector | Vía | Portal |
| --- | --- | --- | --- |
| Iberdrola | Energía | Portal (Workday) | https://iberdrola.wd3.myworkdayjobs.com/en-US/Iberdrola |
| Repsol | Energía | Portal (Workday) | https://www.repsol.com/en/careers/index.cshtml |
| Endesa | Energía | Portal | https://www.endesa.com/en/talent/job-vacancies |
| Naturgy | Energía | Portal | https://www.naturgy.com/en/work-with-us/ |
| Acciona | Infraestructura y energía | Portal (Workday) | https://acciona.wd3.myworkdayjobs.com/es/ACCIONA_Employment_Channel |
| Enagás | Energía | Portal (Workday) | https://enagas.wd3.myworkdayjobs.com/Portal_Externo |
| Redeia (REE) | Energía | Portal | https://www.redeia.com/en/talent |
| Moeve (antigua Cepsa) | Energía | Portal | https://www.moeveglobal.com/en/employment |
| Hitachi Energy | Energía | Portal | https://www.hitachienergy.com/careers |
| GE Vernova | Energía | Portal | https://careers.gevernova.com/ |
| Schneider Electric | Industria y energía | Portal | https://www.se.com/ww/en/about-us/careers |

---

## Defensa y aeroespacial · CV 2

| Empresa | Vía | Portal |
| --- | --- | --- |
| Indra | Portal | https://careers.indragroup.com/ |
| Airbus | Portal | https://jobs.airbus.com |
| GMV | Portal | https://www.gmv.com/en/talent |
| Sener | Portal | https://www.sener.es/en/talent |
| Navantia | Portal | https://www.navantia.es/en/careers/ |
| ITP Aero | Portal | https://www.itpaero.com/en/professional-opportunities/ |
| Aernnova | Portal | https://www.aernnova.com/en/careers |
| Hisdesat | Email? (empresa pequeña, verificar) | https://www.hisdesat.es/en |
| Escribano | Email? (empresa pequeña, verificar) | https://escribano.com |
| Thales / Leonardo | Portal | https://careers.thalesgroup.com · https://www.leonardo.com/en/careers |

## Banca y seguros · CV 1 / 4

Santander, BBVA, CaixaBank, Banco Sabadell, Bankinter, Mapfre, Mutua Madrileña — todas **portal**.
(URLs en `standalone/public/targetCompanies.js`.)

## Telecom e infraestructura digital · CV 1 / Tech Policy

Telefónica, Cellnex, MasOrange — **portal**.

## Industria y movilidad · CV 1 / 2

Siemens, Honeywell, Bosch, Alstom, Talgo, CAF, Renfe, Aena, DHL, Kuehne+Nagel, Maersk, MSC, DSV — **portal**.

## Consultoría · CV 1 / Business Analyst

Accenture, Capgemini, NTT Data, Deloitte, EY, KPMG, PwC, Oliver Wyman — **portal**.
(Nota: Juan ya trabajó en KPMG; útil para networking directo.)

## Tecnología · CV 5 / Business Analyst

Microsoft, Google, Salesforce, IBM, SAP, Oracle, Amazon — **portal**.

## Producto digital / scaleups · CV 5

| Empresa | Vía | Portal |
| --- | --- | --- |
| Cabify | Portal | https://cabify.com/careers |
| Glovo | Portal (Greenhouse) | https://about.glovoapp.com/careers |
| Wallapop | Portal (Greenhouse) | https://job-boards.eu.greenhouse.io/wallapop |
| idealista | Portal | https://www.idealista.com/empleo |
| Adevinta | Portal | https://www.adevinta.com/careers |
| Revolut | Portal | https://www.revolut.com/careers/ |
| Amadeus | Portal | https://jobs.amadeus.com |

## Salud · CV 4 (regulatory) / 1

Grifols, PharmaMar, Roche, Sanofi, Bayer, AstraZeneca, Novartis, GSK — **portal**.

## Infraestructura e ingeniería · CV 1 / 2

Técnicas Reunidas, Ferrovial, ACS, Sacyr, FCC, Abertis — **portal**.

## Consumo y retail · CV 1 / 5

Inditex, Mango, El Corte Inglés, Mercadona, Mahou San Miguel, Danone, L'Oréal, Nestlé,
Unilever, P&G — **portal**.

## Turismo y aviación · CV 1

IAG, Iberia, Air Europa, Meliá, Minor Hotels — **portal**.

---

## 🏛️ Instituciones, cámaras y asociaciones · CV 3 / 4 — mejores candidatas a email

Aquí es donde la **candidatura espontánea por email** tiene más sentido (buzones de contacto
públicos, procesos menos rígidos). **Verificar el email oficial por caso** antes de enviar.

| Organización | Sector | Vía probable |
| --- | --- | --- |
| ICEX | Internacionalización (empleo público) | Portal público (empleo público) — https://www.icex.es/es/ofertas-empleo-publico |
| Cámara de Comercio de Madrid | Internacionalización | Email? / portal |
| CEOE | Relaciones institucionales | Email? / portal |
| ENISA | Financiación pública | Portal público |
| CDTI, COFIDES, CESCE, Invest in Madrid | Sector público | Portal público |
| FIAB, FICE, ASCER, ANIEME, Interporc | Asociaciones sectoriales | Email? (contacto directo) |
| Cámara de Comercio Italiana en España | Bilateral | Email? (contacto directo) |

> Para estas, `/espontanea` primero **busca y verifica** el buzón oficial (web «contacto» /
> «trabaja con nosotros»). Si no hay email legítimo, se trata como portal o contacto en LinkedIn.

---

## Nota de método

Este radar dice **dónde** y **cómo** aplicar, no qué vacantes están abiertas hoy. Para las
vacantes vivas usa `/buscar` (que combina las fuentes del buscador de este repo con verificación
en el portal oficial de cada empresa).
