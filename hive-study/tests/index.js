// Entry point so `node --test hive-study/tests/` works: on Node 22+ a directory argument to
// --test is resolved like require(), which loads this index.js. It pulls in every *.test.cjs here
// so all their tests register in one run. (The glob form `node --test "hive-study/tests/*.test.cjs"`
// runs the same files one process each.)
const fs = require("node:fs");
const path = require("node:path");
for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith(".test.cjs")).sort()) require(path.join(__dirname, f));
