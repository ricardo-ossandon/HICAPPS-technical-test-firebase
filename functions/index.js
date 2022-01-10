/* eslint-disable max-len */
/* eslint-disable no-case-declarations */
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require("firebase-functions");
// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database().ref("/pacientes");

exports.pacientes = functions.https.onRequest((req, res) => {
  functions.logger.log(`Acceso tipo ${req.method} a endpoint /pacientes${req.params[0].length <= 1 ? "" : "/:id" }. CreatedAt: ${Date.now()}`);
  switch (req.method) {
    case "GET":
      // Si no se le pasan parámetros, llama a /pacientes
      if (req.params[0].length <= 1) {
        db.get().then((response) => {
          res.json(response);
        }).catch((error) => {
          console.error(error);
        });
      } else {
        db.child(req.params[0]).on("value", (snapshot) => {
          if (snapshot.val()) {
            if (snapshot.val().accesible === true) {
              res.json(snapshot);
            } else if (snapshot.val().accesible === false) {
              res.status(403).send("Este paciente no es accesible");
            }
          } else {
            res.status(404).send("El paciente no fue encontrado");
          }
        });
      }
      break;

    case "POST":
      // Excepción, no puede agregar un usuario vacío o sólo con 'accesible'
      if (!req.query.apellidoMaterno && !req.query.apellidoPaterno && !req.query.nombre && !req.query.rut) {
        res.status(400).send("Error al crear paciente. Compruebe que no esté vacío");
        res.end();
      }
      console.log(req.query);
      let accesible = req.query.accesible;
      const apellidoMaterno = req.query.apellidoMaterno || "";
      const apellidoPaterno = req.query.apellidoPaterno || "";
      const nombre = req.query.nombre || "";
      const rut = req.query.rut || "";
      // Convertir accesible en boolean
      if (accesible === "false" || accesible === "0" || accesible === undefined) {
        accesible = false;
      } else {
        accesible = true;
      }
      db.push({
        accesible, apellidoMaterno, apellidoPaterno, nombre, rut,
      }, (error) => {
        if (error) {
          res.status(500).send("Hubo un error");
        } else {
          res.status(201).send("Datos agregados satisfactoriamente");
        }
      });
      break;
    default:
      res.send("Este request no está soportado...");
  }
});
