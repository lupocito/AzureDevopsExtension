# Azure Devops Extension

This is a proof of concept on how to create an Azure DevOps Extension. I'm not developer and don't know nothing about NodeJS, so sorry in any mistake realized.

This extension will allow, on a build or release pipeline, to wrap an Ansible Playbook run. It's not generalized to work in any way, it's really targeted on a concrete case to see how to wrap calls.

## Requirements

- We need an organization created on Azure DevOps.
- We need NodeJS installed on our workstation.
- We need tfx-cli installed on our workstation.

## First steps

After create an organization on [Azure DevOps](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/create-organization?view=azure-devops), we need installed 'npm' on our workstation. After all, we can install '[TFS Cross Platform Command Line Interface](https://www.npmjs.com/package/tfx-cli)' with a simple command:

```bash
sudo npm install -g tfx-cli
```

## Structure folder

To create our first Azure DevOps Extension, we need to create a structure folder like this:

    |--- README.md
    |--- images
        |--- extension-icon.png
    |--- <Extension Name>
    |--- vss-extension.json

## Coding our Azure DevOps Extension

In order to initialize our extension, install libraries, etc... We should be inside our extension folder (In our case, '\<Extension Name\>') and launch the next commands:

```bash
npm init # Default values
npm install azure-pipelines-task-lib --save
npm install @types/node --save-dev
npm install @types/q --save-dev
npm install typescript@4.0.2 --save-dev
./node_modules/typescript/bin/tsc --init
```

We need to create a file called 'task.json', were we will define our task metadata, inputs, outputs, etc...:

```json
{
    "$schema": "https://raw.githubusercontent.com/Microsoft/azure-pipelines-task-lib/master/tasks.schema.json",
    "id": "{{taskguid}}",
    "name": "{{taskname}}",
    "friendlyName": "{{taskfriendlyname}}",
    "description": "{{taskdescription}}",
    "helpMarkDown": "",
    "category": "Utility",
    "author": "{{taskauthor}}",
    "version": {
        "Major": 0,
        "Minor": 1,
        "Patch": 0
    },
    "instanceNameFormat": "Echo $(samplestring)",
    "inputs": [
        {
            "name": "samplestring",
            "type": "string",
            "label": "Sample String",
            "defaultValue": "",
            "required": true,
            "helpMarkDown": "A sample string"
        }
    ],
    "execution": {
        "Node10": {
            "target": "index.js"
        }
    }
}
```

You can create an unique GUID with [this online tool](https://www.guidgen.com/).

An we will create our typescript file called 'index.ts' with the code that must be executed on each execution:

```typescript
import tl = require('azure-pipelines-task-lib/task');

async function run() {
    try {
        const inputString: string | undefined = tl.getInput('samplestring', true);
        if (inputString == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
            return;
        }
        console.log('Hello', inputString);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
```

This typescript must be transformed to .js file with command:

```bash
tsc index.ts
```

## Package extension and upload to marketplace

We have all our code ready to be uploaded to marketplace but, first of all, we need to create a manifest file called 'vss-extension.json' (replace 'hello_world' with your extension folder name):

```json
{
    "manifestVersion": 1,
    "id": "Custom_task",
    "name": "Hello World Custom Task",
    "version": "0.0.1",
    "publisher": "DavidDuque",
    "targets": [
        {
            "id": "Microsoft.VisualStudio.Services"
        }
    ],    
    "description": "Hello World Custom Task.",
    "categories": [
        "Azure Pipelines"
    ],
    "icons": {
        "default": "images/extension-icon.png"        
    },
    "files": [
        {
            "path": "hello_world"
        }
    ],
    "contributions": [
        {
            "id": "custom-build-release-task",
            "type": "ms.vss-distributed-task.task",
            "targets": [
                "ms.vss-distributed-task.tasks"
            ],
            "properties": {
                "name": "hello_world"
            }
        }
    ]
}
```

To produce a .vsix file to upload to Microsoft Marketplace, you need to execute:

```bash
tfx extension create --manifest-globs vss-extension.json
```

IMPORTANT: .vsix file must be less than 50 MB, so it's good to execute 'npm install --production' inside extension folder to remove development libraries and reduce .vsix size.

## Publish extension

First of all, we need a publisher in marketplace in order to upload our extension. You can follow [this steps](https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-build-task?view=azure-devops#step-5-publish-your-extension).

After that, this extension will be in private mode due to our manifest created, so to install in our Azure DevOps Organization we must share from marketplace.

You can automate all build .vsix file and upload extension to marketplace with this bash code:

```bash
cd <Extension Name>

npm install 
./node_modules/typescript/bin/tsc index.ts 
npm install --production

cd ..

tfx extension publish --manifest-globs vss-extension.json --share-with <Azure DevOps Organization> --token <Personal Access Token>
```

IMPORTANT: Personal Access Token is created inside Azure DevOps with Marketplace -> Publish permission and changing 'Organization' to 'All accesible organizations' value.

## Install Extension

The last step is to open Azure DevOps Organization settings, go to 'Extensions', select 'Shared' tab and install it.

## References

- https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-build-task?view=azure-devops
- https://www.guidgen.com/
- https://github.com/microsoft/azure-pipelines-tasks/tree/master/Tasks/AzureCLIV1
- https://github.com/Microsoft/azure-pipelines-task-lib
- https://marketplace.visualstudio.com/manage
- https://stackoverflow.com/questions/54179509/how-do-you-delete-a-visual-studio-marketplace-publisher/54197823