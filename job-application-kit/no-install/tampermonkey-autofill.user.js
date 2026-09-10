// ==UserScript==
// @name         Autofill candidaturas — Juan Benítez (Workday + Greenhouse)
// @namespace    jbljuanbe.autofill
// @version      1.0
// @description  Rellena de un clic (o automático) los formularios de candidatura en portales Workday y Greenhouse. Siempre activo vía Tampermonkey. No sube CV ni resuelve CAPTCHA (eso lo haces tú).
// @author       Juan Benítez López
// @match        https://*.myworkdayjobs.com/*
// @match        https://*.greenhouse.io/*
// @match        https://boards.greenhouse.io/*
// @match        https://job-boards.greenhouse.io/*
// @match        https://job-boards.eu.greenhouse.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * INSTALAR (sin descargar ficheros):
 *  1. Instala la extensión "Tampermonkey" desde Chrome Web Store.
 *  2. Icono de Tampermonkey -> "Crear un nuevo script".
 *  3. Borra la plantilla, pega TODO este fichero, Ctrl/Cmd+S para guardar.
 *  4. Abre cualquier oferta de Workday/Greenhouse: verás abajo a la derecha el botón "⚡ Rellenar".
 *
 * Si cambias tus datos, edita el objeto PROFILE de abajo y guarda otra vez.
 */
(function () {
  "use strict";

  var PROFILE = {
    firstName: "Juan",
    lastName: "Benítez López",
    email: "benitezlopezjuancontact@gmail.com",
    phone: "+34 610 269 867",
    linkedin: "https://linkedin.com/in/juanbenitez",
    addressLine1: "Madrid",
    city: "Madrid",
    postalCode: "",
    screening: {
      "sponsorship": "No",
      "authorized to work": "Sí",
      "authorised to work": "Sí",
      "notice period": "Disponible desde enero de 2027",
      "relocate": "Sí; España, Italia/EMEA y remoto",
      "how did you hear": "Portal de empleo de la empresa"
    }
  };

  var AUTO_KEY = "jbl_autofill_auto";

  function setValue(el, value) {
    if (!el || value == null || value === "") return false;
    try {
      var proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (e) { return false; }
  }
  function byId(id) { return document.querySelector('[data-automation-id="' + id + '"]'); }
  function first(sels) { for (var i = 0; i < sels.length; i++) { var el = document.querySelector(sels[i]); if (el) return el; } return null; }

  function runFill() {
    var filled = [];
    function put(el, value, label) { if (el && setValue(el, value)) filled.push(label); }

    // Workday
    put(byId("legalNameSection_firstName"), PROFILE.firstName, "nombre");
    put(byId("legalNameSection_lastName"), PROFILE.lastName, "apellidos");
    put(byId("email"), PROFILE.email, "email");
    put(byId("phone-number"), PROFILE.phone, "teléfono");
    put(byId("addressSection_addressLine1"), PROFILE.addressLine1, "dirección");
    put(byId("addressSection_city"), PROFILE.city, "ciudad");
    put(byId("addressSection_postalCode"), PROFILE.postalCode, "CP");

    // Greenhouse
    put(first(['#first_name', 'input[name="first_name"]']), PROFILE.firstName, "nombre");
    put(first(['#last_name', 'input[name="last_name"]']), PROFILE.lastName, "apellidos");
    put(first(['#email', 'input[type="email"]']), PROFILE.email, "email");
    put(first(['#phone', 'input[type="tel"]']), PROFILE.phone, "teléfono");
    put(first(['input[name*="linkedin" i]']), PROFILE.linkedin, "linkedin");

    // Screening por palabra clave
    var boxes = document.querySelectorAll('input[type="text"], textarea, [data-automation-id="textInputBox"]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      if (box.value) continue;
      var c = box.closest("div") || box.parentElement;
      var label = (c ? c.innerText || "" : "").toLowerCase();
      for (var key in PROFILE.screening) {
        if (label.indexOf(key) !== -1) { if (setValue(box, PROFILE.screening[key])) filled.push("screening:" + key); break; }
      }
    }
    return filled;
  }

  function toast(text) {
    var t = document.createElement("div");
    t.textContent = text;
    t.style.cssText = "position:fixed;bottom:74px;right:16px;z-index:2147483647;max-width:320px;" +
      "background:#111;color:#fff;padding:10px 12px;border-radius:8px;font:13px system-ui;box-shadow:0 4px 16px rgba(0,0,0,.3)";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 6000);
  }

  function buildUI() {
    if (document.getElementById("jbl-autofill-btn")) return;
    var btn = document.createElement("button");
    btn.id = "jbl-autofill-btn";
    btn.textContent = "⚡ Rellenar";
    btn.title = "Rellenar candidatura con tus datos";
    btn.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;background:#2563eb;color:#fff;" +
      "border:none;border-radius:999px;padding:10px 16px;font:600 14px system-ui;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)";
    btn.onclick = function () {
      var filled = runFill();
      toast(filled.length ? "Rellené: " + filled.join(", ") + ". Adjunta el CV, resuelve CAPTCHA y envía tú." :
        "No reconocí campos aquí. ¿Estás en el formulario de candidatura?");
    };
    document.body.appendChild(btn);

    // Checkbox "auto al cargar"
    var auto = document.createElement("label");
    auto.style.cssText = "position:fixed;bottom:20px;right:120px;z-index:2147483647;background:#fff;color:#111;" +
      "border:1px solid #ccc;border-radius:8px;padding:4px 8px;font:12px system-ui;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)";
    var isAuto = false;
    try { isAuto = localStorage.getItem(AUTO_KEY) === "1"; } catch (e) {}
    auto.innerHTML = '<input type="checkbox" ' + (isAuto ? "checked" : "") + "> auto";
    auto.querySelector("input").onchange = function (e) {
      try { localStorage.setItem(AUTO_KEY, e.target.checked ? "1" : "0"); } catch (er) {}
    };
    document.body.appendChild(auto);

    if (isAuto) setTimeout(function () { var f = runFill(); if (f.length) toast("Auto: rellené " + f.join(", ")); }, 1800);
  }

  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (document.body) { buildUI(); clearInterval(iv); }
    if (tries > 40) clearInterval(iv);
  }, 500);
})();
