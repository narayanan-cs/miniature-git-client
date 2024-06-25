import * as fs from 'fs'
import {exec} from 'child_process'

export class Utils
{
    constructor()
    {

    }

    public allocateBufferSpace(space: number): Buffer
    {
        return Buffer.alloc(space)
    }

    public getStatistics(fileName: string)
    {
        return fs.statSync(fileName)
    }

    public fillBuffer(buffer: Buffer, content: string|number, offset?: number, end?: number, encoding?: BufferEncoding ): Buffer
    {
        return buffer.fill(content,offset?offset:0,end?end:buffer.length,typeof content === 'string'?encoding?encoding:'utf8':'utf8')
    }

    public writeIntegersToBuffer(buffer: Buffer, value: bigint|number, bitValue: number, offset?: number, BEorLE?: string, byteLength?: number,): Buffer
    {
        switch (bitValue)
        {
            case 64: 
            switch (BEorLE)
            {
               case 'B': buffer.writeBigUint64BE(<bigint>value,offset?offset:0)
               case 'L': buffer.writeBigUint64LE(<bigint>value,offset?offset:0)
               default: buffer.writeBigUint64BE(<bigint>value,offset?offset:0)
            }
            break
            case 32: 
            switch (BEorLE)
            {
               case 'B': buffer.writeInt32BE(<number>value,offset?offset:0)
               case 'L': buffer.writeInt32LE(<number>value,offset?offset:0)
               default:  buffer.writeInt32BE(<number>value,offset?offset:0)
            }
            break
            case 16: 
            switch (BEorLE)
            {
               case 'B': buffer.writeUInt16BE(<number>value,offset?offset:0)
               case 'L': buffer.writeInt16LE(<number>value,offset?offset:0)
               default: buffer.writeUInt16BE(<number>value,offset?offset:0)
            }
            break
            case 8: 
            switch (BEorLE)
            {
               case 'B': buffer.writeIntBE(<number>value,offset?offset:0,byteLength)
               case 'L': buffer.writeIntLE(<number>value,offset?offset:0,byteLength)
               default: buffer.writeIntBE(<number>value,offset?offset:0,byteLength)
            }
            break
        }
        
        return buffer    

    }
    public readIntegersFromBuffer(buffer: Buffer, bitValue: number, offset?: number, BEorLE?: string, byteLength?: number,): bigint|number
    {
        
        switch (bitValue)
        {
            case 64: 
            switch (BEorLE)
            {
                
               case 'B': 
               return buffer.readBigUint64BE(offset?offset:0)
               case 'L': return buffer.readBigUint64LE(offset?offset:0)
               default:  let valueRead = buffer.readBigUint64BE(offset?offset:0); return valueRead

            }
            
            case 32: 
            switch (BEorLE)
            {
               case 'B': return buffer.readInt32BE(offset?offset:0)
               case 'L': return buffer.readInt32LE(offset?offset:0)
               default: let valueRead =   buffer.readInt32BE(offset?offset:0);return valueRead
            }
            
            case 16: 
            switch (BEorLE)
            {
               case 'B': return buffer.readUInt16BE(offset?offset:0)
               case 'L': return buffer.readInt16LE(offset?offset:0)
               default: let valueRead = buffer.readUInt16BE(offset?offset:0); return valueRead
            }
            
            case 8: 
            switch (BEorLE)
            {
               case 'B': return buffer.readIntBE(offset?offset:0,byteLength)
               case 'L': return buffer.readIntLE(offset?offset:0,byteLength)
               default: let valueRead = buffer.readIntBE(offset?offset:0,byteLength);return valueRead
            }
            
        }
        
            

    }

    public writeDataToFile(fileName: string, data: Buffer): void
    {
        fs.writeFileSync(fileName, data)
    }
    public appendDataToFile(fileName: string, data: Buffer|string): void
    {
        fs.appendFileSync(fileName, data)
    }
}