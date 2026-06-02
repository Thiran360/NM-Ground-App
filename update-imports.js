const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dirs = ['app', 'components', 'hooks', 'utils', 'store'];
dirs.forEach(d => {
    const files = walk(d);
    files.forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        const newContent = content
            .replace(/useBookingLock(['"])/g, 'use-booking-lock$1')
            .replace(/adminStore(['"])/g, 'admin-store$1')
            .replace(/bookingUtils(['"])/g, 'booking-utils$1');
        
        if (content !== newContent) {
            fs.writeFileSync(f, newContent, 'utf8');
            console.log('Updated ' + f);
        }
    });
});
