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
                    def branch = env.BRANCH_NAME
                    def isPR = env.CHANGE_ID != null
                    if (isPR) {
                        error "Los Pull Requests no ejecutan pipeline. Solo se ejecuta en merges."
                    }
                    if (!(branch == "develop" || branch == "master" || branch.startsWith("stage"))) {
                        error "Branch no permitida: ${branch}"
                    }
                    echo "Ejecutando pipeline para branch: ${branch}"
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
                    def branch = env.BRANCH_NAME

                    if (branch == "develop") {
                        env.BUILD_ENV = "development"
                        env.KUBE_NAMESPACE = "dev"
                        env.IMAGE_TAG = "dev-${env.BUILD_NUMBER}"
                        env.MANIFEST_PATH = "kubernetes/dev"
                    } else if (branch.startsWith("stage")) {
                        env.BUILD_ENV = "pre"
                        env.KUBE_NAMESPACE = "stage"
                        env.IMAGE_TAG = "stage-${env.BUILD_NUMBER}"
                        env.MANIFEST_PATH = "kubernetes/pre"
                    } else if (branch == "master") {
                        env.BUILD_ENV = "production"
                        env.KUBE_NAMESPACE = "prod"
                        env.MANIFEST_PATH = "kubernetes/prod"

                        def version = powershell(
                            script: "node -p \"require('./package.json').version\"",
                            returnStdout: true
                        ).trim()
                        env.IMAGE_TAG = version
                    }
                    echo "BUILD_ENV: ${env.BUILD_ENV}"
                    echo "KUBE_NAMESPACE: ${env.KUBE_NAMESPACE}"
                    echo "IMAGE_TAG: ${env.IMAGE_TAG}"
                    echo "MANIFEST_PATH: ${env.MANIFEST_PATH}"
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
                        def buildEnv = env.BUILD_ENV ?: "development"
                        def imageTag = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"
                        powershell """
                            docker build `
                                --build-arg BUILD_ENV=${buildEnv} `
                                -t ${env.DOCKER_USER}/${env.IMAGE_NAME}:${imageTag} `
                                -f Dockerfile .
                        """
                        env.IMAGE_TAG = imageTag
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
                    powershell '''
                        echo $env:DOCKER_PASS | docker login -u $env:DOCKER_USER --password-stdin
                    '''
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
                        def imageTag = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"
                        powershell """
                            docker push ${env.DOCKER_USER}/${env.IMAGE_NAME}:${imageTag}
                        """
                    }
                }
            }
        }
        stage('Tag Git (solo master)') {
            when {
                branch 'master'
            }
            steps {
                powershell '''
                    git config user.name "jenkins"
                    git config user.email "jenkins@local"
                    git tag "v$env:IMAGE_TAG"
                    git push origin "v$env:IMAGE_TAG"
                '''
            }
        }
        stage('Checkout GitOps Repo') {
            steps {
                powershell """
                    if (Test-Path "gitops-repo") {
                        Remove-Item -Recurse -Force "gitops-repo"
                    }
                    git clone ${GITOPS_REPO} gitops-repo
                    cd gitops-repo
                    git checkout ${GITOPS_BRANCH}
                """
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
                        def namespace = env.KUBE_NAMESPACE ?: "dev"
                        def imageTag = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"
                        def dockerUser = env.DOCKER_USER ?: "daviduyaguarij"
                        def imageName = env.IMAGE_NAME ?: "securehub-frontend"
                        def manifestPath = env.MANIFEST_PATH ?: "kubernetes/dev"
                        def template = readFile('deployment-template.yaml')
                        def deployment = template
                            .replace('${NAMESPACE}', namespace)
                            .replace('${IMAGE_TAG}', imageTag)
                            .replace('${DOCKERHUB_USER}', dockerUser)
                            .replace('${IMAGE_NAME}', imageName)
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
                script {
                    def namespace = env.KUBE_NAMESPACE ?: "dev"
                    def imageTag = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"

                    powershell """
                        cd gitops-repo
                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@securehub.local"

                        # Verificar si hay cambios
                        \$status = git status --porcelain
                        if (\$status) {
                            git add ${env.MANIFEST_PATH}/deployment.yaml
                            git commit -m "Update image to ${IMAGE_NAME}:${imageTag} for ${namespace} [skip ci]"
                            git push origin ${GITOPS_BRANCH}
                            Write-Host "Cambios pusheados al repositorio GitOps"
                        } else {
                            Write-Host "ℹNo hay cambios para commitear"
                        }
                    """
                    echo "ArgoCD detectará y sincronizará automáticamente los cambios"
                }
            }
        }
    }

    post {
        success {
            echo """
                Pipeline completado exitosamente
                Imagen: ${env.DOCKER_USER}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
                Ambiente: ${env.BUILD_ENV}
                Namespace: ${env.KUBE_NAMESPACE}
                Manifiestos: ${env.MANIFEST_PATH}/deployment.yaml
                ArgoCD sincronizará automáticamente
            """
        }
        failure {
            echo "Pipeline falló. Revisa los logs para más detalles."
        }
    }
}
