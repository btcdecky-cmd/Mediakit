import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { mediaRouter } from "./media";
import { providersRouter } from "./providers";
import { openinaryRouter } from "./openinary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mediaRouter);
router.use(providersRouter);
router.use(openinaryRouter);

export default router;
