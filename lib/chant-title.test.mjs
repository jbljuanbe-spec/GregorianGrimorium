import assert from "node:assert/strict";
import test from "node:test";
import { displayTitle } from "./chant-title.mjs";

test("un Alleluia titulado por su versículo enseña la relación", () => {
  // La fuente titula los 705 Alleluia por su versículo, porque todos empiezan
  // cantando «Allelúia». Crudo se lee «In multitudine» con la etiqueta
  // «Alleluia» al lado y no parece que tengan que ver.
  assert.equal(
    displayTitle({ incipit: "In multitudine", genre: "Alleluia" }),
    "Allelúia: In multitudine",
  );
});

test("un Alleluia que ya viene titulado «Allelúia» se deja en paz", () => {
  assert.equal(
    displayTitle({ incipit: "Allelúia (Pascha nostrum)", genre: "Alleluia" }),
    "Allelúia (Pascha nostrum)",
  );
  assert.equal(displayTitle({ incipit: "Alleluia", genre: "Alleluia" }), "Alleluia");
});

test("los demás géneros no se tocan: su íncipit ya nombra la pieza", () => {
  for (const genre of ["Introitus", "Communio", "Graduale", "Offertorium", "Tractus"]) {
    assert.equal(displayTitle({ incipit: "Ecce advénit", genre }), "Ecce advénit");
  }
});
