import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { streamPage } from "@nativeframe/server";
import "./components/todo-form.js";
import "./components/todo-list.js";
import "./components/todo-item.js";
import "./components/todo-footer.js";
import "./components/todo-app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 3001;

http
  .createServer(async (req, res) => {
    const url = req.url ?? "/";

    // ── Home page ─────────────────────────────────────────────────────────────
    if (url === "/" || url === "") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      for await (const chunk of streamPage("todo-app", {}, {
        title: "NativeFrame Todos",
        storeSnapshot: { todos: [] },
        scripts: ["/dist/client.js"],
      })) {
        res.write(chunk);
      }
      res.end();
      return;
    }

    // ── Static files from dist/ ───────────────────────────────────────────────
    if (url.startsWith("/dist/")) {
      const filePath = path.join(__dirname, "..", url.slice(1));
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, {
          "Content-Type": "application/javascript; charset=utf-8",
        });
        res.end(data);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  })
  .listen(PORT, () => {
    console.log(`NativeFrame todo running at http://localhost:${PORT}`);
  });
