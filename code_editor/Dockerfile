
#base image  openjdk version
FROM eclipse-temurin:21-jre-alpine

#working Dir
WORKDIR /app
#copy files
COPY  target/code_editor-0.0.1-SNAPSHOT.jar app.jar


RUN apk update && apk add --no-cache \
    nodejs \
    npm \
    g++ \
    make \
    openjdk17-jdk


#Expose the working  port
EXPOSE 9090

#startup command
ENTRYPOINT ["java", "-jar", "app.jar"]
