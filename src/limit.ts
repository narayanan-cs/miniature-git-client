import { Buffer } from 'node:buffer';

const buf = Buffer.allocUnsafe(100);

//buf.writeInt32BE(1703393292, 0);
buf.fill('f48dd853820860816c75d54d0f584dc863327a7c',0,20,'hex')
console.log(buf);
// Prints: <Buffer 01 02 03 04>