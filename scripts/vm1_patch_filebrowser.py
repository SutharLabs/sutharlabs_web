import sys

path = "/home/ubuntu/vault/server.js"
with open(path, "r") as f:
    code = f.read()

if "Reverse proxy for File Browser" not in code:
    proxy_block = """
// Reverse proxy for File Browser (filebrowser/filebrowser) on port 8080
const http = require("http");
app.use("/filebrowser", (req, res) => {
  const options = {
    hostname: "172.17.0.1",
    port: 8080,
    path: "/filebrowser" + req.url,
    method: req.method,
    headers: { ...req.headers, host: req.headers.host || "127.0.0.1:8080" }
  };
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on("error", (err) => {
    res.status(502).json({ error: "File Browser service unavailable", details: err.message });
  });
  req.pipe(proxyReq);
});
"""
    code = code.replace("const app = express();", "const app = express();\n" + proxy_block)
    with open(path, "w") as f:
        f.write(code)
    print("Updated server.js with filebrowser proxy")
else:
    print("Already updated")

