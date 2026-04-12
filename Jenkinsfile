pipeline {
    agent any

    environment {
        IMAGE_NAME = "securehub-frontend"
        BUILD_ENV = ""
        IMAGE_TAG = ""
        NAMESPACE = ""
        K8S_REPO = "https://github.com/DavidUyaguariJ/SecureHub-Frontend.git"
        K8S_BRANCH = "main"
    }

    stages {

        stage('Validate Branch') {
            steps {
                script {
                    def branch = env.BRANCH_NAME
                    def isPR = env.CHANGE_ID != null

                    if (isPR) {
                        error "PR no permitido"
                    }

                    if (!(branch == "develop" || branch == "master" || branch.startsWith("stage"))) {
                        error "Branch no permitida: ${branch}"
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
                    def branch = env.BRANCH_NAME

                    if (branch == "develop") {
                        env.BUILD_ENV = "development"
                        env.IMAGE_TAG = "dev-${env.BUILD_NUMBER}"
                        env.NAMESPACE = "dev"

                    } else if (branch.startsWith("stage")) {
                        env.BUILD_ENV = "pre"
                        env.IMAGE_TAG = "stage-${env.BUILD_NUMBER}"
                        env.NAMESPACE = "stage"

                    } else if (branch == "master") {
                        env.BUILD_ENV = "production"
                        env.NAMESPACE = "prod"

                        def version = sh(
                            script: "node -p \"require('./package.json').version\"",
                            returnStdout: true
                        ).trim()

                        env.IMAGE_TAG = version
                    }
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        def FULL_IMAGE = "${DOCKER_USER}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"

                        sh """
                            docker build \
                              --build-arg BUILD_ENV=${env.BUILD_ENV} \
                              -t ${FULL_IMAGE} .
                        """

                        sh """
                            echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                            docker push ${FULL_IMAGE}
                        """

                        env.FULL_IMAGE = FULL_IMAGE
                    }
                }
            }
        }

        stage('GitOps Update (Argo CD)') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'github-creds',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_PASS'
                    ),
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    script {
                        sh """
                            rm -rf k8s-repo
                            git clone https://${GIT_USER}:${GIT_PASS}@github.com/DavidUyaguariJ/SecureHub-Frontend.git k8s-repo
                        """
                        dir("k8s-repo") {
                            def path = "kubernetes/${env.NAMESPACE}"
                            sh "mkdir -p ${path}"
                            sh """
                                sed -e 's|\\\${NAMESPACE}|${env.NAMESPACE}|g' \
                                    -e 's|\\\${DOCKERHUB_USER}|${DOCKER_USER}|g' \
                                    -e 's|\\\${IMAGE_NAME}|${env.IMAGE_NAME}|g' \
                                    -e 's|\\\${IMAGE_TAG}|${env.IMAGE_TAG}|g' \
                                    deployment-template.yaml > ${path}/deployment.yaml
                            """
                            sh """
                                git config user.name "jenkins"
                                git config user.email "jenkins@local"
                                git add .
                                git diff --cached --quiet || git commit -m "Deploy ${env.NAMESPACE} → ${env.IMAGE_TAG}"
                                git push origin ${env.K8S_BRANCH}
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Ok: ArgoCD despliega automáticamente"
        }
        failure {
            echo "Pipeline falló"
        }
    }
}
