FROM eclipse-temurin:21-jre-jammy

ARG JENA_VERSION=6.2.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl --fail --location --retry 3 \
      "https://dlcdn.apache.org/jena/binaries/apache-jena-fuseki-${JENA_VERSION}.tar.gz" \
      --output /tmp/fuseki.tar.gz \
    && mkdir -p /opt/fuseki /fuseki/databases \
    && tar -xzf /tmp/fuseki.tar.gz --strip-components=1 -C /opt/fuseki \
    && rm -rf /var/lib/apt/lists/* /tmp/fuseki.tar.gz \
    && useradd --system --uid 10001 --home /fuseki --shell /usr/sbin/nologin fuseki \
    && chown -R fuseki:fuseki /fuseki

USER fuseki
WORKDIR /fuseki
EXPOSE 3030

ENTRYPOINT ["/opt/fuseki/fuseki-server"]
