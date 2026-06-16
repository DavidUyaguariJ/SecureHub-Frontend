@Library('securehub-lib') _

securehubPipeline(
    service:       'frontend',
    imageName:     'securehub-frontend',
    devEnv:        'development',
    stageEnv:      'staging',
    prodEnv:       'production',
    repoUrl:       'github.com/DavidUyaguariJ/SecureHub-Frontend.git',
    getVersionCmd: {
        def ver = powershell(
            returnStdout: true,
            script: '''
                $pkg = Get-Content "package.json" | ConvertFrom-Json
                $pkg.version
            '''
        ).trim()
        return ver ?: "prod-${env.BUILD_NUMBER}"
    }
)
