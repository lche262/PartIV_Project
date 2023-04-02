const PORT = 8000
const express = require('express')
const {MongoClient} = require('mongodb')
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
const uri = 'mongodb+srv://admin:admin@cluster0.vsqizjh.mongodb.net/?retryWrites=true&w=majority'
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/',(req, res) => {
    res.json('Hello to my app')
})

app.post('/signup',async (req, res) => {
    const client = new MongoClient(uri)
    const { email, password }= req.body

    const generatedUserId = uuidv4
    const hashedPassword = await bcrypt.hash(password,10)

    try{
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')


        const sanitizesEmail = email.toLowerCase()

        const existingUser = users.findOne({sanitizesEmail})
        console.log(existingUser)

        if(existingUser){
            return res.status(409).send('User already exists. Please login')
        }

        const data= {
            user_id: generatedUserId,
            email: sanitizesEmail,
            hashed_password: hashedPassword
        }
        const insertedUser = await users.insertOne(data)

        const token = jwt.sign(insertedUser, sanitizesEmail,{
            expiresIn: 60 * 24 *30,
        })

        res.status(201).json({ token, userId: generatedUserId, email: sanitizesEmail})
    }catch (err){
        console.log(err)
    }
})

app.get('/users',async (req, res) => {
    const client = new MongoClient(uri)
    try{
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const returnedUsers = await users.find().toArray()
        res.send(returnedUsers)
    }
    finally {
        await client.close()
    }

})


app.listen(PORT , () => console.log('Server running on PORT'+ PORT))