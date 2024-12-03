

import express from 'express'
import dotenv from "dotenv"
import connectdb from './database/db.js'
import bcrypt from "bcrypt"
import { nanoid } from 'nanoid'
import jwt from 'jsonwebtoken'
import cors from "cors"
import admin from "firebase-admin"
import serviceAccountKey from "./react-blogging-app-fc375-firebase-adminsdk-87noe-bf5bc32610.json" assert { type: "json"}
import { getAuth } from "firebase-admin/auth"
import { v2 as cloudinary } from "cloudinary"
import Blog from "./Schema/Blog.js"
import User from "./Schema/User.js"
import Admin from "./Schema/admin.js"

const server = express()
dotenv.config()
server.use(express.json())
server.use(cors())

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})


const USERNAME = process.env.DB_USERNAME
const PASSWORD = process.env.DB_PASSWORD
connectdb(USERNAME, PASSWORD)




cloudinary.config({
    cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME',
    api_key: 'process.env.CLOUDINARY_API_KEY',
    api_secret: 'process.env.CLOUDINARY_API_SECRET',
});

const generateUploadURL = async () => {
    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;
    const timestamp = Math.floor(date.getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            public_id: imageName,
        },
        process.env.CLOUDINARY_API_SECRET
    );

    const uploadURL = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload?timestamp=${timestamp}&public_id=${imageName}&api_key=${process.env.CLOUDINARY_API_KEY}&signature=${signature}`;

    return uploadURL;
};

server.get("/upload-url", async (req, res) => {
    try {
        const url = await generateUploadURL();
        res.status(200).json({ uploadURL: url });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});




let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}


const generateUsername = async (email) => {
    let username = email.split("@")[0]

    let isUsernameNotUnique = await User.exists({ "personal_info.username": username }).then((result) => result)

    if (isUsernameNotUnique) {
        username += nanoid().substring(0, 5);
    }
    return username;


}


//user-signup
server.post("/signup", (req, res) => {
    const { fullname, email, password } = req.body

    if (fullname.length < 3) {
        return res.status(403).json({ "error": "full name must be 3 letters long" })
    }
    if (!email.length) {
        return res.status(403).json({ "error": "Enter email" })
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "email is  invalid" })
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "password must be 6 to 20 characters long with a numeric, 1 lowercse and 1 uppercase " })
    }

    bcrypt.hash(password, 10, async (err, hashed_password) => {
        let username = await generateUsername(email)

        let user = new User({
            personal_info: { fullname, email, password: hashed_password, username }
        })

        user.save().then((u) => {
            return res.status(200).json(formatDatatoSend(u))
        })
            .catch(err => {

                if (err.code == 11000) {
                    return res.status(500).json({ "error": "Email already exists" })
                }
                return res.status(500).json({ "error": err.message })
            })
    })
})

//user-signin
server.post("/signin", (req, res) => {
    let { email, password } = req.body
    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({ "error": "Email not found" })
            }

            if (!user.google_auth) {
                bcrypt.compare(password, user.personal_info.password, (err, result) => {
                    if (err) {
                        return res.status(403).json({ "error": "Error occured while login please try again" })
                    }
                    if (!result) {
                        return res.status(403).json({ "error": "Incorrect password" })
                    }
                    else {
                        return res.status(200).json(formatDatatoSend(user))

                    }
                })
            }
            else {
                return res.status(403).json({ "error": "Account was created using google. try logging with google " })
            }

        })
        .catch(err => {
            console.log(err.messag);
            return res.status(500).json({ "error": err.message })
        })
})


//google-auth
server.post("/google-auth", async (req, res) => {
    const { access_token } = req.body
    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {
            let { email, name, picture } = decodedUser
            picture = picture.replace("s96-c", "s384-c")

            let user = await User.findOne({ "personal_info.email": email }).select("perosnal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
                return u || null
            })
                .catch(err => {
                    return res.status(500).json({ "error": err.message })
                })

            if (user) {
                if (!user.google_auth) {
                    return res.status(403).json({ "error": "This email was signed up without google. please log in with password to access the account" })
                }
            }
            else {
                let username = await generateUsername(email)

                user = new User({
                    personal_info: { fullname: name, email, username },
                    google_auth: true
                })
                await user.save().then((u) => {
                    user = u
                })
                    .catch(err => {
                        return res.status(500).json({ "error": err.message })
                    })
            }
            return res.status(200).json(formatDatatoSend(user))

        })
        .catch(err => {
            return res.status(500).json({ "error": "failed to authenticate you with google. Try with some other google account" })
        })

})

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if (token == null) {
        return res.status(401).json({ error: "No access token" })
    }
    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "access token is invalid" })
        }
        req.user = user.id
        next()
    })

}

server.post('/latest-blogs', (req, res) => {

    let { page } = req.body
    let maxLimit = 5;

    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img perosnal_info.username personal_info.fullname -_id")
        .sort({ " publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ err: err.message })
        })
})

server.get("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({ draft: false })
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ err: err.message })
        })
})

server.get('/trending-blogs', (req, res) => {
    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img perosnal_info.username personal_info.fullname -_id")
        .sort({ "activity.total_read": -1, "activity.total_likes": -1, " publishedAt": -1 })
        .select("blog_id title publishedAt -_id")
        .limit(5)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

server.post('/search-blogs', (req, res) => {

    let { tag, query, page, author } = req.body

    let findQuery

    if (tag) {
        findQuery = { tags: tag, draft: false }
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') }
    }else if(author){
        findQuery = { author, draft:false}

    }

    let maxLimit = 2

    Blog.find(findQuery)
        .populate("author", "personal_info.profile_img perosnal_info.username personal_info.fullname -_id")
        .sort({ " publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ err: err.message })
        })
})

server.post('/search-blogs-count', (req, res) => {
    let { tag, query, author } = req.body

    let findQuery;

    if (tag) {
        findQuery = { tags: tag, draft: false }
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') }
    }else if(author){
        findQuery = { author, draft:false}

    }


    Blog.countDocuments(findQuery)
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })
        })
})

server.post("/search-users", (req,res) =>{
    let { query} = req.body

    User.find({"personal_info.username" : new RegExp(query, 'i')})
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then(users => {
        return res.status(200).json({users})
    })
    .catch(err =>{
        return res.status(500).json({error: err.message})
    })
})

server.post("/get-profile",(req,res) =>{
   let { username } = req.body
   User.findOne({"personal_info.username": username})
   .select("-personal_info.password -google_auth -updatedAt -blogs")
   .then(user => {
    return res.status(200).json(user)
   })
   .catch(err =>{
    return res.status(500).json({error: err.message})
   })
})

server.post('/create-blog', verifyJWT, (req, res) => {

    let authorId = req.user
    let { title, banner, des, tags, content, draft } = req.body

    if (!title.length) {
        return res.status(403).json({ error: "Add title to the blog" })
    }

    if (!draft) {

        if (!des.length || des.length > 200) {
            return res.status(403).json({ error: "Description should under 200 characters" })
        }

        if (content.blocks.length) {
            return res.status(403).json({ error: "there must be some blog content to publish it" })
        }

        if (!tags.length || tags.length > 10) {
            return res.status(403).json({ error: "Add tags in roder to publish the blog, max 10 " })
        }

    }
    tags = tags.map(tag => tag.toLowerCase())
    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid()

    let blog = new Blog({
        title, banner, des, tags, content, author: authorId, blog_id, draft: Boolean(draft)

    })

    blog.save().then(blog => {
        let incrementVal = draft ? 0 : 1
        User.findOneAndUpdate({ _id: authorId }, {
            $inc: { "account_info.total_posts": incrementVal }, $push: {
                "blogs": blog._id
            }
        })

            .then(user => {
                return res.status(200).json({ id: blog.blog_id })
            })
            .catch(err => {
                return res.status(500).json({ error: "failed to update total posts number" })
            })
    })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})



const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No access token" });

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized access" });
        }
        req.admin = decoded.id;
        next();
    });
};
server.get("/admin/dashboard", verifyAdmin, (req, res) => {
    res.status(200).json({ message: "Welcome to the admin dashboard" });
});



//admin-signup
server.post("/admin/signup", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: "Password hashing failed" });

        const newAdmin = new Admin({ email, password: hashedPassword });

        try {
            await newAdmin.save();
            const token = jwt.sign({ id: newAdmin._id, role: "admin" }, process.env.SECRET_ACCESS_KEY);
            res.status(200).json({ access_token: token });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

// Admin Signin
server.post("/admin/signin", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
    }

    bcrypt.compare(password, admin.password, (err, result) => {
        if (err || !result) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.SECRET_ACCESS_KEY);
        res.status(200).json({ access_token: token });
    });
});
  




const PORT = 3000
server.listen(PORT, () => {
    console.log('server running on port ' + PORT);
})

