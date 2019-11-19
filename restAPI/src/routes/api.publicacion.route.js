const express = require('express');
const router = express.Router();
const mongoose = require("../dataaccess/MongoConnect");
const Publicacion = require("../dataaccess/model/Publicacion");
const Comentario = require("../dataaccess/model/Comentario");
const Reaccion = require("../dataaccess/model/Reaccion");
const ListaFavorito = require("../dataaccess/model/ListaFavorito");

var reacciones = {
    MEGUSTA: 1,
    MEMOLESTA: 2,
    MEENCANTA: 3,
    MEENLLORA: 4,
    properties: {
        1: {reaccion: "me gusta"},
        2: {reaccion: "me molesta"},
        3: {reaccion: "me encanta"},
        4: {reaccion: "me enllora"}
    }
}

router.get("/", (req, res) => {
    Publicacion.find().
    populate('usuarioAsociado').
    populate('comentarios').
    populate('reacciones').
    exec(function(err, docs){
        if(err){
            res.status(500).json({
                "message": "Hubo un error al ejecutar la consulta"
            })
            console.error(err);
            return;
        }
        res.json(docs);
    });
});

router.post("/", (req, res) => {
    var fotoUrl = req.body.fotoUrl;
    var fechaCarga = new Date(Date.now()).toISOString();
    var descripcion = req.body.descripcion;
    var idUsuario = req.body.idUsuario;

    console.log(fotoUrl + " " + fechaCarga + " " + descripcion + " " + idUsuario);

    if(fotoUrl === undefined || fechaCarga === undefined || descripcion === undefined || idUsuario === undefined){
        res.status(400).json({
            "message": "Parametros invalido o incompletos"
        })
        return;
    }

    var publicacion = new Publicacion({
        fotoUrl: fotoUrl,
        fechaCarga: fechaCarga,
        descripcion: descripcion,
        usuario: idUsuario
    })

    publicacion.save(function(err, doc){
        if(err) {
            res.status(500).json({
                "message": "Error al guardar publicación"
            })
            console.error(err);
            return;
        }
        res.json(doc);
    })
});

router.put("/:idPublicacion", (req, res) => {
    var fotoUrl = req.body.fotoUrl;
    var descripcion = req.body.descripcion;
    var idPublicacion = req.params.idPublicacion;

    if(fotoUrl === undefined || descripcion === undefined){
        res.status(400).json({
            "message": "Parametros invalido o incompletos"
        })
        return;
    }

    Publicacion.findOneAndUpdate({
        _id: idPublicacion 
    }, {
        fotoUrl: fotoUrl,
        descripcion: descripcion
    }, function(err, doc){
        if(err) {
            res.status(500).json({
                "message": "Error al ejecutar update"
            })
            console.error(err);
            return;
        }
        res.json(doc);
    });

});


router.delete("/:id", (req, res) => {
    var jsonId = req.params.id;

    Publicacion.findOneAndDelete({
        _id: jsonId
    }, function (err, doc){
        if(err) {
            res.status(500).json({
                message: "Error al ejecutar delete"
            })
            console.error(err);
            return;
        }
        res.json(doc);
    });
});

router.put("/nuevocomentario/:idPublicacion", (req, res) => {
    var comentario = req.body.comentario;
    var idUsuario = req.body.idUsuario;

    var idPublicacion = req.params.idPublicacion;

    if(comentario === undefined || idUsuario === undefined || idPublicacion === undefined) {
        res.status(400).json({
            "message": "Parametros invalidos o incompletos"
        });
    }

    var comentario = new Comentario({
        _id: new mongoose.Types.ObjectId(),
        comentario: comentario,
        usuario: idUsuario
    });
    Publicacion.findOneAndUpdate({
        _id: idPublicacion
    }, 
    {$push: {'comentarios': comentario._id }},
    {strict: false}, (err, publicacion) => {
        if(err) {
            res.status.json({
                "message": "Error al asociar comentario"
            });
            console.error(err);
            return;
        }
        if(publicacion) {
            comentario.save(function(err, comentario) {
                if(err) {
                    res.status.json({
                        "message": "Error al guardar comentario"
                    });
                    console.error(err);
                    return;
                }
                res.json(comentario);
            });
        }
    });
});

router.put("/nuevareaccion/:idPublicacion", (req, res) => {
    var tipo = req.body.reaccion;
    var idUsuario = req.body.idUsuario;

    var idPublicacion = req.params.idPublicacion;

    if(tipo === undefined || idUsuario === undefined || idPublicacion === undefined) {
        res.status(400).json({
            "message": "Parametros invalidos o incompletos"
        });
    }

    var reaccion = new Reaccion({
        _id: new mongoose.Types.ObjectId(),
        tipo: reacciones.properties[tipo].reaccion,
        usuario: idUsuario
    });
    Publicacion.findOneAndUpdate({
        _id: idPublicacion
    }, 
    {$push: {'reacciones': reaccion._id }},
    {strict: false}, (err, publicacion) => {
        if(err) {
            res.status.json({
                "message": "Error al asociar comentario"
            });
            console.error(err);
            return;
        }
        if(publicacion) {
            reaccion.save(function(err, reaccion) {
                if(err) {
                    res.status.json({
                        "message": "Error al guardar comentario"
                    });
                    console.error(err);
                    return;
                }
                res.json(reaccion);
            });
        }
    });
});

router.put("/agregafavorito/:idUsuario", (req, res) => {
    var idPublicacion = req.params.idPublicacion;
});

module.exports = router;