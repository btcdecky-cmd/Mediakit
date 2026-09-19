import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { mediaRouter } from "./media";
import { providersRouter } from "./providers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mediaRouter);
router.use(providersRouter);

export default router;
