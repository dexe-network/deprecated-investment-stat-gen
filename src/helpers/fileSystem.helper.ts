import fs from 'fs';

export const storeData = (data: any, path: string) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data))
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export const loadData = <T>(path: string): T => {
    try {
        return JSON.parse(fs.readFileSync(path, 'utf8'))
    } catch (err) {
        console.error(err)
        throw err;
    }
}
