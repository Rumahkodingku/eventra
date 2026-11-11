FROM golang:1.27.3 AS build

WORKDIR /src
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate

FROM alpine:3.20

RUN apk add --no-cache ca-certificates \
  && addgroup -S eventra \
  && adduser -S -G eventra eventra

COPY --from=build /out/api /usr/local/bin/api
COPY --from=build /out/migrate /usr/local/bin/migrate
COPY apps/api/migrations /migrations

USER eventra
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/api"]
