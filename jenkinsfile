pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "daviduyaguarij"
        IMAGE_NAME = "securehub-frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Set Environment') {
            steps {
                script {

                    def version = sh(
                        script: "node -p \"require('./package.json').version\"",
                        returnStdout: true
                    ).trim()

                    if (env.BRANCH_NAME == "develop") {
                        env.BUILD_ENV = "development"
                        env.KUBE_NAMESPACE = "dev"
                        env.IMAGE_TAG = "dev-${env.BUILD_NUMBER}"

                    } else if (env.BRANCH_NAME.startsWith("stage")) {
                        env.BUILD_ENV = "pre"
                        env.KUBE_NAMESPACE = "stage"
                        env.IMAGE_TAG = "pre-${version}"

                    } else if (env.BRANCH_NAME == "master") {
                        env.BUILD_ENV = "production"
                        env.KUBE_NAMESPACE = "prod"
                        env.IMAGE_TAG = version

                    } else {
                        error "Rama no soportada: ${env.BRANCH_NAME}"
                    }

                    echo "Branch: ${env.BRANCH_NAME}"
                    echo "BUILD_ENV: ${env.BUILD_ENV}"
                    echo "NAMESPACE: ${env.KUBE_NAMESPACE}"
                    echo "IMAGE_TAG: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                docker build \
                  --build-arg BUILD_ENV=${BUILD_ENV} \
                  -t ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage('Login DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh """
                    echo \$PASS | docker login -u \$USER --password-stdin
                    """
                }
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Tag Git (solo master)') {
            when {
                branch 'master'
            }
            steps {
                script {
                    sh """
                    git config user.name "jenkins"
                    git config user.email "jenkins@local"

                    git tag v${IMAGE_TAG}
                    git push origin v${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                export NAMESPACE=${KUBE_NAMESPACE}
                export IMAGE_TAG=${IMAGE_TAG}
                export DOCKERHUB_USER=${DOCKERHUB_USER}
                export IMAGE_NAME=${IMAGE_NAME}

                envsubst < deployment-template.yaml | kubectl apply -f -
                kubectl apply -f service.yaml
            """
            }
        }

        stage('Verify') {
            steps {
                sh """
                kubectl rollout status deployment/frontend -n ${KUBE_NAMESPACE}
                """
            }
        }
    }
}
