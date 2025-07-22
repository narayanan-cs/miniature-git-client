const childProcess =require('child_process')
const fs = require("fs")

describe("test cases for all the ccgit commands",()=>{
    const repoName = "test";
    const repoName2 = "myrepo8";
    const repoName3 = "myrepo9";
    let cwd: any, baseDir: any, targetDir: any;
    
beforeAll(() => {
    console.log("process.platform:", process.platform);
console.log("Default shell (ComSpec):", process.env.ComSpec);
console.log("SHELL env:", process.env.SHELL);
 
    baseDir =  process.cwd()
    targetDir = `${baseDir}/${repoName}`;
    childProcess.execSync(`yarn run ccgitinit ${repoName}`,{cwd:baseDir, stdio: 'inherit'})
    //childProcess.execSync(`cd ${repoName}`)
    cwd =  targetDir
    
});
test('do from init to push',()=>{
console.log(targetDir,"*******************")
//    let cwd =  process.cwd()
  //  childProcess.execSync(`yarn run ccgitinit ${repoName}`,{cwd:cwd, stdio: 'inherit'})
    //childProcess.execSync(`cd ${repoName}`)
   // cwd =  process.cwd()+`/${repoName}`
    
    childProcess.execSync("touch test1 test12 test123",{cwd: targetDir})
    childProcess.execSync("yarn run ccgitadd .",{cwd:targetDir, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 1",{cwd:targetDir, stdio: 'inherit'})
    
    childProcess.execSync("yarn run ccgitpush",{cwd:targetDir, stdio: 'inherit'})
    expect.anything()
    
})

test('do more than 1 push',()=>{ 
console.log(cwd,"*******************")    
//    let cwd =  process.cwd()
  //   cwd =  process.cwd()+`/${repoName}`
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
//    let cwd =  process.cwd()
  //   cwd =  process.cwd()+`/${repoName}`
    childProcess.execSync("touch test12345 test123456 test1234567",{cwd:cwd})
    childProcess.execSync("yarn run ccgitadd .",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitstatus",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitcommit 5",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitstatus",{cwd:cwd, stdio: 'inherit'})
    childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
expect.anything()
})

test('do push with diff',()=>{ 
//    let cwd =  process.cwd()
  //   cwd =  process.cwd()+`/${repoName}`
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
//    let cwd =  process.cwd()
     //childProcess.execSync(`yarn run ccgitinit ${repoName}`,{cwd:cwd, stdio: 'inherit'})
     //childProcess.execSync(`cd ${repoName}`)
  //   cwd =  process.cwd()+`/${repoName}`
     childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
     //childProcess.execSync("cd ..",{cwd:cwd})
     //childProcess.execSync(`rm -rf ${repoName}`,{cwd:cwd, stdio: 'inherit'})

    expect.anything()
})

test('do push after add',()=>{ 
//    let cwd =  process.cwd()
  //   cwd =  process.cwd()+`/${repoName}`
     childProcess.execSync("touch test12345678 test123456789 test1234567890",{cwd:cwd})
     childProcess.execSync("yarn run ccgitadd .",{cwd:cwd})
     childProcess.execSync("yarn run ccgitpush",{cwd:cwd, stdio: 'inherit'})
     //childProcess.execSync("cd ..",{cwd:cwd})
     //childProcess.execSync(`rm -rf ${repoName}`,{cwd:cwd, stdio: 'inherit'})

    expect.anything()
})
test('do commit after init',()=>{ 
    let cwd =  process.cwd()
     childProcess.execSync(`yarn run ccgitinit ${repoName3}`,{cwd:cwd, stdio: 'inherit'})
     cwd =  process.cwd()+`/${repoName3}`
     childProcess.execSync("yarn run ccgitcommit 1",{cwd:cwd, stdio: 'inherit'})
     childProcess.execSync("cd ..",{cwd:cwd})
     childProcess.execSync(`rm -rf ${repoName3}`,{cwd:cwd, stdio: 'inherit'})

    expect.anything()
})

})