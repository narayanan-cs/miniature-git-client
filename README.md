# miniature-git-client
Clone of a tiny subset of commands used in git client. Specifically it covers init, add(files), commit, diff, push and status commands on master branch 
# Installation
It is like all other codebase setups in nodejs
# Usage
If one knows basic git commands, one knows what this does because it is but a clone of those commands.
# API
Create a empty remote repository and a personal access token before running these commands.

* yarn ccgitinit <nameOfYourRepository>
Asks a bunch of one-time questions and initializes your local git repository with package.json and .env files in it. These 2 files are necessary for the operation of all commands
The output looks like:

    ![image](https://github.com/narayanan-cs/miniature-git-client/assets/28868399/30be4868-0878-4948-a5ea-0c9a35957574)

Enter the repo and run the following commands
* yarn ccgitadd <file1> <file2>... or yarn ccgitadd .
  Adds the files to the staging area

* yarn ccgitcommit <commitMessage>
commits the files to the master branch
Output looks like:

    ![image](https://github.com/narayanan-cs/miniature-git-client/assets/28868399/507af278-842e-4148-a6f3-33f0858455a0)

* yarn ccgitpush
  pushes the commits to remote rempository
  output looks like:

    ![image](https://github.com/narayanan-cs/miniature-git-client/assets/28868399/9e62f8a8-fb34-4753-9d09-c98ae19b529d)

* yarn ccgitdiff
  The behaviour is same as jsdiff tool by kpdecker. You can read it [here](https://github.com/kpdecker/jsdiff/blob/master/README.md)  

* yarn ccgitstatus
  Gives the status of untracked files, staged files, modified files and deleted files if any
  Output looks like:

      ![image](https://github.com/narayanan-cs/miniature-git-client/assets/28868399/c1586eb3-65e8-434f-b251-7af2ae358975)

# Edge cases covered
I have covered the following cases  

  &rarr; adding files more than once. Can be any number of times  
  
  &rarr; modifying staged files and adding them again. Can be any number of times  
  
  &rarr; trying to commit before staging  
  
  &rarr; trying to push before committing  
  
  &rarr; trying to push before staging  
  
  &rarr; There is a good chance that you do not give right username and PAT for your remote repo when prompted and so the commands will not work properly. In this case start over with a new repo  
  

# License
See [License](https://github.com/narayanan-cs/miniature-git-client/blob/main/LICENSE)
  
  
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/narayanan-cs/miniature-git-client)  
