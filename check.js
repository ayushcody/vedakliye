const fs = require('fs');
const content = fs.readFileSync('src/components/MappingScreen.tsx', 'utf8');
let paren = 0, curly = 0;
for(let i=0; i<content.length; i++) {
  if(content[i] === '(') paren++;
  if(content[i] === ')') paren--;
  if(content[i] === '{') curly++;
  if(content[i] === '}') curly--;
}
console.log("paren", paren, "curly", curly);
