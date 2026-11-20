const fs=require("node:fs"), path=require("node:path"),assert=require("node:assert/strict");
const dir=path.resolve("hive-study/dist");
let html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(dir,"style.css"),"utf8")+'</style>');
const scripts=[];
html=html.replace(/<script defer src="([a-z]+\.js)"><\/script>/g,(_,name)=>{scripts.push(fs.readFileSync(path.join(dir,name),"utf8"));return ""});
assert.ok(scripts.length > 0 && scripts.every(Boolean));
html=html.replace("</body>",()=>"<script>\n"+scripts.join("\n")+"\n</script>\n</body>");
assert.ok(!html.includes('defer src='));
fs.writeFileSync("Hive-Study.html",html);

