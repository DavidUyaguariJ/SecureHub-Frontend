pipeline {
    agent any

    triggers {
        pollSCM('')
    }

    environment {
        IMAGE_NAME = "securehub-frontend"
        KUBE_NAMESPACE = ""
        BUILD_ENV = ""
        IMAGE_TAG = ""
    }

    stages {
        stage('Validate Merge') {
            steps {
                script {
                    def branch = env.BRANCH_NAME
                    def isPR = env.CHANGE_ID != null

                    if (isPR) {
                        echo "Pull Request detectado - cancelando ejecucion"
                        error "El pipeline solo se ejecuta en merges, no en Pull Requests"
                    }

                    if (!(branch == "develop" || branch == "master" || branch.startsWith("stage"))) {
                        error "Branch no permitida: ${branch}"
                    }

                    def lastCommit = bat(
                        script: "git log -1 --pretty=%%B",
                        returnStdout: true
                    ).trim()

                    def isMergeCommit = lastCommit.startsWith("Merge")

                    if (!isMergeCommit && branch != "master") {
                        echo "Ultimo commit no es un merge: ${lastCommit}"
                        error "El pipeline solo se ejecuta en commits de merge"
                    }

                    echo "Pipeline ejecutandose por merge a ${branch}"
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

                    } else if (branch.startsWith("stage")) {
                        env.BUILD_ENV = "pre"
                        env.KUBE_NAMESPACE = "stage"
                        env.IMAGE_TAG = "pre-${env.BUILD_NUMBER}"

                    } else if (branch == "master") {
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

                    if (!env.BUILD_ENV || !env.IMAGE_TAG) {
                        error "No se pudieron establecer las variables de entorno"
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
                    bat """
                        docker build ^
                          --build-arg BUILD_ENV=${env.BUILD_ENV} ^
                          -t ${env.DOCKER_USER}/${env.IMAGE_NAME}:${env.IMAGE_TAG} .
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
                    bat """
                        docker push ${env.DOCKER_USER}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
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
                        def template = readFile('deployment-template.yaml')
                        def deployment = template
                            .replace('${NAMESPACE}', env.KUBE_NAMESPACE)
                            .replace('${IMAGE_TAG}', env.IMAGE_TAG)
                            .replace('${DOCKERHUB_USER}', env.DOCKER_USER)
                            .replace('${IMAGE_NAME}', env.IMAGE_NAME)
                        writeFile(file: 'deployment.yaml', text: deployment)
                    }
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
                bat "kubectl rollout status deployment/frontend -n ${env.KUBE_NAMESPACE}"
                bat "kubectl get pods -n ${env.KUBE_NAMESPACE}"
            }
        }
    }

    post {
        success {
            echo "Deploy exitoso por merge a ${env.BRANCH_NAME}"
        }
        failure {
            echo "Pipeline fallo"
        }
    }
}
