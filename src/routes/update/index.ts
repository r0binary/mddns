import { Router } from "express";
import {
  oneOf,
  query,
  validationResult as validateQuery,
} from "express-validator";
import type { Query } from "express-serve-static-core";
import { MultiUpdater } from "../../updaters/index.js";

export interface TypedRequestQuery<T extends Query> extends Express.Request {
  originalUrl: string;
  query: T;
}

export type UpdateQuery = {
  domain: `${string}.${string}`;
  hostname: string;
  ip4addr?: string;
  ip6addr?: string;
};

const queryValidation = [
  query("domain").isFQDN().withMessage("Please provide a valid domain"),
  query("hostname")
    .default("@")
    .isString()
    .withMessage("Please provide a valid hostname"),
  oneOf([
    query("ip4addr")
      .optional()
      .isIP(4)
      .withMessage("Please provide a valid IP address"),
    query("ip6addr")
      .optional()
      .isIP(6)
      .withMessage("Please provide a valid IP address"),
  ]),
];

const router = Router();
router.get(
  "/update",
  queryValidation,
  async (req: TypedRequestQuery<UpdateQuery>, res: any) => {
    console.info(`Incoming request ${req.originalUrl}`);
    const errors = validateQuery(req);
    if (!errors.isEmpty()) {
      console.error(
        `Failed to process request ${req.originalUrl}: ${JSON.stringify(
          errors.array()
        )}`
      );
      return res.status(422).json({ errors: errors.array() });
    }

    const { domain, hostname, ip4addr, ip6addr } = req.query;

    try {
      const updater = new MultiUpdater();
      await updater.init();

      const result = await updater.update({
        domain,
        hostname,
        ip4addr,
        ip6addr,
      });

      res
        .status(200)
        .header("Content-Encoding", "utf-8")
        .header("Content-Type", "application/json")
        .send(result);
      console.info(`Request ${req.originalUrl}: HTTP/200 OK`);
    } catch (error) {
      res
        .status(500)
        .header("Content-Encoding", "utf-8")
        .header("Content-Type", "text/plain")
        .send((error as Error).message);
      console.error(
        `Request ${req.originalUrl}: HTTP/500 ${(error as Error).message}`
      );
    }
  }
);

export default router;
