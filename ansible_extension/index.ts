import tl = require('azure-pipelines-task-lib/task');
import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner';

export class ansibletask {
    public static async runMain() {
        var actionAnsible: string = tl.getInput('action', true);
        var connectedService: string = tl.getInput("connectedServiceNameARM", true);
        var secret: string = tl.getInput("secret", false);
        var cwd: string = tl.getPathInput("cwd", true, false);

        tl.cd(cwd);
        this.login(connectedService);
        
        if(secret != null) {
            tl.writeFile(process.env.HOME + "/.ansible_password", secret)
        }
        if(tl.exist("requirements.txt")){
            this.throwIfError(tl.execSync("pip", `install -r requirements.txt`));
        }
        this.throwIfError(tl.execSync("ansible-playbook", `playbooks/${actionAnsible}.yml -e env=dev`, {cwd: cwd, env: { ...process.env, ...{ PWD: cwd } } }));
    }

    private static servicePrincipalId: string = null;
    private static servicePrincipalKey: string = null;
    private static tenantId: string = null;

    private static login(connectedService: string): void {
        let cliPassword: string = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
        var servicePrincipalId: string = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
        var tenantId: string = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);

        this.servicePrincipalId = servicePrincipalId;
        this.tenantId = tenantId;
        this.servicePrincipalKey = cliPassword;

        let escapedCliPassword = cliPassword.replace(/"/g, '\\"');
        tl.setSecret(escapedCliPassword.replace(/\\/g, '\"'));
        this.throwIfError(tl.execSync("az", `login --service-principal -u "${servicePrincipalId}" --password="${escapedCliPassword}" --tenant "${tenantId}"`), tl.loc("LoginFailed"));
    }

    private static throwIfError(resultOfToolExecution: IExecSyncResult, errormsg?: string): void {
        if (resultOfToolExecution.code != 0) {
            tl.error("Error Code: [" + resultOfToolExecution.code + "]");
            if (errormsg) {
                tl.error("Error: " + errormsg);
            }
            throw resultOfToolExecution;
        }
    }
}

ansibletask.runMain();