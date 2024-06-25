const childProcess =require('child_process')
const fs = require("fs")

describe("test cases for all the ccgit commands",()=>{
    
test('do init to push',()=>{
    
    let cwd =  process.cwd()
    childProcess.execSync("yarn run ccgitinit myrepo3",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("cd myrepo3")
    cwd =  process.cwd()+"/myrepo3"
    
    childProcess.execSync("touch test1 test12 test123",{cwd: cwd})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 1",{cwd:cwd, stdio: 'inherit'})
    
    childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
    expect.anything()
    
})

test('do more than 1 push',()=>{ 
    let cwd =  process.cwd()
     cwd =  process.cwd()+"/myrepo3"
    childProcess.execSync("touch test12 test123 test1234",{cwd:cwd})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 2",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("touch test123 test1234 test12345",{cwd:cwd})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 3",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("touch test1234 test12345 test123456",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 4",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
    expect.anything()
    
})

test('do push with status',()=>{ 
    let cwd =  process.cwd()
     cwd =  process.cwd()+"/myrepo3"
    childProcess.execSync("touch test12345 test123456 test1234567",{cwd:cwd})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitstatus",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 5",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitstatus",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
expect.anything()
})

test('do push with diff',()=>{ 
    let cwd =  process.cwd()
     cwd =  process.cwd()+"/myrepo3"
    childProcess.execSync("touch test12345678 test123456789 test1234567890",{cwd:cwd})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("echo 'Hello world!'> test12345678",{cwd:cwd})
    childProcess.execSync("echo 'Hello world!Howdy?'> test123456789",{cwd:cwd})
    childProcess.execSync("echo 'Hello world!How are you?'> test1234567890",{cwd:cwd})
    childProcess.execSync("yarn run ccgitdiff",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 6",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
    expect.anything()
})

test('do push after init',()=>{ 
    let cwd =  process.cwd()
     childProcess.execSync("yarn run ccgitinit myrepo8",{cwd:cwd, stdio: 'inherit'})
     childProcess.execSync("cd myrepo8")
     cwd =  process.cwd()+"/myrepo8"
     childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
     childProcess.execSync("cd ..",{cwd:cwd})
     childProcess.execSync("rm -rf myrepo8",{cwd:cwd, stdio: 'inherit'})

    expect.anything()
})

test('do push after add',()=>{ 
    let cwd =  process.cwd()
     cwd =  process.cwd()+"/myrepo3"
     childProcess.execSync("touch test12345678 test123456789 test1234567890",{cwd:cwd})
     childProcess.execSync("yarn run ccgitadd .",{cwd:cwd})
     childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
     childProcess.execSync("cd ..",{cwd:cwd})
     childProcess.execSync("rm -rf myrepo3",{cwd:cwd, stdio: 'inherit'})

    expect.anything()
})
test('do commit after init',()=>{ 
    let cwd =  process.cwd()
    childProcess.execSync("yarn run ccgitinit myrepo9",{cwd:cwd, stdio: 'inherit'})
     cwd =  process.cwd()+"/myrepo9"
     childProcess.execSync("yarn run ccgitcommit 1",{cwd:cwd, stdio: 'inherit'})
     childProcess.execSync("cd ..",{cwd:cwd})
     childProcess.execSync("rm -rf myrepo9",{cwd:cwd, stdio: 'inherit'})

    expect.anything()
})

})