import express,{json} from 'express'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url';
import joi from 'joi'
import {MongoClient, ObjectId} from "mongodb";

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
        const newTweets = await Promise.all(tweets.map(async tweet => {
            const userAvatar = await db.collection('users').findOne(
                { username: tweet.username },
                { projection: {avatar : 1,_id : 0}}
            )
            const newTweet = {
                id: tweet._id,
                username: tweet.username,
                avatar: userAvatar.avatar,
                tweet: tweet.tweet,
            }
            return newTweet
        }))
        let reverseTweets = []
        for (let i = newTweets.length - 1; i >= 0; i--) {
            reverseTweets.push(newTweets[i])
        }
        res.status(200).send(reverseTweets)
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
    const { id } = req.params
    const tweet = req.body
    const validation = tweetSchema.validate(tweet, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    try{
        await db.collection("tweets").updateOne({
         _id: new ObjectId (id)
        },{$set: tweet})
        res.sendStatus(204)
    }
    catch(err){
        res.sendStatus(404)
    }
})

app.delete("/tweets/:id", async (req, res) => {
    const tweetId = req.params.id
    try{
        const resultado = await db.collection("tweets").deleteOne({
            _id: new ObjectId(tweetId)
        })
        if(resultado.deletedCount === 0){
            return res.status(404).send("Tweet não encontrado")
        }
        res.sendStatus(204)
    }
    catch(err){
        console.log(err)
        res.status(404).send("Erro ao tentar deletar o tweet")
    }
})

app.listen(PORT,() => {
    console.log(`Servidor rodando na porta ${PORT}`)
})

