const Property = require('../models/Property');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bycrypt = require('bcrypt');
const multer = require("multer");
const fs = require("fs");


function VerifyToken(req, res, next) {
    const token = req.headers.authorization;
    console.log(token);
    if (!token) {
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }

    jwt.verify(token, process.env.ACCESS_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        }
        req.userId = decoded.id;
        next();
    });
}

const SignUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const salt = await bycrypt.genSalt();
        const passwordHash = await bycrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: passwordHash,
            properties: []
        });

        const user = await newUser.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const LoginIn = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const isMatch = await bycrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.ACCESS_KEY);
        delete user.password;
        res.setHeader('authorization', token);
        res.setHeader('userid', user._id);
        res.status(200).json({ token, user ,  userId: user._id });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }
}


const GetAllProperties = async (req, res) => {
    try {
        
        const properties = await Property.find();

        res.status(200).json({ properties });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const CreateProperty = async (req, res) => {
    try {
        
        const id = req.headers.userid;

        if(!id){
            return res.status(400).json({ msg: "User Not Authenticated" });
        }

        const {
            address,
            price,
            location,
            type,
            date,
        }  =  req.body;

        const user = await User.findById(id);

        const newProperty = new Property({
            address,
            price,
            location,
            type,
            date,
        });
        
        const property = await newProperty.save();

        user.properties.push(property._id);

        await user.save();

        res.status(201).json({ property, user });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const UpdateProperty = async (req, res) => {
    try {
        
        const propId = req.params.id;
        const userId = req.headers.userid;

        if(!propId){
            return res.status(400).json({ msg: "Property Id Not Provided" });
        }

        if(!userId){
            return res.status(400).json({ msg: "User Not Authenticated" });
        }

        const {
            address,
            price,
            location,
            type,
            date,
        }  =  req.body;

        const user = await User.findById(userId);

        const arr = user.properties;

        const prop = arr.includes(propId);

        if(prop){
            const property = await Property.findById(propId);

            property.address = address;
            property.price = price;
            property.location = location;
            property.type = type;
            property.date = new Date(date);

            await property.save();

            return res.status(201).json({ property });

        }else{
            res.status(400).json({ msg: "Property Not Found" });
        }

        res.status(400).json({ msg: "Property Not Found" });

    } catch (error) {
        
    }
}


const DeleteProperty = async ( req, res) => {
    try {
        
        const { id } = req.params;
        const userid = req.headers.userid;

        if(!userid){
            return res.status(400).json({ msg: "User Not Authenticated" });
        }

        const user  =  await User.findById(userid);

        const arr = user.properties;

        const propToDelete = arr.includes(id);

        if(!propToDelete){
            return res.status(400).json({ msg: "Not Allowed to Delete this property" });
        }else{
            const index = arr.indexOf(id);
            if(index > -1){
                arr.splice(index, 1);
            }
            user.properties = arr;
            await user.save();
        }

        const prop =  await Property.findByIdAndDelete(id);

        res.status(200).json({ prop });

    } catch (error) {

        res.status(500).json({ error: error.message });
        
    }
}

const ListUsersProperty = async (req, res) => {
    try {
        
        const userId = req.headers.userid;

        if(!userId){
            return res.status(400).json({ msg: "User Not Authenticated" });
        }

        const user = await User.findById(userId);

        const arr = user.properties;

        const properties = [];

        for(let i = 0; i < arr.length; i++){
            const property = await Property.findById(arr[i]);
            properties.push(property);
        }

        res.status(200).json({ properties });

    } catch (error) {

        res.status(500).json({ error: error.message });
        
    }
}

module.exports = {
    SignUp,
    LoginIn,
    GetAllProperties,
    CreateProperty,
    VerifyToken,
    UpdateProperty,
    DeleteProperty,
    ListUsersProperty
}