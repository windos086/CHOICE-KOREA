import * as fs from 'fs';

const code = fs.readFileSync('./src/App.tsx', 'utf8');

function checkTags(tag) {
  let depth = 0;
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Ignore commented out lines
    if (line.trim().startsWith('//')) continue;
    
    // Simplistic tag count
    const matches = line.match(new RegExp('<' + tag + '(?![a-zA-Z])', 'g')) || [];
    let opens = 0;
    for(let m of matches) opens++;
    
    // self closings
    const selfCloses = line.match(new RegExp('<' + tag + '[^>]*/>', 'g')) || [];
    opens -= selfCloses.length;
    
    const closes = (line.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    let oldDepth = depth;
    depth += (opens - closes);
    if (depth < 0 && oldDepth >= 0) { console.log('first negative depth at', i+1, line); }
  }
  console.log(`${tag} final depth:`, depth);
}

checkTags('div');
checkTags('main');
