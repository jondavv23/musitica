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
            await connection.commit()
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
            console.log(`./uploads/${req.body.tipo}`)
            cb(null,`./uploads/${req.body.tipo}`)
        },
        filename: async (req, file, cb) => {
            var data = req.body
            var connection = await promise.createConnection(config);
            let result = await connection.query ('INSERT INTO cancion (nombre,album,duracion) VALUES (?,?,?);',[data.nombre,data.album,100])
            console.log(result)
            cb(null,result.insertId + path.extname(file.originalname))
        }
    })


    const upload = multer({storage: storage}).single(`File`)
    upload(req,res, err =>{
        console.log(err)
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

app.get('/cancion/search/:query', async (req,res) => {
    var connection = await promise.createConnection(config);
    connection.query (`SELECT artista.nombre as artista, cancion.ID as cancionID, album.ID as albumID, cancion.nombre as cancion, album.nombre as album
                        FROM cancion, album, album_artista, artista
                        WHERE cancion.album = album.ID
                        AND album.ID = album_artista.album
                        AND artista.ID = album_artista.artista
                        AND LOCATE(?, cancion.nombre) > 0 OR LOCATE(?, artista.nombre) > 0`,
    [req.params.query, req.params.query])
        .then(result => {
        res.status(200).send(result)
    }).catch(Err => {
        console.log(Err)
        res.status(500).send("Not nice")
    })
})


//llamar páginas
app.get('/', function(req, res) {
    res.render('login.ejs');
});

app.get('/guardadas', function(req, res) {
    res.render('guardadas.ejs');
});

app.get('/playlist', function(req, res) {
    res.render('playlist.ejs');
});

app.get('/albumes', function(req, res) {
    res.render('albumes.ejs');
});

app.get('/albumcom', function(req, res) {
    res.render('albumcom.ejs');
});

app.get('/registrar', function(req, res) {
    res.render('registrar.ejs');
});

app.get('/subiral', function(req, res) {
    res.render('subiral.ejs');
});

app.get('/subirar', function(req, res) {
    res.render('subirar.ejs');
});

app.get('/subircan', function(req, res) {
    res.render('cancion.ejs');
});

app.get('/iframe', function(req, res) {
    res.render('iframe.ejs');
});





