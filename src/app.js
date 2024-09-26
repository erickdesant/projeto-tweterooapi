import express,{json} from 'express'
import {MongoClient} from "mongodb/lib/beta.js"
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url';
import joi from 'joi'

const mongoURL = process.env.DATABASE_URL;
const app = express()
const PORT = 5000

const mongoClient = new MongoClient(mongoURL)
let db

const userSchema = joi.object({
    username: joi.string().required(),
    avatar: joi.string().required()
})

const tweetSchema = joi.object({
    username: joi.string().required(),
    tweet: joi.string().required()
})


mongoClient.connect()
    .then(() =>{
        db = mongoClient.db()
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

app.post("/sign-up", async (req, res) => {
    const user = req.body
    const validation = userSchema.validate(user, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    try{
        await db.collection('users').insertOne(req.body)
        res.status(201).send("Usuário criado")
    }
    catch{
        res.status(422).send("Erro ao criar usuário")
    }
})

app.get("/tweets", async (req, res) => {
    try{
        const tweets = await db.collection('tweets').find().toArray()
        res.status(200).send(tweets)
    }
    catch{
        console.log('Erro ao buscar tweets' )
    }
})

app.post("/tweets", async (req, res) => {
    const tweet = req.body
    const user = req.body.username
    try{
        const userMongo = await db.collection('users').find({username: user})
        if(!userMongo){
            return res.status(401).send("Usuário não autorizado");
        }
    }
    catch{
        res.status(404).send("Erro ao buscar usuário")
    }

    const validation = tweetSchema.validate(tweet, { abortEarly: false });
    if(validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    try{
        await db.collection('tweets').insertOne(req.body)
        res.status(201).send("Tweet criado")
    }
    catch{
        res.status(422).send("Erro ao criar tweet")
    }
})

app.put("/tweets/:id", async (req, res) => {
    const tweet = req.body
    const validation = tweetSchema.validate(tweet, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    try{

    }
    catch{

    }

})

app.delete("/tweets/:id", async (req, res) => {
    const tweetId = req.params.id

})

app.listen(PORT,() => {
    console.log(`Servidor rodando na porta ${PORT}`)
})

