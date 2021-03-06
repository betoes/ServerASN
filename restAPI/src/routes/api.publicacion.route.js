const express = require('express');
const router = express.Router();
const mongoose = require("../dataaccess/MongoConnect");
const Publicacion = require("../dataaccess/model/Publicacion");
const Comentario = require("../dataaccess/model/Comentario");
const Reaccion = require("../dataaccess/model/Reaccion");
const ListaFavorito = require("../dataaccess/model/ListaFavorito");

var multer, storage, path, crypto;
multer = require('multer')
path = require('path');
crypto = require('crypto');

var reacciones = {
    MEGUSTA: 1,
    properties: {
        1: {reaccion: "me gusta"}
    }
}

router.get("/", (req, res) => {

    Publicacion.find().
    populate({path: 'usuarioAsociado', select: ['name', '_id']}).
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

//Traer por partes las publicaciones de un usuario en particular
router.post("/feedmoderador/", (req, res) => {
    var inicioSegmento = req.body.inicioSegmento;
    console.log(inicioSegmento);
    Publicacion.find().
    populate({
        path: 'comentarios',
        populate: {
            path: 'usuario',
            model: 'Usuario'
        }
    }).
    populate({
        path: 'reacciones',
        populate: {
            path: 'usuario',
            model: 'Usuario'
        }
    }).
    populate('usuario').
    sort([['_id', -1]]).
    skip(inicioSegmento).
    limit(10).
    exec(function(err, docs) {
        if(err){
            res.status(500).json({
                "message": "Hubo un error al consultar publis"
            })
            console.error(err);
            return;
        }
        res.json(docs);
    });
});

//Traer por partes las publicaciones recientes de los amigos del usuario
router.post("/feedfotos", (req, res) => {
    var listaAmigos = req.body.listaAmigos;
    var inicioSegmento = req.body.inicioSegmento;
    
    console.log(req.body);
    console.log(listaAmigos);
    console.log(inicioSegmento);
    
    Publicacion.find({
        usuario : {$in : listaAmigos}
    }).
    populate({
        path: 'comentarios',
        populate: {
            path: 'usuario',
            model: 'Usuario'
        }
    }).
    populate({
        path: 'reacciones',
        populate: {
            path: 'usuario',
            model: 'Usuario'
        }
    }).
    populate('usuario').
    sort([['_id', -1]]).
    skip(inicioSegmento).
    limit(10).
    exec(function(err, docs) {
        if(err){
            res.status(500).json({
                "message": "Hubo un error al consultar las publicaciones"
            })
            console.error(err);
            return;
        }
        console.log(docs);
        res.json(docs);
    })
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

//Parte de subida de imagenes

var form = "<!DOCTYPE HTML><html><body>" +
"<form method='post' action='http://localhost:8080/api/Publicacion/upload' enctype='multipart/form-data'>" +
"<input type='file' name='upload'/>" +
"<input type='submit' /></form>" +
"</body></html>";

router.get('/form', function (req, res){
    res.writeHead(200, {'Content-Type': 'text/html' });
    res.end(form);
});

var fs = require('fs');


storage = multer.diskStorage({
destination: './uploads/',
filename: function(req, file, cb) {
    return crypto.pseudoRandomBytes(16, function(err, raw) {
    if (err) {
        return cb(err);
    }
    return cb(null, "" + (raw.toString('hex')) + (path.extname(file.originalname)));
    });
}
});

router.post("/upload", multer({
      storage: storage
    }).single('imagen'), function(req, res, err) {
      console.log(req.file);
      var uploadInfo = JSON.parse(req.body.upload);
      console.log(uploadInfo);
      var fechaCarga = new Date(Date.now()).toISOString();

      var publicacion = new Publicacion({
        fotoUrl: req.file.filename,
        fechaCarga: fechaCarga,
        descripcion: uploadInfo.descripcion,
        usuario: uploadInfo.idUsuario
        });

        publicacion.save(function(err, doc){
            if(err) {
                res.status(500).json({
                    "message": "Error al guardar publicación"
                });
                console.error(err);
                return;
            }
            res.status(200).json(doc);
        });
      
    });
  
  router.get('/uploads/:upload', function (req, res){
    file = req.params.upload;
    console.log(req.params.upload);
    let ruta = path.resolve('../restApi/uploads/' + file);
    var img = fs.readFileSync(ruta);
    var img64 = Buffer.from(data, 'base64');
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(img);
  
  });
  

//Parte subida de imagenes end

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

    console.log(comentario);
    console.log(idUsuario);
    console.log(idPublicacion);
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

                Comentario.populate(comentario, {path: 'usuario'}, function(err, com){
                    res.json(comentario);
                });
                
                
            });
        }
    });
});

router.put("/nuevareaccion/:idPublicacion", (req, res) => {
    var tipo = req.body.reaccion;
    var idUsuario = req.body.idUsuario;

    console.log(req.body);

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
                "message": "Error al asociar reaccion"
            });
            console.error(err);
            return;
        }
        if(publicacion) {
            reaccion.save(function(err, reaccion) {
                if(err) {
                    res.status.json({
                        "message": "Error al guardar reaccion"
                    });
                    console.error(err);
                    return;
                }
                Reaccion.populate(reaccion, {path: 'usuario'}, function(err, reac){
                    res.json(reaccion);
                });
            });
        }
    });
});

router.delete("/delComentario/:idComentario", (req, res) => {
    var idComentario = req.params.idComentario;

    Comentario.findOneAndDelete({
        _id: idComentario
    }, function(err, docs){
        if(err){
            res.status(500).json({
                "message": "Error al eliminar comentario de bd"
            });
        }
        res.json(docs);
    });

});

router.delete("/delReaccion/:idReaccion", (req, res) => {
    var idReaccion = req.params.idReaccion;
    Reaccion.findOneAndDelete({
        _id: idReaccion
    }, function(err, docs){
        if(err){
            res.status(500).json({
                "message": "Error al eliminar reacción de bd"
            });
        }
        res.json(docs);
    });

});

router.put("/agregafavorito/:idUsuario/:idPublicacion", (req, res) => {
    var idPublicacion = req.params.idPublicacion;
    var idUsuario = req.params.idUsuario;

    ListaFavorito.findOneAndUpdate({
        usuario: idUsuario
    }, 
    {$push: {'favoritos': idPublicacion }},
    {strict: false}, (err, doc) => {
        if(err) {
            res.status.json({
                "message": "Error al agregar publicación a favoritos"
            });
            console.error(err);
            return;
        }

        res.json(doc);
    });

});

module.exports = router;