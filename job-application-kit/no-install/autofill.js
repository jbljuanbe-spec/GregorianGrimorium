/*
 * Autofill sin instalación — bookmarklet.
 *
 * Rellena de un clic el formulario de candidatura de la página ACTUAL (Workday o Greenhouse),
 * usando los datos de Juan embebidos abajo. No instala nada: es un marcador del navegador.
 * Corre en tu Chrome ya logueado, sobre la página real del portal.
 *
 * Este fichero es la FUENTE legible. El marcador listo para copiar está en bookmarklet.txt
 * y en el README. Si editas PROFILE, regenera el bookmarklet (ver README).
 *
 * Límites: no sube el CV (los navegadores no dejan a un script elegir ficheros: eso lo haces
 * tú con "Adjuntar"/"Attach") y no resuelve CAPTCHA/2FA. Rellena texto; los desplegables raros
 * y el envío los revisas y confirmas tú.
 */
(function () {
  var PROFILE = {
    firstName: "Juan",
    lastName: "Benítez López",
    email: "benitezlopezjuancontact@gmail.com",
    phone: "+34 610 269 867",
    linkedin: "https://linkedin.com/in/juanbenitez",
    addressLine1: "Madrid",
    city: "Madrid",
    postalCode: "",
    // Respuestas a preguntas de screening: clave = palabra del enunciado (minúscula).
    screening: {
      "sponsorship": "No",
      "authorized to work": "Sí",
      "authorised to work": "Sí",
      "notice period": "Disponible desde enero de 2027",
      "relocate": "Sí; España, Italia/EMEA y remoto",
      "how did you hear": "Portal de empleo de la empresa"
    }
  };

  // Fija el valor de forma compatible con React/Workday (setter nativo + eventos).
  function setValue(el, value) {
    if (!el || value == null || value === "") return false;
    try {
      var proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function byId(id) {
    return document.querySelector('[data-automation-id="' + id + '"]');
  }
  function first(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  var filled = [];
  function put(el, value, label) {
    if (el && setValue(el, value)) filled.push(label);
  }

  // --- Workday (data-automation-id) ---
  put(byId("legalNameSection_firstName"), PROFILE.firstName, "nombre");
  put(byId("legalNameSection_lastName"), PROFILE.lastName, "apellidos");
  put(byId("email"), PROFILE.email, "email");
  put(byId("phone-number"), PROFILE.phone, "teléfono");
  put(byId("addressSection_addressLine1"), PROFILE.addressLine1, "dirección");
  put(byId("addressSection_city"), PROFILE.city, "ciudad");
  put(byId("addressSection_postalCode"), PROFILE.postalCode, "CP");

  // --- Greenhouse (id / name) ---
  put(first(['#first_name', 'input[name="first_name"]']), PROFILE.firstName, "nombre");
  put(first(['#last_name', 'input[name="last_name"]']), PROFILE.lastName, "apellidos");
  put(first(['#email', 'input[type="email"]']), PROFILE.email, "email");
  put(first(['#phone', 'input[type="tel"]']), PROFILE.phone, "teléfono");
  put(first(['input[name*="linkedin" i]']), PROFILE.linkedin, "linkedin");

  // --- Screening por palabra clave (texto libre) ---
  var boxes = document.querySelectorAll('input[type="text"], textarea, [data-automation-id="textInputBox"]');
  for (var i = 0; i < boxes.length; i++) {
    var box = boxes[i];
    if (box.value) continue;
    var container = box.closest("div") || box.parentElement;
    var label = (container ? container.innerText || "" : "").toLowerCase();
    for (var key in PROFILE.screening) {
      if (label.indexOf(key) !== -1) {
        if (setValue(box, PROFILE.screening[key])) filled.push("screening:" + key);
        break;
      }
    }
  }

  var msg = filled.length
    ? "Autofill: rellené " + filled.length + " campo(s): " + filled.join(", ") +
      ".\n\nRevisa, adjunta el CV a mano, resuelve CAPTCHA/2FA y envía tú."
    : "No reconocí campos en esta página. ¿Estás en el formulario de candidatura (Workday/Greenhouse)?";
  alert(msg);
})();
