const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto) {
            next(null, true);
        } else {
            next({message: 'That filetype isn\'t allowed!'}, false)
        }
    }
}


exports.homePage = (req, res) => {
    res.render('index', {
        AgentName: 'youssef',
        title: "Helllllo"
    })
}

exports.addStore = (req, res) => {
    res.render('editStore', {
        title: "Add Store"
    })
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    if(!req.file) {
        next(); // skip to the next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // Once we have written the photo to our filesystem, keep going!
    next();
}

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
    console.log("It worked!");
    res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
    // 1. Query the database for list of all stores
    const stores = await Store.find();
    res.render('stores', {title: "Stores", stores})
}

exports.editStore = async (req, res) => {
    // 1. Find store with giving id
    const store = await Store.findById(req.params.id);
    // 2. TODO: confirm they are the owner of the store
    // 3. render out the edit form so the user can update their store
    res.render('editStore', {title: `Edit ${store.name} Store`, store})
}

exports.updateStore = async (req, res) => {
    // set location data to a point
    req.body.location.type = 'Point'
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true,
        runValidators: true
    }).exec();
    req.flash('success', `Successfully Updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store ➡</a>`)
    res.redirect(`/stores/${store._id}/edit`);
}


