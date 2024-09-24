import express,{json} from 'express'
import {MongoClient} from "mongodb/lib/beta.js"
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url';

const mongoURL = process.env.DATABASE_URL;
const app = express()
const PORT = 5000

const mongoClient = new MongoClient(mongoURL)
let db

mongoClient.connect()
    .then(() =>{
        db = mongoClient.db
        console.log("Mongo DB conectado")
    })
    .catch(err => console.log(err))

app.use(express.json())

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
})

app.listen(PORT,() => {
    console.log(`Servidor rodando na porta ${PORT}`)
})

