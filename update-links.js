const fs = require("fs");
const path = require("path");

const targetDirs = [
    path.join(__dirname, "src", "components"),
    path.join(__dirname, "src", "app"),
    path.join(__dirname, "src", "lib")
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
            const content = fs.readFileSync(fullPath, "utf8");

            const newContent = content
                .replace(/\/admin\/login/g, "/staff/login")
                .replace(/\/vendor\/login/g, "/staff/login");

            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent, "utf8");
                console.log("Updated:", fullPath);
            }
        }
    }
}

targetDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
        processDirectory(dir);
    }
});

console.log("Done replacing routes!");
