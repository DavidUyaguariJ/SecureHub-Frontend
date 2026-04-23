@Library('securehub-lib') _

securehubPipeline(
    service:   'frontend',
    imageName: 'securehub-frontend',
    devEnv:    'development',
    stageEnv:  'pre',
    prodEnv:   'production',
    repoUrl:   'github.com/DavidUyaguariJ/SecureHub-Frontend.git',
    getVersionCmd: {
        powershell(
            script: 'node -p "require(\'./package.json\').version"',
            returnStdout: true
        ).trim()
    }
)
