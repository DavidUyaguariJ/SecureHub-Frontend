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
                    def buildEnv = ""
                    def kubeNamespace = ""
                    def imageTag = ""
                    def nodePort = ""
                    if (branch == "develop") {
                        buildEnv = "development"
                        kubeNamespace = "dev"
                        imageTag = "dev-${env.BUILD_NUMBER}"
                        nodePort = "30080"
                    } else if (branch.startsWith("stage")) {
                        buildEnv = "pre"
                        kubeNamespace = "stage"
                        imageTag = "stage-${env.BUILD_NUMBER}"
                        nodePort = "30081"
                    } else if (branch == "master") {
                        buildEnv = "production"
                        kubeNamespace = "prod"
                        nodePort = "30082"
                        def version = bat(
                            script: "node -p \"require('./package.json').version\"",
                            returnStdout: true
                        ).trim()
                        imageTag = version
                    }
                    env.BUILD_ENV = buildEnv
                    env.KUBE_NAMESPACE = kubeNamespace
                    env.IMAGE_TAG = imageTag
                    env.NODEPORT = nodePort
                    echo "BUILD_ENV: ${env.BUILD_ENV}"
                    echo "KUBE_NAMESPACE: ${env.KUBE_NAMESPACE}"
                    echo "IMAGE_TAG: ${env.IMAGE_TAG}"
                    echo "NODEPORT: ${env.NODEPORT}"
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
                        echo "Construyendo con configuracion: ${buildEnv}"
                        echo "Tag: ${env.DOCKER_USER}/${env.IMAGE_NAME}:${imageTag}"
                        bat """
                            docker build ^
                              --build-arg BUILD_ENV=${buildEnv} ^
                              -t ${env.DOCKER_USER}/${env.IMAGE_NAME}:${imageTag} .
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
                    bat """
                        echo ${env.DOCKER_PASS} | docker login -u ${env.DOCKER_USER} --password-stdin
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
                    script {
                        def imageTag = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"
                        echo "Empujando imagen: ${env.DOCKER_USER}/${env.IMAGE_NAME}:${imageTag}"
                        bat """
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
                bat """
                    git config user.name "jenkins"
                    git config user.email "jenkins@local"
                    git tag v${env.IMAGE_TAG}
                    git push origin v${env.IMAGE_TAG}
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
                    script {
                        def namespace = env.KUBE_NAMESPACE ?: "dev"
                        def imageTag = env.IMAGE_TAG ?: "dev-${env.BUILD_NUMBER}"
                        def dockerUser = env.DOCKER_USER ?: "daviduyaguarij"
                        def imageName = env.IMAGE_NAME ?: "securehub-frontend"
                        def nodePort = env.NODEPORT ?: "30080"
                        echo "Usando namespace: ${namespace}"
                        echo "Usando imageTag: ${imageTag}"
                        echo "Usando nodePort: ${nodePort}"
                        def template = readFile('deployment-template.yaml')
                        def deployment = template
                            .replace('${NAMESPACE}', namespace)
                            .replace('${IMAGE_TAG}', imageTag)
                            .replace('${DOCKERHUB_USER}', dockerUser)
                            .replace('${IMAGE_NAME}', imageName)
                            .replace('${NODEPORT}', nodePort)
                        writeFile(file: 'deployment.yaml', text: deployment)
                        echo "deployment.yaml generado correctamente"
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                script {
                    def namespace = env.KUBE_NAMESPACE ?: "dev"
                    def nodePort = 30080
                    if (namespace == "dev") {
                        nodePort = 30080
                    } else if (namespace == "stage") {
                        nodePort = 30081
                    } else if (namespace == "prod") {
                        nodePort = 30082
                    }
                    echo "Desplegando en namespace: ${namespace} con NodePort: ${nodePort}"
                    bat "kubectl apply -f deployment.yaml"
                    bat "timeout /t 2 /nobreak > nul"
                    bat """
                        kubectl patch service frontend -n ${namespace} --type='json' -p='[{"op": "replace", "path": "/spec/ports/0/nodePort", "value": ${nodePort}}]'
                    """
                }
            }
        }
        stage('Verify') {
            steps {
                script {
                    def namespace = env.KUBE_NAMESPACE ?: "dev"
                    bat "kubectl rollout status deployment/frontend -n ${namespace}"
                    bat "kubectl get pods -n ${namespace}"
                    bat "kubectl get svc -n ${namespace}"
                }
            }
        }
    }
    post {
        success {
            echo "Deploy exitoso en ambiente ${env.BUILD_ENV}"
        }
        failure {
            echo "Pipeline fallo"
        }
    }
}
