const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-loc')
const $messages = document.querySelector('#messages')

//Templates

const messageTemplate = document.querySelector('#message-template').innerHTML
const messageUrlTemplate = document.querySelector('#messageUrl').innerHTML
const sideBarTemplate = document.querySelector('#side-bar').innerHTML
const roomNameTemplate = document.querySelector('#roomname-template').innerHTML

//options
const {username, room}=Qs.parse(location.search, { ignoreQueryPrefix:true})

const autoscroll = ()=>{
    //newMessage
    const $newMessage = $messages.lastElementChild
    //Height of the new Message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight
    //Height of message container
    const containerHeight = $messages.scrollHeight
    //how far have i scrolled?
    const scrolOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrolOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('Msg', (msg)=>{
    console.log('Message : ', msg)
    const html = Mustache.render(messageTemplate,{
        username:msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMsg',(msg)=>{
    console.log(msg)
    const html = Mustache.render(messageUrlTemplate,{
        username:msg.username,
        url:msg.loc,
        createdAt:moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    const html_users = Mustache.render(sideBarTemplate,{        
        users
    })
    const html_room = Mustache.render(roomNameTemplate,{
        room        
    })
    document.querySelector('#sidebar').innerHTML= html_users
    document.querySelector('#room-name').innerHTML= html_room
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =''
        $messageFormInput.focus()
        
        if(error){
            return console.log(error)
        }

        console.log('Message Delivered!')
    })
})

$sendLocationButton.addEventListener('click',()=>{

    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation)
    {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        
        socket.emit('SendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude },()=>{
                console.log('Location Shared!')
                $sendLocationButton.removeAttribute('disabled')
            })
    })
})

socket.emit('join',{ username, room}, (error)=>{

    if(error){
        alert(error)
        location.href ='/'
    }
})