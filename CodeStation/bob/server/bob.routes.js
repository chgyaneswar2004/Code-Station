const { generateCode } = require("./bob.service");

module.exports = (express) => {
  const router = express.Router();

  router.post("/generate", async (req, res, next) => {
    try {
      const { prompt, fileName, fileContent } = req.body || {};
      if (typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ success: false, message: "Enter a prompt to generate code." });
      }
      if (prompt.length > 12000) {
        return res.status(413).json({ success: false, message: "Prompt is too long (12,000 character limit)." });
      }

      const code = await generateCode({
        prompt: prompt.trim(),
        fileName: typeof fileName === "string" ? fileName.slice(0, 256) : "",
        fileContent: typeof fileContent === "string" ? fileContent.slice(0, 30000) : "",
      });
      res.json({ success: true, code });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
