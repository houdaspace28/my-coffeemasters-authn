import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import * as url from 'url';
import bcrypt from 'bcryptjs';
import * as jwtJsDecode from 'jwt-js-decode';
import base64url from "base64url";
import SimpleWebAuthnServer from '@simplewebauthn/server';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express()
app.use(express.json())

const adapter = new JSONFile(__dirname + '/auth.json');
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] }

const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

function findUser(email){
  const results = db.data.users.filter(user => user.email === email);
  if(results.length === 0) return undefined;
  return results[0];
}

app.post("/auth/login-google",(req,res)=>{
  let jwt = jwtJsDecode.jwtDecode(req.body.credential);
  const user = {
    email: jwt.payload.email,
    name: jwt.payload.given_name,
    password: flase,
  }
  const foundUser = findUser(user.email);
  if(foundUser){
    user,google = jwt.payload.aud;
    db.write();
    res.send({ok:true,name:user.name,email:user.email});
  }else{
    db.data.users.push({
      ...user,
      google: jwt.payload.aud,
    })
  }

})

app.post('/auth/login', (req, res) => {
    const user = findUser(req.body.email);
    if(!user){
      res.send({ok: false, message: "Credentials wrong"});
    }else{
      if(bcrypt.compareSync(req.body.password, user.password))
        res.send({ok:true,name:user.name,email:user.email});
    }
})


// ADD HERE THE REST OF THE ENDPOINTS
app.post('/auth/register',(req,res)=>{
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    const user = {
      name: req.bpdy.name,
      email: req.bpdy.email,
      password: hashedPassword
    }
    const foundUser = findUser(user.email);
    if(foundUser){
      res.send({ok: false, message: "User already exists"});
    }
    else{
      db.data.users.push(user);
      db.write()
      res.send({ok:true})
    }
});


app.get("*", (req, res) => {
    res.sendFile(__dirname + "public/index.html"); 
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

