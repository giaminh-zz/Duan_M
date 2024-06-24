import express from "express";
import mysql from "mysql";
import cors from "cors";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const saltRounds = 10;

// const myPlaintextPassword = "s0//P4$$w0rD";
// const someOtherPlaintextPassword = "not_bacon";

// const upload = multer({ dest: 'uploads/' });

const app = express();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });
app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true

}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
app.use(bodyParser.json())
app.use(cookieParser())
const PORT = process.env.PORT || 8081;
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "store",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
  console.log("Database connected successfully");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

app.get("/danhmuc", (req, res) => {
  const sql = "SELECT * FROM categories";
  db.query(sql, (err, result) => {
    if (err) {
      return res.json(err);
    }
    return res.json(result);
  });
});
app.post("/danhmuc/create", (req, res) => {
  const sql = "INSERT INTO categories (`ten_danh_muc`, `status`) VALUES (?, ?)";
  const values = [req.body.ten_danh_muc, req.body.status];
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.json(err);
    }
    return res.json(result);
  });
});
app.put("/update/:id", (req, res) => {
  const sql =
    "UPDATE categories SET `ten_danh_muc` = ?, `status` = ? WHERE id = ?";
  const id = req.params.id;
  const values = [req.body.ten_danh_muc, req.body.status, id];
  db.query(sql, [...values], (err, result) => {
    if (err) {
      return res.json({ Message: "Loi He Thong" });
    }
    return res.json(result);
  });
});
app.delete("/danhmuc/delete/:id", (req, res) => {
  const danhmucID = req.params.id;
  const sql = "DELETE FROM categories WHERE id = ? ";
  db.query(sql, [danhmucID], (err, result) => {
    if (err) {
      return res.json(err);
    }
    return res.json(result);
  });
});

app.get("/product", (req, res) => {
  const sql = "SELECT * FROM products";
  db.query(sql, (err, result) => {
    if (err) {
      return res.json({ Message: "Lỗi Hệ Thống" });
    }
    return res.json(result);
  });
});
app.post("/product/create", upload.single("hinh_anh"), (req, res) => {
  const { ten_san_pham, mo_ta, gia_san_pham, ten_danh_muc, ngay_dang, status } =
    req.body;
  const hinh_anh = req.file ? req.file.filename : null;

  const sql =
    "INSERT INTO products (`ten_san_pham`, `mo_ta`, `gia_san_pham`, `ten_danh_muc`, `ngay_dang`, `hinh_anh`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [
    ten_san_pham,
    mo_ta,
    gia_san_pham,
    ten_danh_muc,
    ngay_dang,
    hinh_anh,
    status,
  ];
  db.query(sql, values, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(201).json({
      id: results.insertId,
      ten_san_pham,
      mo_ta,
      gia_san_pham,
      ten_danh_muc,
      ngay_dang,
      hinh_anh,
      status,
    });
  });
});
app.put("/product/update/:id", upload.single("hinh_anh"), (req, res) => {
  const { ten_san_pham, mo_ta, gia_san_pham, ten_danh_muc, ngay_dang, status } =
    req.body;
  const hinh_anh = req.file ? req.file.filename : null;
  const id = req.params.id;

  const sql = `UPDATE products SET ten_san_pham = ?, mo_ta = ?, gia_san_pham = ?, ten_danh_muc = ?, ngay_dang = ?, ${
    hinh_anh ? "hinh_anh = ?, " : ""
  }status = ? WHERE id = ?`;

  const values = [
    ten_san_pham,
    mo_ta,
    gia_san_pham,
    ten_danh_muc,
    ngay_dang,
    status,
    id,
  ];
  if (hinh_anh) values.splice(5, 0, hinh_anh); // Insert hinh_anh before status and id

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.json({ Message: "Lỗi Hệ Thống" });
    }
    return res.json(result);
  });
});
app.get("/products/:id", (req, res)=>{
  const sql = "SELECT * FROM products WHERE id = ?"
  const productId = parseInt(req.params.id);
  if (isNaN(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }
  db.query(sql, [productId], (err, result) => {
    if (err) {
        console.error('Error querying database:', err);
        return res.status(500).json({ message: "Lỗi Hệ Thống" });
    }

    if (result.length === 0) {
        return res.status(404).json({ message: "Product not found" });
    }

    const product = result[0];
    res.json(product);
});
})
app.delete("/product/delete/:id", (req, res) => {
  const sql = "DELETE FROM products WHERE id = ?";
  const productID = req.params.id;
  db.query(sql, [productID], (err, result) => {
    if (err) {
      return res.json(err);
    }
    return res.json(result);
  });
});

app.get("/baiviet", (req, res) => {
  const sql = "SELECT * FROM baiviet";
  db.query(sql, (err, result) => {
    if (err) {
      return res.json({ Message: "Lỗi Hệ Thống" });
    }
    return res.json(result);
  });
});
app.post("/baiviet/create", upload.single("image"), (req, res) => {
  const sql =
    "INSERT INTO baiviet (`tieu_de`, `noi_dung`, `ngay`, `image`) VALUES(?, ?, ?, ?)";
  const { tieu_de, noi_dung, ngay } = req.body;
  const image = req.file ? req.file.filename : null;
  const value = [tieu_de, noi_dung, ngay, image];
  db.query(sql, value, (err, result) => {
    if (err) {
      return res.json({ message: "Lỗi Hệ Thống" });
    }
    return res.json({ result });
  });
});
app.put("/baiviet/update/:id", upload.single("image"), (req, res) => {
  const { tieu_de, noi_dung, ngay } = req.body;
  const image = req.file ? req.file.filename : null;
  const id = req.params.id;
  const value = [tieu_de, noi_dung, ngay, image, id];
  const sql = `UPDATE baiviet SET tieu_de = ?, noi_dung = ?, ngay = ?, ${
    image ? "image = ? " : ""
  } WHERE id = ?`;
  if (image) value.splice(5, 0, image);
  db.query(sql, value, (err, result) => {
    if (err) {
      return res.json({ Message: "Lỗi Hệ Thống" });
    }
    return res.json(result);
  });
});
app.delete("/baiviet/delete/:id", (req, res) => {
  const sql = "DELETE from baiviet WHERE id = ?";
  const id = req.params.id;
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.json({ Message: "Lỗi Hệ Thống" });
    }
    return res.json({ result });
  });
});

app.post("/register", (req, res) => {
    const { username, phone, email } = req.body;
    const sql = "INSERT INTO users (`username`, `phone`, `email`, `password`) VALUES (?, ?, ?, ?)";
    bcrypt.hash(req.body.password.toString(), saltRounds, (err, hash)=>{
        if(err) {
            return res.json({Error: "Error for hassing password"})
        }
        const value = [username, phone, email, hash]
        db.query(sql, value, (err, result)=>{
            if(err){
                return res.json({Message: "Lỗi Hệ Thống"})
            }
            return res.json({Status: "Thành Công"})
        })
    })
  });
  const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ Error: "Bạn không Thể Đăng Nhập" });
    } else {
      jwt.verify(token, "jwt-secret-key", (err, decoded) => {
        if (err) {
          return res.status(401).json({ Error: "Token không đúng" });
        } else {
          req.name = decoded.name;
          next();
        }
      });
    }
  };
  app.get('/checkauth', verifyUser, (req, res) => {
    try {
      return res.json({ Status: "Thành Công", name: req.name });
    } catch (error) {
      console.error("Error in /check-auth endpoint:", error);
      return res.status(500).json({ Error: "Internal Server Error" });
    }
  });
app.post('/login', (req, res) => {
    const sql = 'SELECT * FROM users WHERE email = ? ';
    db.query(sql, [req.body.email], (err, data)=>{
        if(err){
            return res.json({Error: "Lỗi Hệ Thống"})
        }
        if(data.length > 0){
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
              if(err) return res.json({ Status: "Error", Error: "Password compare error"})
                if(response){
                  const username = data[0].username;
                  console.log(username);
                  const token = jwt.sign({ username }, "jwt-secret-key", { expiresIn: '1d' });
                  res.cookie('token', token)
                  return res.json({ Status: "Success", Data: data })
                }else{
                  return res.json({ Status: "Error", Status: "Password Not Matched"})
                }
               
            })
        } else{
          return res.json({Status: "Error", Error: "Khong co Email"})
        }
    })
})
app.get('/logout', (req, res)=>{
  res.clearCookie('token');
  return res.json({Status: "Thành Công"});
})
app.use("/uploads", express.static("uploads"));

// const uploads = multer({ storage: storage });
app.listen(PORT, () => {
  console.log("listening on port");
});
