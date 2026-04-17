const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const { initDatabase } = require("./db/pool");
const { authRoutes } = require("./routes/auth.routes");
const { ebookRoutes } = require("./routes/ebook.routes");
const { purchaseRoutes } = require("./routes/purchase.routes");
const { libraryRoutes } = require("./routes/library.routes");
const { adminRoutes } = require("./routes/admin.routes");
const { progressRoutes } = require("./routes/progress.routes");
const { bookmarkRoutes } = require("./routes/bookmark.routes");
const { noteRoutes } = require("./routes/note.routes");
const { ratingRoutes } = require("./routes/rating.routes");
const { orderRoutes } = require("./routes/order.routes");
const { categoryRoutes } = require("./routes/category.routes");
const { notFound, errorHandler } = require("./middleware/error-handler");

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);

app.use(notFound);
app.use(errorHandler);

initDatabase()
  .then(() => {
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
