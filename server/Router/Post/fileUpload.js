//fileUpload middleware
const picMimetypes = {
    "image/bmp": true,
    "image/x-windows-bmp": true,
    "image/gif": true,
    "image/x-icon": true,
    "image/jpeg": true,
    "image/png": true,
};

//NOTE: Not supported in early stage
// const vidMimetypes = {
//     //TODO: fill this
// };

var uuidv4 = require("uuid/v4");
var router = require("express").Router();
var multer = require("multer");
var postRecord = require("../../ExperienceSystem/postRecord");
var accountSystem = require("");

//Upload Specifications
var textStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        //destination for storing files.

        //TODO: generate destination

        cb(null, './upload/articles');
    },
    filename: function(req, file, cb) {
        //Avoid collision using uuidV4 (random)
        var extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, uuidv4() + extension);
    }
});

var picStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        //destination for storing files.

        //TODO: generate destination

        cb(null, './upload/pictures');
    },
    filename: function(req, file, cb) {
        //Avoid collision using uuidV4 (random)
        var extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, uuidv4() + extension);
    }
});

//NOTE: Not supported in early stage
// var vidStorage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         //destination for storing files.
//
//         //TODO: generate destination
//
//         cb(null, './upload/videos');
//     },
//     filename: function(req, file, cb) {
//         //Avoid collision using uuidV4 (random)
//         var extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
//         cb(null, uuidv4() + extension);
//     }
// });

var picFileFilter = (req, file, cb) => {

    //TODO: Authentication

    //check mimetypes
    try {
        if (picMimetypes[file.mimetype] === true) {
            cb(null, true);
        } else cb(null, false);
    } catch (err) {
        cb(new Error(err));
    }
}

//NOTE: Not supported in early stage
// var vidFileFilter = (req, file, cb) => {
//
//     //TODO: Authentication
//
//     //check mimetypes
//     try {
//         if (vidMimetypes[file.mimetype] === true) {
//             cb(null, true);
//         } else cb(null, false);
//     } catch (err) {
//         cb(new Error(err));
//     }
//     //others
// }

var uploadPic = multer({storage: picStorage,fileFilter: picFileFilter});
var uploadText = multer({storage: textStorage});

//NOTE: Not supported in early stage
// var uploadVid = multer({storage: vidStorage,fileFilter: vidFileFilter});

router.post("/pictures", uploadPic.single('image'), (req, res, next)=>{
    //return the path
    var resContent = {
        path: req.file.path
    };
    res.write(JSON.stringify(resContent));
    res.end();
});

router.post("/articles", uploadText.single('article'), async (req, res, next)=>{
    //TODO: implement getUser
    var user = getUser();
    var resContent = {
        status: true
    };
    //save record in database
    try{
        var postID = undefined;
        postID = await postRecord.saveRecord(user, req.file.path, req.body.isNew, req.body.postID);
        //add the record to account

        //TODO: incorporate with account system
        if(req.body.isNew) await accountSystem.addPost(user, postID);
    }
    catch(err) {
        resContent.status = false;
    }
    res.write(JSON.stringify(resContent));
    res.end();
});

//NOTE: Not supported in early stage
// router.post("/videos", uploadVid.single('video'), (req, res, next)=>{
//     //return the path
//     var resContent = {
//         path: req.file.path
//     };
//     res.write(JSON.stringify(resContent));
//     res.end();
// });

module.exports = router;
