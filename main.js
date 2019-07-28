const express = require('express')
const promise = require('promise-mysql')
var bodyParser = require('body-parser')
const multer = require('multer')

const fs = require('fs')
const app = express()
const port = 3000
const path = require('path')
var config = {host:'localhost',user:'root',password :'root',database :'mydb'}


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
var partials = require('express-partials')
  app.use(partials())
  app.set('views', path.join(__dirname, '/public'))
app.use('/',express.static(path.join(__dirname,'/public/')))
app.use('/resource', express.static(path.join(__dirname, '/uploads')))


app.listen(port, () => console.log(`Example app listening on port ${port}!`))


//Recibe los datos y los envia a la base (usuario)
app.post('/usuario',async (req,res) => {
    var data = req.body
    var connection = await promise.createConnection(config);
    connection.query ('INSERT INTO usuario (ID,nombre,contrasena) VALUES (?,?,?);',[data.user,data.contra,data.nombre])
        .then(result => {
        res.status(200).send("Nice")
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})

//Recibe los datos y los envia a la base (album)
app.post('/album',async (req,res) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null,`./uploads/${req.body.tipo}`)
        },
        filename: async (req, file, cb) => {
            var data = req.body
            var connection = await promise.createConnection(config);
            await connection.beginTransaction()
            let result_album = await connection.query ('INSERT INTO album (nombre,anno) VALUES (?,?);',[data.nombre,data.anno])

            await connection.query('INSERT INTO album_artista (artista,album) VALUES (?,?)',[data.artista,result_album.insertId])
            cb(null,result_album.insertId + path.extname(file.originalname))
        }
    })

    const upload = multer({storage: storage}).single(`File`)
    upload(req,res,err => {                                                                                                                     
        if(err){
            console.log(err)
            res.status(500).send("Not nice")
        }else{
            res.status(200).send("Nice") 
        }

    })
})

//Recibe los datos y los envia a la base (artista)
app.post('/artista',async (req,res) => {
    var data = req.body
    var connection = await promise.createConnection(config);
    connection.query ('INSERT INTO artista (nombre) VALUES (?);',[data.nombre])
        .then(result => {
        res.status(200).send("Nice")
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})

//Recibe los datos y los envia a la base (cancion)
app.post('/cancion',async (req,res) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null,`./uploads/${req.body.tipo}`)
        },
        filename: async (req, file, cb) => {
            var data = req.body
            var connection = await promise.createConnection(config);
            let result = await connection.query ('INSERT INTO cancion (nombre,album,duracion) VALUES (?,?,?);',[data.nombre,data.album,100])
            cb(null,result.insertId + path.extname(file.originalname))
        }
    })


    const upload = multer({storage: storage}).single(`File`)
    upload(req,res, err =>{
        if(err){
            console.log(err)
            res.status(500).send("Not nice")
        }else{
            res.status(200).send("Nice") 
        }
    })

})

//Jalar artistas
app.get('/artista',async (req,res) => {
    var connection = await promise.createConnection(config);
    connection.query ('SELECT * FROM artista')
        .then(result => {
        res.status(200).send(result)
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})


app.get('/artista/:artista',async (req,res) => {
    var connection = await promise.createConnection(config);
    connection.query ('SELECT * FROM artista WHERE ID = ?',[req.params.artista])
        .then(result => {
        res.status(200).send(result)
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})

//Jalar albumes
app.get('/album',async (req,res) => {
    var connection = await promise.createConnection(config);
    connection.query ('SELECT * FROM album')
        .then(result => {
        res.status(200).send(result)
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})


app.get('/album/:album',async (req,res) => {
    var connection = await promise.createConnection(config);
    connection.query ('SELECT * FROM album WHERE ID = ?',[req.params.artista])
        .then(result => {
        res.status(200).send(result)
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})

//Jalar album por artista
app.get('/album/artista/:artista',async (req,res) => {
    var connection = await promise.createConnection(config);
    connection.query (`SELECT album.nombre as nombre, album.ID as ID FROM album,artista,album_artista
where album.ID = album_artista.album
and artista.ID = album_artista.artista
and artista.ID = ?`,[req.params.artista])
        .then(result => {
        res.status(200).send(result)
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})















