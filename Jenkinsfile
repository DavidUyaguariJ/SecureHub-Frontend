pipeline {
    agent any

    environment {
        IMAGE_NAME = "securehub-frontend"
        KUBE_NAMESPACE = ""
        BUILD_ENV = ""
        IMAGE_TAG = ""
        GITOPS_REPO = "https://github.com/DavidUyaguariJ/SecureHub-GitOps.git"
        GITOPS_BRANCH = "main"
        MANIFEST_PATH = ""
    }

    stages {

        stage('Validate Branch') {
            steps {
                script {
                    def branch = env.BRANCH_NAME?.trim()
                    def isPR = env.CHANGE_ID != null
                    if (isPR) {
                        error "Los Pull Requests no ejecutan pipeline."
                    }
                    if (!(branch == 'develop' || branch == 'master' || branch.startsWith('stage'))) {
                        error "Branch no permitida: '${branch}'"
                    }
                    echo "Ejecutando pipeline para branch: '${branch}'"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Set Environment') {
            steps {
                script {
                    def branch = env.BRANCH_NAME?.trim()
                    echo "CHECKPOINT branch='${branch}' longitud=${branch?.length()} esDevelop=${branch == 'develop'}"

                    def buildEnv  = ''
                    def namespace = ''
                    def imageTag  = ''
                    def manifestP = ''

                    if (branch == 'develop') {
                        buildEnv  = 'development'
                        namespace = 'dev'
                        imageTag  = "dev-${env.BUILD_NUMBER}"
                        manifestP = 'kubernetes/dev'
                    } else if (branch?.startsWith('stage')) {
                        buildEnv  = 'pre'
                        namespace = 'stage'
                        imageTag  = "stage-${env.BUILD_NUMBER}"
                        manifestP = 'kubernetes/stage'
                    } else if (branch == 'master') {
                        buildEnv  = 'production'
                        namespace = 'prod'
                        manifestP = 'kubernetes/prod'
                        imageTag  = powershell(
                            script: 'node -p "require(\'./package.json\').version"',
                            returnStdout: true
                        ).trim()
                    } else {
                        error "Branch no manejada: '${branch}'"
                    }

                    env.BUILD_ENV      = buildEnv
                    env.KUBE_NAMESPACE = namespace
                    env.IMAGE_TAG      = imageTag
                    env.MANIFEST_PATH  = manifestP

                    echo "BUILD_ENV:      ${env.BUILD_ENV}"
                    echo "KUBE_NAMESPACE: ${env.KUBE_NAMESPACE}"
                    echo "IMAGE_TAG:      ${env.IMAGE_TAG}"
                    echo "MANIFEST_PATH:  ${env.MANIFEST_PATH}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        def buildEnv   = env.BUILD_ENV  ?: 'development'
                        def imageTag   = env.IMAGE_TAG  ?: "dev-${env.BUILD_NUMBER}"
                        def dockerUser = env.DOCKER_USER
                        def imageName  = env.IMAGE_NAME
                        env.IMAGE_TAG  = imageTag

                        powershell """
                            docker build `
                                --build-arg BUILD_ENV=${buildEnv} `
                                -t ${dockerUser}/${imageName}:${imageTag} `
                                -f Dockerfile .
                        """
                    }
                }
            }
        }

        stage('Login DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    // bat con sintaxis CMD — sin espacio antes del pipe
                    bat 'echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin'
                }
            }
        }

        stage('Push Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        def imageTag   = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"
                        def dockerUser = env.DOCKER_USER
                        def imageName  = env.IMAGE_NAME
                        powershell """
                            docker push ${dockerUser}/${imageName}:${imageTag}
                        """
                    }
                }
            }
        }

        stage('Tag Git (solo master)') {
            when { branch 'master' }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    script {
                        def tag      = env.IMAGE_TAG
                        def gitUser  = env.GIT_USER
                        def gitToken = env.GIT_TOKEN
                        powershell """
                            git config user.name "jenkins"
                            git config user.email "jenkins@local"
                            git tag "v${tag}"
                            git push https://${gitUser}:${gitToken}@github.com/DavidUyaguariJ/SecureHub-Frontend.git "v${tag}"
                        """
                    }
                }
            }
        }

        stage('Checkout GitOps Repo') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    script {
                        def gitopsBranch = env.GITOPS_BRANCH
                        def gitUser      = env.GIT_USER
                        def gitToken     = env.GIT_TOKEN
                        powershell """
                            if (Test-Path "gitops-repo") {
                                Remove-Item -Recurse -Force "gitops-repo"
                            }
                            git clone https://${gitUser}:${gitToken}@github.com/DavidUyaguariJ/SecureHub-GitOps.git gitops-repo
                            cd gitops-repo
                            git checkout ${gitopsBranch}
                        """
                    }
                }
            }
        }

        stage('Update Manifests for ArgoCD') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        def namespace    = env.KUBE_NAMESPACE ?: 'dev'
                        def imageTag     = env.IMAGE_TAG      ?: "dev-${env.BUILD_NUMBER}"
                        def dockerUser   = env.DOCKER_USER    ?: 'daviduyaguarij'
                        def imageName    = env.IMAGE_NAME     ?: 'securehub-frontend'
                        def manifestPath = env.MANIFEST_PATH  ?: 'kubernetes/dev'

                        def template   = readFile('deployment-template.yaml')
                        def deployment = template
                            .replace('${NAMESPACE}',      namespace)
                            .replace('${IMAGE_TAG}',      imageTag)
                            .replace('${DOCKERHUB_USER}', dockerUser)
                            .replace('${IMAGE_NAME}',     imageName)

                        powershell """
                            New-Item -ItemType Directory -Force -Path "gitops-repo/${manifestPath}"
                        """
                        writeFile(
                            file: "gitops-repo/${manifestPath}/deployment.yaml",
                            text: deployment
                        )
                        echo "Manifiesto actualizado en: gitops-repo/${manifestPath}/deployment.yaml"
                    }
                }
            }
        }

        stage('Commit and Push to GitOps Repo') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    script {
                        def namespace    = env.KUBE_NAMESPACE ?: 'dev'
                        def imageTag     = env.IMAGE_TAG      ?: "dev-${env.BUILD_NUMBER}"
                        def imageName    = env.IMAGE_NAME
                        def manifestPath = env.MANIFEST_PATH  ?: 'kubernetes/dev'
                        def gitopsBranch = env.GITOPS_BRANCH
                        def gitUser      = env.GIT_USER
                        def gitToken     = env.GIT_TOKEN

                        powershell """
                            cd gitops-repo
                            git config user.name "Jenkins CI"
                            git config user.email "jenkins@securehub.local"

                            \$status = git status --porcelain
                            if (\$status) {
                                git add ${manifestPath}/deployment.yaml
                                git commit -m "Update image to ${imageName}:${imageTag} for ${namespace} [skip ci]"
                                git push https://${gitUser}:${gitToken}@github.com/DavidUyaguariJ/SecureHub-GitOps.git ${gitopsBranch}
                                Write-Host "Cambios pusheados al repositorio GitOps"
                            } else {
                                Write-Host "No hay cambios para commitear"
                            }
                        """
                        echo "ArgoCD detectará y sincronizará automáticamente los cambios"
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                echo """
                    Pipeline completado exitosamente
                    Imagen: ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                    Ambiente: ${env.BUILD_ENV}
                    Namespace: ${env.KUBE_NAMESPACE}
                    Manifiestos: ${env.MANIFEST_PATH}/deployment.yaml
                """
            }
        }
        failure {
            echo "Pipeline falló. Revisa los logs para más detalles."
        }
    }
}
