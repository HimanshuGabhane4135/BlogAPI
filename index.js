const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const Blog = require("./blog");

const app = express();
const port = 3000;

mongoose
  .connect("mongodb://localhost/blog", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error(err);
  });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const filename = `${Date.now()}.${ext}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/blogs", async (req, res) => {
  const blogs = await Blog.find();
  res.json(blogs);
});

app.get("/blogs/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.json(blog);
});

app.post("/blogs", upload.single("cover_image"), async (req, res) => {
  const { title, slug, content, author_name, author_description } = req.body;
  const cover_image = req.file.filename;

  const blog = new Blog({
    title,
    slug,
    cover_image,
    content,
    author_name,
    author_description,
  });

  try {
    const newBlog = await blog.save();
    res.json(newBlog);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.put("/blogs/:id", upload.single("cover_image"), async (req, res) => {
  const { title, slug, content, author_name, author_description } = req.body;
  const cover_image = req.file ? req.file.filename : undefined;

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    if (title) blog.title = title;
    if (slug) blog.slug = slug;
    if (cover_image) blog.cover_image = cover_image;
    if (content) blog.content = content;
    if (author_name) blog.author_name = author_name;
    if (author_description) blog.author_description = author_description;

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.delete("/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    await blog.remove();
    res.json({ msg: "Blog removed" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
