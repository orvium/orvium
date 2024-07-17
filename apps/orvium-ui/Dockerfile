# Usa una imagen de Node.js 20 como base para construir la aplicación
FROM node:20 as build

# Establece el directorio de trabajo
WORKDIR /app

# Copia el package.json y package-lock.json
COPY ../../package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

RUN npx nx cache clean

# Establece las variables de entorno necesarias para la construcción
ARG NG_APP_NAME
ARG NG_APP_PRODUCTION
ARG NG_APP_EXPERIMENTAL_FEATURES
ARG NG_APP_SERVICE_WORKERS
ARG NG_APP_PUBLIC_URL
ARG NG_APP_API_ENDPOINT
ARG NG_APP_VAPID_KEY
ARG NG_APP_AUTH_CLIENT_ID
ARG NG_APP_AUTH_AUDIENCE
ARG NG_APP_AUTH_REDIRECT
ARG NG_APP_SENTRY_DSN
ARG NG_APP_SENTRY_SAMPLE
ARG NG_APP_LOG_LEVEL
ARG NG_APP_TINYMCE_KEY
ARG NG_APP_S3_BUCKET

# Establece las variables de entorno en el contenedor
ENV NG_APP_NAME=$NG_APP_NAME \
    NG_APP_PRODUCTION=$NG_APP_PRODUCTION \
    NG_APP_EXPERIMENTAL_FEATURES=$NG_APP_EXPERIMENTAL_FEATURES \
    NG_APP_SERVICE_WORKERS=$NG_APP_SERVICE_WORKERS \
    NG_APP_PUBLIC_URL=$NG_APP_PUBLIC_URL \
    NG_APP_API_ENDPOINT=$NG_APP_API_ENDPOINT \
    NG_APP_VAPID_KEY=$NG_APP_VAPID_KEY \
    NG_APP_AUTH_CLIENT_ID=$NG_APP_AUTH_CLIENT_ID \
    NG_APP_AUTH_AUDIENCE=$NG_APP_AUTH_AUDIENCE \
    NG_APP_AUTH_REDIRECT=$NG_APP_AUTH_REDIRECT \
    NG_APP_SENTRY_DSN=$NG_APP_SENTRY_DSN \
    NG_APP_SENTRY_SAMPLE=$NG_APP_SENTRY_SAMPLE \
    NG_APP_LOG_LEVEL=$NG_APP_LOG_LEVEL \
    NG_APP_TINYMCE_KEY=$NG_APP_TINYMCE_KEY \
    NG_APP_S3_BUCKET=$NG_APP_S3_BUCKET

# Construye la aplicación para producción
RUN npx nx reset && npx nx run orvium-ui:build:development

# Usa una imagen de nginx para servir la aplicación
FROM nginx:alpine

# Copia los archivos construidos de la etapa anterior
COPY --from=build /app/dist/apps/orvium-ui/browser/browser /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Comando para ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]
