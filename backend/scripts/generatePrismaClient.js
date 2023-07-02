/* eslint-disable no-console */
import { fork } from "node:child_process";
import { createReadStream, readFile, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

readFile("./node_modules/.prisma/hash", "utf-8", function (err, savedHash) {
  createReadStream("./prisma/schema.prisma")
    .pipe(createHash("sha1").setEncoding("hex"))
    .on("finish", async function () {
      // @ts-ignore
      const currentHash = this.read();
      if (currentHash !== savedHash) {
        console.log("Generating prisma client ...");
        const prismaGenerate = fork("./node_modules/prisma", ["generate"]);
        prismaGenerate.on("error", (error) => {
          console.error(error);
        });
        prismaGenerate.on("close", (code) => {
          if (code) {
            console.error("Command 'prisma generate' failed");
          } else {
            writeFileSync("./node_modules/.prisma/hash", currentHash, "utf-8");
          }
        });
      }
    });
});
