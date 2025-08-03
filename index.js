const OpenAI = require('openai')
const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const pdfparse = require('pdf-parse');
const axios = require('axios');
const mongoose = require('mongoose');
const { type } = require('os');
const { timeStamp } = require('console');

dotenv.config()

const app = express();
app.use(cors({
    exposedHeaders: ['X-Filename'],
}));
app.use(express.json());

// const openai = new OpenAI({apiKey: process.env.OPEN_AI_KEY})
// console.log('here openai key', openai);

mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connection Successfull'))
.catch((error) => console.log('Connection Failed', error))

const { Schema, model } = mongoose;
const mongoSchema = new Schema({
    filename: {type: String, required: true},
    content: {type: String, required: true},
    contenttext: {type: String, required: true},
}, {timeStamp: true});

const Resume = model('resume', mongoSchema)

// let db;
// ;(async ()=>{
//     try {
//         db = await mysql.createConnection({
//             host: "localhost",
//             user: "root",
//             password: 'root',
//             database: "chat_resume"
//         })
//         console.log('Database Connected Successfully');
//     } catch (error) {
//         console.log('Database Failed to Connect', error);
//     }
// })()

const upload = multer({'dest': "/tmp/upload"});

app.use(express.static(path.join(__dirname, 'pdf-chat/dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pdf-chat/dist/index.html'));
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
        // console.log('Files Heres',req.file);
        // console.log('Files path',req.file.path);
        
        // const parsedpdf = await pdfparse(await fs.promises.readFile(req.file.path));
        const fileBuffer = await fs.promises.readFile(req.file.path);
        const parsedpdf = await pdfparse(fileBuffer);
        const result = new Resume({
            filename: req.file.originalname,
            content: fileBuffer.toString('base64'),
            contenttext: parsedpdf.text
        })

        const saved = await result.save();

        // const [result] = await db.execute("INSERT INTO resume (filename, content, contenttext) VALUES (?, ?, ?)", [
        //     req.file.originalname,
        //     fileBuffer.toString('base64'),
        //     parsedpdf.text
        // ])
        // console.log(result.insertId);
        
        res.status(200).json({
            status: "Success",
            message: 'File Uploaded Successfully',
            data: {
                id: saved._id
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "Failure",
            message: 'Fail to Upload'
        })
    }
})

app.post('/api/ask/:id', async(req, res) => {

    try {
        const id = req.params.id;
        const question = req.body.chatinput || '';
        // const [result] = await db.execute("SELECT contenttext FROM resume where id = ?", [id]);
        const resume = await Resume.findById(id);
        const pdftext = resume?.contenttext || '';
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions',{
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                { role: "system", content: "You are an assistant answering questions based on PDF content." },
                { role: "user", content: `PDF Content:\n${pdftext}\n\nQuestion: ${question}` }
            ],
            temperature: 0.2
        },{
            headers:{
                'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
                'Content-Type': 'application/json'
            }
        })

        console.log(response.data.choices);
        

        const answer = response.data.choices[0].message.content;

        return res.json({
            status: "Success",
            data: {
                answer
            }
        });

        // const completion = await openai.chat.completions.create({
        //     model: "meta-llama/llama-4-scout-17b-16e-instruct",
        //     messages: [
        //         { role: "system", content: "You are an assistant answering questions based on PDF content." },
        //         { role: "user", content: `PDF Content:\n${pdftext}\n\nQuestion: ${question}` }
        //     ],
        //     temperature: 0.2
        // });
        
        // res.json({
        //     status: "Success",
        //     data: {
        //         answer: completion.choices[0].message.content
        //     }
        // })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "Failure",
            data: {
                answer: 'Fail to generate answer'
            }
        })
    }
})

app.get("/api/files/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const resume = await Resume.findById(id);
        if(!resume) return res.status(404).json({ message: "File not found."})

        // const [result] = await db.execute("SELECT * FROM resume WHERE id = ?", [id]);
        // if(result.length == 0) return res.status(404).json({ message: "File not found."})
        // console.log("Get Result", result);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader("Content-Disposition", `attachment; filename="${resume.filename}"`);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("X-Filename", resume.filename);
        res.setHeader("Access-Control-Expose-Headers", "X-Filename");
        let fileContent;
        if (typeof resume.content === "string") {
            fileContent = Buffer.from(resume.content, "base64");
        } else {
            fileContent = resume.content;
        }
        res.status(200).send(fileContent);
        // res.status(200).json({
        //     status: "Success",
        //     message: "File found Successfully",
        //     data: {
        //         id: result[0].id,
        //         filename: result[0].filename,
        //         content: result[0].content
        //     }
        // })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
})

app.listen(4000, () => console.log("Server running on port 4000"));