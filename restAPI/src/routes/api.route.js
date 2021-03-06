const express = require('express');
const router = express.Router();
const cuentaRouter = require("./api.cuenta.route");
const usuarioRouter = require("./api.usuario.route");
const publicacionRouter = require("./api.publicacion.route");
const solicitudRouter = require("./api.solicitud.route");
const moderadorRouter = require("./api.moderador.route");
const chatGroupRouter = require("./api.chat.route");
//const emailCtrl = require("../dataaccess/model/email");
const config = require("../config");

router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

//router.use("/email", emailCtrl);
router.use("/Cuenta", cuentaRouter);
router.use("/Usuario", usuarioRouter);
router.use("/Publicacion", publicacionRouter);
router.use("/Solicitud", solicitudRouter);
router.use("/Moderador", moderadorRouter);
router.use("/ChatGroup", chatGroupRouter);



router.get("/ping", (req, res) => {

    res.status(200).json({
        "ping": "pong"
    });
});

module.exports = router;