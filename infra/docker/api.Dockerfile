FROM golang:1.27.4 AS build

WORKDIR /src
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/worker ./cmd/worker
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/seed ./cmd/seed
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/seed-catalog ./cmd/seed-catalog

FROM alpine:3.20

RUN apk add --no-cache ca-certificates \
  && addgroup -S eventra \
  && adduser -S -G eventra eventra

COPY --from=build /out/api /usr/local/bin/api
COPY --from=build /out/migrate /usr/local/bin/migrate
COPY --from=build /out/worker /usr/local/bin/worker
COPY --from=build /out/seed /usr/local/bin/seed
COPY --from=build /out/seed-catalog /usr/local/bin/seed-catalog
COPY apps/api/migrations /migrations
COPY apps/api/seed /seed

USER eventra
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/api"]
