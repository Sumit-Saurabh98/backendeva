const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require("dotenv").config()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const Todo = require("./models/Todo.model")
const User = require("./models/User.model")

const app = express();

app.use(express.json())
app.use(cors())


mongoose.connect(process.env.MONGODB_URL)


const generateToken = (user)=>{
    const payload = {
        id:user._id,
        email:user.email
    }
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn:"60d"})
}

const authenticateToken = (req, res, next) => {
    // const token = req.headers['authorization'];
    const token = req.headers.authorization?.split(" ")[1]
    if(!token){
        return res.status(401).json({message: "No token Provided"})
    }
    try {
        var decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({message: "Invalid token"})
    }
}

app.post("/signup", async(req, res)=>{
    try {
        const {email, password, ipAddress} =req.body
        const existingUsers = await User.findOne({email}) 
        if(existingUsers){
            return res.status(400).json({message:"user already exists"})
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const newUser = await User.create({
            email,
            password: hashPassword,
            ipAddress
        })
        const token = generateToken(newUser)
        res.status(201).json({ message:"signup successful",token})
    } catch (error) {
        console.log("Signup error: " + error);
        res.status(500).json({message: "Internal server Error"})
    }
})

app.post("/login", async(req, res)=>{
    try {
        const {email, password} = req.body
        const user = await User.findOne({email})
        if(!user) {
            return res.status(404).json({message: "User not found"})
        }

        const validPassword = await bcrypt.compare(password, user.password)
        if(!validPassword) {
            return res.status(401).json({message: "Invalid password"})
        }

        const token = generateToken(user)
        res.json({message:"Sign in Successful",token})
    } catch (error) {
        console.log("login error", error);
        res.status(500).json({message:"Internal Server Error"})
    }
})

app.get('/todos', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const todos = await Todo.find({user: userId})

        res.json({todos})
    } catch (error) {
        console.log("fetch todos error", error)
        res.status(500).json({message:"Internal Server Error"})
    }
})

app.post('/todos', authenticateToken, async(req, res)=>{
    try {
        const{taskname, status, tag} = req.body
        const userId = req.user.id

        const newTodo  = await Todo.create({
            taskname,
            status,
            tag,
            user:userId
        })
        res.status(201).json({message:"todo created",todo: newTodo})
    } catch (error) {
        console.log("Create todo error", error)
        res.status(500).json({message:"Internal server error"})
    }
})

app.put("/todos/:todoId", authenticateToken, async(req, res)=>{

    try {
        const {taskname, status, tag} = req.body
        const userId = req.user.id
        const todoId = req.params.todoId

        const updatedTodo = await Todo.findOneAndUpdate({_id:todoId, user:userId},{taskname, status, tag}, {new:true} );
        if(!updatedTodo){
            return res.status(404).json({message:"Todo not found"})
        }
        res.json({message:"todo updated", todo:updatedTodo})
    } catch (error) {
        console.log("updated todo error", error)
        res.status(500).json({message:"Internal server error"})
    }
})

app.delete("/todos/:todoId", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id
        const todoId = req.params.todoId

        const deletedTodo = await Todo.findOneAndDelete({ _id: todoId, user: userId });
        if(!deletedTodo){
            // console.log(userId + todoId)
            return res.status(404).json({message:"not deleted"})
        }
        res.json({message:"todo deleted successfully"})
    } catch (error) {
        console.log("deleted todo error", error)
        res.status(500).json({message:"Internal server error"})
    }
})



app.listen(process.env.PORT, async() => {
    try {
        console.log(`listening on ${process.env.PORT}`)
    } catch (error) {
        console.log('error', error)
    }
})