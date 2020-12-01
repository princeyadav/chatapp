const express = require('express')
const http = require('http')
const path = require('path')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')
const  {generateMessage, generateLocation} =require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom, getRoom } = require('./utils/users')

const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicPath = path.join(__dirname,'../public')
app.use(express.static(publicPath))


io.on('connection',(socket)=>{
    console.log('New websocket connection')

    socket.on('join', (options, callback)=>{        
        const {error, user}=addUser({ id:socket.id, ...options })
                
        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('Msg', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('Msg',generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users : getUsersInRoom(user.room)
        })
        
        callback()
    })
    
    socket.on('sendMessage', (message, callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('Msg', generateMessage(user.username, message))
        callback()
    })

    socket.on('SendLocation', (coord, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMsg', generateLocation(user.username,`http://google.com/maps?q=${coord.latitude},${coord.longitude}`))
        callback()
    })

    socket.on('disconnect', ()=>{

        const user=removeUser(socket.id)

        if(user){
            io.to(user.room).emit('Msg', generateMessage(`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users: getUsersInRoom(user.room)
            })
        }        
        
    })
    
})


server.listen(port,()=>{
    console.log('server is up on '+port)
})