import express from 'express';
import mysql from 'mysql';
import cors from "cors";
import multer from 'multer';

const upload = multer({ dest: 'uploads/' }); 
const app = express();
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const PORT = 8081;
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "store",
})

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1); 
    }
    console.log('Database connected successfully');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});


app.get('/danhmuc', (req, res) =>{
    const sql = "SELECT * FROM categories"
    db.query(sql, (err,result)=>{
        if(err){
            return res.json(err)
        }
        return res.json(result)
    })
})
app.post('/danhmuc/create', (req, res) => {
    const sql = "INSERT INTO categories (`ten_danh_muc`, `status`) VALUES (?, ?)";
    const values = [
        req.body.ten_danh_muc,
        req.body.status
    ];
    db.query(sql, values, (err, result)=>{
        if(err){
            return res.json(err);
        }
        return res.json(result)
    })
})
app.put('/update/:id', (req, res) => {
    const sql = "UPDATE categories SET `ten_danh_muc` = ?, `status` = ? WHERE id = ?"
    const id = req.params.id
    const values = [
        req.body.ten_danh_muc,  
        req.body.status,
        id
    ]
    db.query(sql, [...values], (err, result) => {
        if (err) {
            return res.json({Message: 'Loi He Thong'});
         } 
         return res.json(result);
    })
});
app.delete('/danhmuc/delete/:id', (req, res) => {
    const danhmucID = req.params.id
        const sql = "DELETE FROM categories WHERE id = ? "
        db.query(sql, [danhmucID], (err, result) => {
        if(err){
            return res.json(err)
        }
        return res.json(result);
        })
        
    });

app.get('/product', (req, res) =>{
    const sql = "SELECT * FROM products"
    db.query(sql, (err, result) =>{
        if(err){
            return res.json({Message: "Lỗi Hệ Thống"})
        }
        return res.json(result)
    })
})
app.post('/product/create', upload.single('hinh_anh'), (req, res) => {
    const sql = "INSERT INTO products (`ten_san_pham`, `mo_ta`, `gia_san_pham`, `ten_danh_muc`, `ngay_dang`, `hinh_anh`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [
        req.body.ten_san_pham,
        req.body.mo_ta,
        req.body.gia_san_pham,
        req.body.ten_danh_muc,
        req.body.ngay_dang,
        req.file ? req.file.filename : null,
        req.body.status
    ];

    db.query(sql, values, (err, results) => {
        if (err) {
            return res.json(err); 
        }
        return res.status(201).json({
            id: results.insertId,
            ...req.body,
            hinh_anh: req.file ? req.file.filename : null
        });
    });
});

app.listen(PORT, ()=>{
    console.log("listening on port");
})