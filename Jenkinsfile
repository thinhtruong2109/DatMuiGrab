pipeline {
    agent any

    environment {
        BACKEND_IMAGE = "thinhtruong210904/grab-dat-mui-backend:latest"
        FRONTEND_IMAGE = "thinhtruong210904/grab-dat-mui-frontend:latest"
    }

    stages {
        stage('Detect changes') {
            steps {
                script {
                    def changedFiles = sh(
                        script: "git diff --name-only HEAD~1 HEAD",
                        returnStdout: true
                    ).trim()

                    env.BUILD_BACKEND = (changedFiles.contains('backend/datmuigrab/') || changedFiles.contains('docker-compose.yml') || changedFiles.contains('.env')) ? 'true' : 'false'
                    env.BUILD_FRONTEND = (changedFiles.contains('frontend-web/') || changedFiles.contains('docker-compose.yml')) ? 'true' : 'false'

                    echo "Changed files:\n${changedFiles}"
                    echo "Build backend: ${env.BUILD_BACKEND}"
                    echo "Build frontend: ${env.BUILD_FRONTEND}"
                }
            }
        }

        stage('Docker login') {
            when { expression { env.BUILD_BACKEND == 'true' || env.BUILD_FRONTEND == 'true' } }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Build & push backend') {
            when { expression { env.BUILD_BACKEND == 'true' } }
            steps {
                sh '''
                    docker buildx create --name datmuigrab-builder --use >/dev/null 2>&1 || docker buildx use datmuigrab-builder
                    docker buildx build \
                      --platform linux/amd64,linux/arm64 \
                      -t ${BACKEND_IMAGE} \
                      --push \
                      ./backend/datmuigrab
                '''
            }
        }

        stage('Build & push frontend') {
            when { expression { env.BUILD_FRONTEND == 'true' } }
            steps {
                sh '''
                    docker buildx create --name datmuigrab-builder --use >/dev/null 2>&1 || docker buildx use datmuigrab-builder
                    docker buildx build \
                      --platform linux/amd64,linux/arm64 \
                      -t ${FRONTEND_IMAGE} \
                      --push \
                      ./frontend-web
                '''
            }
        }

        stage('Deploy backend') {
            when { expression { env.BUILD_BACKEND == 'true' } }
            steps {
                dir("/home/ubuntu/datmuigrab") {
                    sh '''
                        docker pull ${BACKEND_IMAGE}
                        docker compose stop backend
                        docker compose rm -f backend
                        docker compose up -d backend
                    '''
                }
            }
        }

        stage('Deploy frontend') {
            when { expression { env.BUILD_FRONTEND == 'true' } }
            steps {
                dir("/home/ubuntu/datmuigrab") {
                    sh '''
                        docker pull ${FRONTEND_IMAGE}
                        docker compose stop frontend
                        docker compose rm -f frontend
                        docker compose up -d frontend
                    '''
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker builder prune -f --filter "until=24h"
                docker image prune -f
            '''
        }
        success {
            echo 'Deploy thanh cong!'
        }
        failure {
            echo 'Deploy that bai, kiem tra log!'
        }
    }
}
