pipeline {
    agent any

    environment {
        IMAGE_NAME = "securehub-frontend"
        KUBE_NAMESPACE = ""
        BUILD_ENV = ""
        IMAGE_TAG = ""
        GITOPS_REPO = "https://github.com/DavidUyaguariJ/SecureHub-Frontend.git"
        GITOPS_BRANCH = "master"
        MANIFEST_PATH = ""
    }

    stages {
        stage('Validate Branch') {
            steps {
                script {
                    def branch = env.BRANCH_NAME
                    def isPR = env.CHANGE_ID != null

                    if (isPR) {
                        error "Los Pull Requests no ejecutan pipeline."
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
                        env.KUBE_NAMESPACE = "dev"
                        env.IMAGE_TAG = "dev-${env.BUILD_NUMBER}"
                        env.MANIFEST_PATH = "kubernetes/dev"
                    } else if (branch.startsWith("stage")) {
                        env.BUILD_ENV = "pre"
                        env.KUBE_NAMESPACE = "stage"
                        env.IMAGE_TAG = "stage-${env.BUILD_NUMBER}"
                        env.MANIFEST_PATH = "kubernetes/stage"
                    } else if (branch == "master") {
                        env.BUILD_ENV = "production"
                        env.KUBE_NAMESPACE = "prod"
                        env.MANIFEST_PATH = "kubernetes/prod"
                        def version = sh(
                            script: "node -p \"require('./package.json').version\"",
                            returnStdout: true
                        ).trim()

                        env.IMAGE_TAG = version
                    }
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

                        sh """
                            docker build \
                                --build-arg BUILD_ENV=${buildEnv} \
                                -t ${DOCKER_USER}/${env.IMAGE_NAME}:${imageTag} .
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
                    sh """
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                    """
                }
            }
        }

        stage('Push Image') {
            steps {
                script {
                    def imageTag = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"

                    sh """
                        docker push ${DOCKER_USER}/${env.IMAGE_NAME}:${imageTag}
                    """
                }
            }
        }

        stage('GitOps Update') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_PASS'
                )]) {
                    script {

                        sh """
                            rm -rf gitops-repo
                            git clone https://${GIT_USER}:${GIT_PASS}@github.com/DavidUyaguariJ/SecureHub-Frontend.git gitops-repo
                        """

                        dir("gitops-repo") {

                            sh "mkdir -p ${env.MANIFEST_PATH}"

                            def template = readFile('../deployment-template.yaml')

                            def deployment = template
                                .replace('${NAMESPACE}', env.KUBE_NAMESPACE)
                                .replace('${IMAGE_TAG}', env.IMAGE_TAG)
                                .replace('${DOCKERHUB_USER}', env.DOCKER_USER)
                                .replace('${IMAGE_NAME}', env.IMAGE_NAME)

                            writeFile(
                                file: "${env.MANIFEST_PATH}/deployment.yaml",
                                text: deployment
                            )

                            sh """
                                git config user.name "Jenkins CI"
                                git config user.email "jenkins@local"

                                git add .

                                git diff --cached --quiet || git commit -m "Deploy ${env.KUBE_NAMESPACE} → ${env.IMAGE_TAG}"

                                git push origin ${GITOPS_BRANCH}
                            """
                        }
                    }
                }
            }
        }
    }
    post {
        success {
            echo "OK: ArgoCD hará deploy automático"
        }
        failure {
            echo "Pipeline falló"
        }
    }
}
