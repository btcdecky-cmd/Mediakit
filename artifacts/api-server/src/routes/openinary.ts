import { Router, type IRouter } from "express";
import { signUpload } from "../lib/upload-token";

export const openinaryRouter: IRouter = Router();

openinaryRouter.post("/openinary/sign", async (req, res) => {
  const fetchSite = req.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    res.status(403).json({ error: "Upload signing is only available from this application." });
    return;
  }

  const apiKey = process.env.OPENINARY_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Openinary uploads are not configured." });
    return;
  }

  try {
    // TODO: replace the fixed folder with an authenticated user folder when auth is added.
    const signed = await signUpload("https://cdn.openinary.dev", apiKey, { expiresIn: 300, folder: "mediakit/uploads" });
    res.json(signed);
  } catch (error) {
    req.log?.error?.({ err: error }, "Openinary signing failed");
    res.status(502).json({ error: error instanceof Error ? error.message : "Could not sign upload." });
  }
});
