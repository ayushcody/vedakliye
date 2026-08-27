const fs = require('fs');
const htmlparser2 = require('htmlparser2');

const content = fs.readFileSync('src/components/MappingScreen.tsx', 'utf8');

const parser = new htmlparser2.Parser({
    onopentag(name, attribs) {
        if(name !== "img" && name !== "input" && name !== "br" && name !== "hr" && name !== "AnswerSheetViewer" && name !== "Sidebar" && name !== "TopBar" && name !== "QuestionCard") {
            // console.log("open", name);
        }
    },
    onclosetag(tagname) {
        // console.log("close", tagname);
    },
    onerror(err) {
        console.log("Error:", err);
    }
}, {xmlMode: true});

parser.write(content);
parser.end();
console.log("Parsed");
