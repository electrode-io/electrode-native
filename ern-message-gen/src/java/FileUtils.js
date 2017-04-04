import fs from 'fs';
export default ({
    writeStringToFile(file, content){
        file.getParentFile().mkdirs();
        fs.writeFileSync(file.getPath(), content, 'utf-8');
    }
})
