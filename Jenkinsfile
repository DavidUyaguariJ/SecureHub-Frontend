pipeline {
    agent any

    environment {
        IMAGE_NAME = "securehub-frontend"
        KUBE_NAMESPACE = ""
        BUILD_ENV = ""
        IMAGE_TAG = ""
    }

    stages {

        stage('Validate Branch') {
            steps {
                script {
                    if (!(env.BRANCH_NAME == "develop" ||
                          env.BRANCH_NAME == "master" ||
                          env.BRANCH_NAME.startsWith("stage"))) {
                        error "Branch no permitida: ${env.BRANCH_NAME}"
                    }
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
                    if (env.BRANCH_NAME == "develop") {
                        env.BUILD_ENV = "development"
                        env.KUBE_NAMESPACE = "dev"
                        env.IMAGE_TAG = "dev-${env.BUILD_NUMBER}"

                    } else if (env.BRANCH_NAME.startsWith("stage")) {
                        env.BUILD_ENV = "pre"
                        env.KUBE_NAMESPACE = "stage"
                        env.IMAGE_TAG = "pre-${env.BUILD_NUMBER}"

                    } else if (env.BRANCH_NAME == "master") {
                        env.BUILD_ENV = "production"
                        env.KUBE_NAMESPACE = "prod"

                        def version = bat(
                            script: "node -p \"require('./package.json').version\"",
                            returnStdout: true
                        ).trim()

                        env.IMAGE_TAG = version
                    }

                    echo "ENV=${env.BUILD_ENV}"
                    echo "NAMESPACE=${env.KUBE_NAMESPACE}"
                    echo "TAG=${env.IMAGE_TAG}"
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
                    bat """
                    docker build ^
                      --build-arg BUILD_ENV=${BUILD_ENV} ^
                      -t %DOCKER_USER%/${IMAGE_NAME}:${IMAGE_TAG} .
                    """
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
                    bat """
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    """
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
                    bat """
                    docker push %DOCKER_USER%/${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Tag Git (solo master)') {
            when {
                branch 'master'
            }
            steps {
                bat """
                git config user.name "jenkins"
                git config user.email "jenkins@local"
                git tag v${IMAGE_TAG}
                git push origin v${IMAGE_TAG}
                """
            }
        }

        stage('Prepare Deployment YAML') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat """
                    powershell -Command "(Get-Content deployment-template.yaml) `
                    -replace '\\$\\{NAMESPACE\\}', '${KUBE_NAMESPACE}' `
                    -replace '\\$\\{IMAGE_TAG\\}', '${IMAGE_TAG}' `
                    -replace '\\$\\{DOCKERHUB_USER\\}', '%DOCKER_USER%' `
                    -replace '\\$\\{IMAGE_NAME\\}', '${IMAGE_NAME}' |
                    Set-Content deployment.yaml"
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                bat "kubectl apply -f deployment.yaml"
            }
        }

        stage('Verify') {
            steps {
                bat "kubectl rollout status deployment/frontend -n ${KUBE_NAMESPACE}"
                bat "kubectl get pods -n ${KUBE_NAMESPACE}"
            }
        }
    }

    post {
        success {
            echo "Deploy exitoso"
        }
        failure {
            echo "Falló el pipeline"
        }
    }
}
