import * as core from '@actions/core';
import * as exec from '@actions/exec';

import * as fs from 'fs';
import * as path from 'path';

async function run() {
    let sarifFolder = core.getInput('sarif_folder', {required: true});

    const commitOid = process.env['GITHUB_SHA'];

    // Its in the form of 'refs/heads/master'
    let prefix = 'refs/heads/'
    let branchName = process.env['GITHUB_REF'];
    if (branchName?.substr(0, prefix.length) === prefix) {
        branchName = branchName.substr(prefix.length);
    }

    // Get repoID
    await exec.exec('curl', ['-H', 'Authorization: Bearer '+process.env['GITHUB_TOKEN'],
        'https://api.github.com/repos/'+process.env['GITHUB_REPOSITORY'],
        '-o', '/tmp/getRepo']
    );
    let raw = fs.readFileSync('/tmp/getRepo').toString();
    let repoInfo = JSON.parse(raw);
    let repoID = repoInfo['id'];

    //let analysisName = process.env['GITHUB_WORKFLOW'];
    let analysisName = 'CodeQL';

    for (let sarifFile of fs.readdirSync(sarifFolder)) {
        exec.exec('curl', ['-f', 'https://turbo-scan.githubapp.com/upload?repository_id='+repoID+
            '&commit_oid='+commitOid+'&branch_name='+branchName+'&analysis_name='+analysisName, '-v',
            '-H', 'Authorization: Bearer '+process.env['GITHUB_TOKEN'],
            '-d', '@'+path.join(sarifFolder, sarifFile)]
        ).catch(reason => {
            core.setFailed('Curl command failed: '+reason);
        });
    }
}

run();