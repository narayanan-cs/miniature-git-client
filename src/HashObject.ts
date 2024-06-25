import * as fs from 'fs'
import * as crypto from 'crypto'
import * as zlib from 'zlib'
import {FileType} from './FileType'

export class HashObject 
{
private _stat: fs.Stats
private _header: string
public path: string
protected shaStore: string
constructor(path: string)
{
    this.path = path
    this.setStat()
    const newFileType = new FileType()
    this.setHeader(newFileType.getFileType(this.path))
}
public setStat(): void
{
    this._stat = fs.statSync(this.path)
}

public getStat(): fs.Stats
{
    return this._stat
}

public setHeader(fileType: string): void
{
 this._header = fileType+ " " + this.getStat().size + "\u0000"
}

public getHeader(): string
{
    return this._header
}

public readFileContent(): Buffer
{
    const fileContent = fs.readFileSync(this.path)
    return fileContent
}

public createStore(): Buffer
{
    const header = this.getHeader()
    const body = this.readFileContent()
    let store = Buffer.alloc(header.length+body.length)
    store.write(header)
    body.copy(store,header.length,0,body.length)
    return store
}

public calculateshaOfStore(): string
{
  return crypto.createHash('sha1').update(this.createStore()).digest('hex')
}


public deflateStore(): Buffer
{
    return zlib.deflateSync(this.createStore())
}

public getShaStore(): string
{
    return this.shaStore
}

public writeToObjectDB(): void
{
    const deflatedStore = this.deflateStore()
    const shaStore = this.calculateshaOfStore()
    const dirPath = "./.git/objects/" + shaStore.substring(0,2) // to do : remove hardcoding of .git/objects
    !fs.existsSync(dirPath)?fs.mkdirSync(dirPath):""
    const filePath = dirPath + "/" + shaStore.substring(2)
    fs.writeFileSync(filePath,deflatedStore)
}
}
